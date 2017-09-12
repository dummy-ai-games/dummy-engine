/**
 * Created by the-engine team
 * 2017-09-01
 */

require('../poem/configuration/constants');
var Enums = require('./../constants/enums');
var enums = new Enums();

exports.setupEnvironment = function () {
    var env = process.env.NODE_ENV || 'development';
    ENV = env;
    if (undefined == typeof env || null == env || "" == env || enums.APP_PRODUCTION_MODE == env) {
        LISTEN_PORT = "3000";
        MAIN_SERVER_ADDRESS = "10.64.71.144";
        MAIN_SERVER_PORT = 3000;
        MONGO_DB_URI = "mongodb://127.0.0.1:27017/the_game";
        MONGO_DB_SERVER_ADDRESS = "127.0.0.1";
        MONGO_DB_NAME = "the_game";
        MONGO_DB_USER = 'admin';
        MONGO_DB_PASSWORD = '123456';
    } else if (enums.APP_DEVELOPMENT_MODE == env) {
        LISTEN_PORT = "3000";
        MAIN_SERVER_ADDRESS = "127.0.0.1";
        MAIN_SERVER_PORT = 3000;
        MONGO_DB_URI = "mongodb://127.0.0.1:27017/the_game";
        MONGO_DB_SERVER_ADDRESS = "127.0.0.1";
        MONGO_DB_NAME = "the_game";
        MONGO_DB_USER = 'admin';
        MONGO_DB_PASSWORD = '123456';
    } else if (enums.APP_USERDEBUG_MODE == env) {
        LISTEN_PORT = "3000";
        MAIN_SERVER_ADDRESS = "10.64.71.144";
        MAIN_SERVER_PORT = 3000;
        MONGO_DB_URI = "mongodb://127.0.0.1:27017/the_game";
        MONGO_DB_SERVER_ADDRESS = "127.0.0.1";
        MONGO_DB_NAME = "the_game";
        MONGO_DB_USER = 'admin';
        MONGO_DB_PASSWORD = '123456';
    }
};
