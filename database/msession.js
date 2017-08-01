var Settings = require('./settings');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server; 
var db = new Db(Settings.DB, new Server(Settings.HOST, Settings.PORT, {auto_reconnect: true, poolSize: 4}),{safe:true});

module.exports = db;