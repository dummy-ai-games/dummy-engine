/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var playerDao = require('../models/player_dao');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
//var MD5Utils = require('../poem/crypto/md5');

/**
 * register function
 * @param user: Json format user info
 * @param callback: {errorCode.PLAYER_EXIST, errorCode.SUCCESS, errorCode.FAILED}
 */
exports.registerWorkUnit = function (user, callback) {
    var userKey = {
        phoneNumber: user.phoneNumber
    };
    playerDao.getUser(userKey, function (getUserErr, res) {
        //user already existed with this phoneNumber
        if (getUserErr === errorCode.SUCCESS.code && res != null && res.length > 0) {
            logger.info("user: " + res[0] + " already exist.");
            callback(errorCode.PLAYER_EXIST,null);
        } else {
            //user not exist, create one
            logger.info("user not exist ,create one.");
            playerDao.createUser(user, function (createUserErr,res) {
                callback(createUserErr,res);
            });
        }
    });
};

exports.getUserWorkUnit = function (user, callback) {
    playerDao.getUser(user, function (getUserErr, players) {
        // user exist
        if (getUserErr === errorCode.SUCCESS.code && players != null && players.length > 0) {
            logger.info("this player: " + user + " exist in db");
            callback(getUserErr, players);
        } else {
            // user not exist
            logger.info("player: " + user + " not exist in db.");
            callback(errorCode.FAILED, null);
        }
    });
};
