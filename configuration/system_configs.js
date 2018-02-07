/**
 * Created by dummy team
 * 2017-09-01
 */

require('../poem/configuration/constants');
var Enums = require('../constants/enums');
var enums = new Enums();

exports.setupEnvironment = function () {
    var env = process.env.NODE_ENV || 'development';
    ENV = env;
    if (undefined === typeof env || null === env || "" === env || enums.APP_DEVELOPMENT_MODE === env) {
        LISTEN_PORT = "8080";
        MONGO_DB_SERVER_ADDRESS = "127.0.0.1";
        MONGO_DB_NAME = "dummy_game";
        MONGO_DB_USER = 'admin';
        MONGO_DB_PASSWORD = '123456';
        REDIS_HOST = "127.0.0.1";
        REDIS_PORT = "6379";
        REDIS_PASSWORD = null;
        SMS_ACCESSKEY_ID = "T82nbipHSESmHzd8";
        SMS_ACCESSKEY_SEC = "SOweQ8UVwCwPr2NC8EC89EOeKJc5Um";
        SMS_TEMP_NAME = "SMS_117522803";
        SMS_SIGN_NAME = "大米AI编程平台";
    } else if (enums.APP_PRODUCTION_MODE === env) {
        LISTEN_PORT = "8080";
        MONGO_DB_SERVER_ADDRESS = "dds-bp1c406c74fc47441.mongodb.rds.aliyuncs.com";
        MONGO_DB_NAME = "dummy_game";
        MONGO_DB_USER = 'root';
        MONGO_DB_PASSWORD = 'DummyVip2017';
        REDIS_HOST = "r-bp1a37af93df7844.redis.rds.aliyuncs.com";
        REDIS_PORT = "6379";
        REDIS_PASSWORD = "IRext1234";
        SMS_ACCESSKEY_ID = "T82nbipHSESmHzd8";
        SMS_ACCESSKEY_SEC = "SOweQ8UVwCwPr2NC8EC89EOeKJc5Um";
        SMS_TEMP_NAME = "SMS_117522803";
        SMS_SIGN_NAME = "大米AI编程平台";
    } else if (enums.APP_USERDEBUG_MODE === env) {
        LISTEN_PORT = "8080";
        MONGO_DB_SERVER_ADDRESS = "127.0.0.1";
        MONGO_DB_NAME = "dummy_game";
        MONGO_DB_USER = 'admin';
        MONGO_DB_PASSWORD = '123456';
        REDIS_HOST = "127.0.0.1";
        REDIS_PORT = "6379";
        REDIS_PASSWORD = null;
        SMS_ACCESSKEY_ID = "T82nbipHSESmHzd8";
        SMS_ACCESSKEY_SEC = "SOweQ8UVwCwPr2NC8EC89EOeKJc5Um";
        SMS_TEMP_NAME = "SMS_117522803";
        SMS_SIGN_NAME = "大米AI编程平台";
    }
};
