'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var expressHbs = require("express3-handlebars");
var bodyParser = require("body-parser");
var Handlebars = require("handlebars");
var fetch = require("node-fetch");
var https = require("https");
var querystring = require("querystring");

var app = express();
require('dotenv').load();
require('./app/config/passport')(passport);

mongoose.connect(process.env.MONGO_URI);
mongoose.Promise = global.Promise;

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

app.use(session({
	secret: 'secretClementine',
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.engine('hbs', expressHbs.create({
	extname:'hbs',
	defaultLayout:'main.hbs',
	helpers: {
	    encode: function(str) {
	      return encodeURIComponent(str);
	    }
	}
}).engine);
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var post_data = querystring.stringify({
  'grant_type' : 'client_credentials',
  'client_id': process.env.YELP_KEY,
  'client_secret': process.env.YELP_SECRET
});

// An object of options to indicate where to post to
var post_options = {
  host: 'api.yelp.com',
  path: '/oauth2/token',
  method: 'POST',
  headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(post_data)
  }
};

// Set up the request
var post_req = https.request(post_options, function(res) {
  res.setEncoding('utf8');
  let total = "";
  res.on('data', function (chunk) {
	total += chunk;
	console.log(total);
  });
  
  res.on("end", () => {
  	console.log(total);
  	routes(app, passport, fetch, JSON.parse(total).access_token);

	var port = process.env.PORT || 8080;
	app.listen(port,  function () {
		console.log('Node.js listening on port ' + port + '...');
	});
  });
  
  res.on("error", (err) => {
  	console.log(err);
  })
});

// post the data
post_req.write(post_data);
post_req.end();

