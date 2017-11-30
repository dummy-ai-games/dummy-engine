/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var userDao = require('../models/user_dao');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
//var MD5Utils = require('../poem/crypto/md5');

/**
 * register function
 * @param user: Json format user info
 * @param callback: {errorCode.USER_EXIST, errorCode.SUCCESS, errorCode.FAILED}
 */
exports.registerWorkUnit = function (user, callback) {
    var userKey = {
        phoneNumber: user.phoneNumber
    };
    userDao.getUser(userKey, function (getUserErr, res) {
        //user already existed with this phoneNumber
        if (getUserErr === errorCode.SUCCESS.code && res != null && res.length > 0) {
            logger.info("user: " + res[0] + " already exist.");
            callback(errorCode.USER_EXIST);
        } else {
            //user not exist, create one
            logger.info("user not exist ,create one.");
            userDao.createUser(user, function (createUserErr) {
                callback(createUserErr);
            });
        }
    });
};

exports.getUserWorkUnit = function (user, callback) {
    userDao.getUser(user, function (getUserErr, players) {
        // user exist
        if (getUserErr === errorCode.SUCCESS.code && players != null && players.length > 0) {
            logger.info("this user: " + user + " exist in db");
            callback(getUserErr, players);
        } else {
            // user not exist
            logger.info("user: " + user + " not exist in db.");
            callback(errorCode.FAILED, null);
        }
    });
};
