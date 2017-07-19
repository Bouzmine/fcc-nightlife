'use strict';

var path = process.cwd();
var User = require("../models/users");
var Bar = require("../models/bars");

module.exports = function (app, passport, fetch, yelpToken) {

	app.route('/')
		.get(function (req, res) {
			res.render("index");
		});

	app.route('/results')
		.get(function (req, res) {
			fetch("https://api.yelp.com/v3/businesses/search?location=" + encodeURIComponent(req.query.query) + "&categories=bars", {
				headers: {
					"Authorization": "Bearer " + yelpToken 
				}
			}).then((result) => result.json()).then((yelpResults) => {
				Bar.find().exec((err, bars) => {
					if(err) {
						throw err;
					}
					
					let goingBars = {};
					bars.forEach((val) => {
						goingBars[val.yelpId] = val.usersGoing;
					});
					console.log(bars, goingBars);
					let finalBars = yelpResults.businesses.map((val) => {
						if(goingBars[val.id]) {
							val.going = goingBars[val.id];
						}else {
							val.going = 0;
						}
						
						return val;
					});
					
					res.render("results", {
						bars: finalBars,
						query: req.query.query
					});
				});
			}).catch((err) => {
				console.log(err);
			});
		});

	app.route('/api/going/:id/:query')
		.get(function (req, res, next) {
			if (req.isAuthenticated()) {
				return next();
			} else {
				req.session.back = req.originalUrl;
				res.redirect("/auth/github");
			}
		}, function (req, res) {
			User.findOne({ _id: req.user.id }).exec((err, user) => {
				if(err) {
					return console.log(err);
				}
				
				console.log("Yelp ID", req.params.id);
				
				Bar.findOneOrCreate ( { yelpId: req.params.id }, {
					yelpId: req.params.id,
					usersGoing: 0
				}, (err, bar) => {
					if(err) {
						throw err;
					}
					
					console.log(bar);
					
					let index = user.goingTo.indexOf(req.params.id);
					if(index == -1) {
						user.goingTo.push(req.params.id);
						user.save();
						
						bar.usersGoing += 1;
						bar.save();
					}else {
						user.goingTo.splice(index, 1);
						user.save();
						
						bar.usersGoing -= 1;
						bar.save();
					}
					
					res.redirect("/results?query=" + req.params.query);
				});
			});
		});

	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/auth/back',
			failureRedirect: '/'
		}));
		
	app.get('/auth/back', function(req, res){
	  var tmp = req.session.back;
	  delete req.session.back;
	  res.redirect(tmp);
	});
};
