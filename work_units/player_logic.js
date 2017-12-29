/**
 * created by Elsie
 * 2017-11-26
 */

require('../poem/configuration/constants');
var logger = require('../poem/logging/logger4js').helper;
var playerDao = require('../models/player_dao');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
var SmsSender = require('../poem/sms/sms_sender');

var PlayerAuth = require('../authority/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);


exports.registerWorkUnit = function (player, callback) {
    var conditions = {
        phoneNumber: player.phoneNumber
    };
    playerDao.getPlayer(conditions, function (getPlayerErr, players) {
        // take care ! the object getPlayerErr or so contains 2 fields : code & cause,
        // you should compare the someErrorCode.code with the code field of the callback result, not just someErrorCode
        // itself, eg. 'if(getPlayerErr === errorCode.SUCCESS.code)' is NOT correct, however,
        // 'if(getPlayerErr.code === errorCode.SUCCESS.code)' is OK
        logger.info("get players : " + JSON.stringify(getPlayerErr) + ", " + JSON.stringify(players));
        if (getPlayerErr.code === errorCode.SUCCESS.code && players !== null && players.length > 0) {
            logger.info("player : " + players[0].phoneNumber + " already exist");
            callback(errorCode.PLAYER_EXIST, null);
        } else {
            // player dose not exist, create one
            logger.info("player not exist, create a new one");
            playerDao.createPlayer(player, function (createPlayerErr, result) {
                logger.info("create player result = " + JSON.stringify(createPlayerErr) + ", " + JSON.stringify(result));
                if (errorCode.SUCCESS.code === createPlayerErr.code && null !== result.ops &&
                    result.ops.length > 0) {
                    // generate token and save to cache
                    logger.info("create a user successful.");
                    callback(errorCode.SUCCESS, result);
                } else {
                    logger.info("create a user failed.");
                    callback(errorCode.FAILED, null);
                }
            });
        }
    });
};

exports.getPlayerWorkUnit = function (phoneNumber, password, callback) {
    var conditions = {
        phoneNumber: phoneNumber,
        password: password
    };

    // the DB query condition statement is described using conditions variable,
    // in some cases, the variable does not cover all the fields of the DB
    // table data-structure, eg. if you only want to filter player by phoneNumber
    // the conditions should be { phoneNumber: <some phone number> }
    playerDao.getPlayer(conditions, function (getPlayerErr, players) {
        logger.info("get players result : " + JSON.stringify(getPlayerErr) + ", " + JSON.stringify(players));
        if (getPlayerErr.code === errorCode.SUCCESS.code && players !== null && players.length > 0) {
            logger.info("player: " + phoneNumber + " exist");
            callback(errorCode.SUCCESS, players);
        } else {
            // user not exist
            logger.info("player: " + phoneNumber + " not exist");
            callback(errorCode.FAILED, null);
        }
    });
};

exports.getPlayerByPhoneNumberWorkUnit = function (phoneNumber, callback) {
    var conditions = {
        phoneNumber: phoneNumber
    };
    playerDao.getPlayer(conditions, function (getPlayerErr, players) {
        logger.info("get players result : " + JSON.stringify(getPlayerErr) + ", " + JSON.stringify(players));
        if (getPlayerErr.code === errorCode.SUCCESS.code && players !== null && players.length > 0) {
            logger.info("player: " + phoneNumber + " exist");
            callback(errorCode.SUCCESS, players);
        } else {
            // user not exist
            logger.info("player: " + phoneNumber + " not exist");
            callback(errorCode.FAILED, null);
        }
    });
};


exports.verifyTokenWorkUnit = function (key, value, callback) {
    playerAuth.validateAuthInfo(key, value, function (validatePlayerAuthErr, result) {
        if (validatePlayerAuthErr.code !== errorCode.SUCCESS.code) {
            logger.info("token validation failed");
        }
        callback(validatePlayerAuthErr, result);
    });
};

exports.getPhoneNumberByTokenWorkUnit = function (token, callback) {
    playerAuth.getAuthInfo(token, function (getValueErr, value) {
        if (getValueErr.code !== errorCode.SUCCESS.code) {
            callback(getValueErr, null);
        } else {
            callback(getValueErr, value);
        }
    });
};


exports.sendVerifyKeyWorkUnit = function (phoneNumber, verificationCode, callback) {
    var sender = new SmsSender(SMS_ACCESSKEY_ID, SMS_ACCESSKEY_SEC, SMS_SIGN_NAME, SMS_TEMP_NAME);
    sender.sendVerifyKey(phoneNumber, verificationCode, function (sendErr) {
        if (sendErr === errorCode.SUCCESS.code) {
            logger.info("send verification succeed in player_logic.");
        } else {
            logger.info("send verification fail in player_logic.");
        }
        callback(sendErr);
    });
};
