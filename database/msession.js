/**
 * Created by dummy team
 * 2017-09-08
 */

var constants = require('../poem/configuration/constants');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;

var db = new Db(MONGO_DB_NAME, new Server(MONGO_DB_SERVER_ADDRESS, 27017, {auto_reconnect: true, poolSize: 4}),{safe:true});

module.exports = db;