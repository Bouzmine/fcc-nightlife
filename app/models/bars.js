'use strict';

var mongoose = require('mongoose');
var findOneOrCreate = require("mongoose-find-one-or-create");
var Schema = mongoose.Schema;

var Bar = new Schema({
	yelpId: String,
   usersGoing: Number
});

Bar.plugin(findOneOrCreate);

module.exports = mongoose.model('Bar', Bar);
