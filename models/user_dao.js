/**
 * Created by Elsie
 * 2017-11-25
 */

var db = require('../database/msession');
var logger = require('../poem/logging/logger4js').helper;
var ErrorCode = require('../poem/configuration/error_code');
var errorCode = new ErrorCode();


/**
 * tb_user
 * Fields:
 *      name(string)
 *      phoneNumber(string)(primary key)
 *      password(string)
 *      avatar(string)
 *      role(int): 0-player, 1-admin
 *      status(int): 0-active, 1-deleted
 */


/**
 * create a new user to tb_user
 * @param user:{user object}
 * @param callback: succeed, failed
 */
exports.createUser = function (user, callback) {
    db.collection('tb_user', function (err, user_collection) {
        if (err) {
            logger.error("connect to user table failed. " + err);
            callback(errorCode.FAILED);
        } else {
            user_collection.insert(user, function (err, result) {
                if (err) {
                    logger.error("insert user failed: " + err);
                    callback(errorCode.FAILED);
                } else {
                    logger.info("insert user succeed");
                    callback(errorCode.SUCCESS);
                }
            });
        }
    });
};

/**
 * query user in tb_user
 * @param condition: {phoneNumber:'123', password:'*****'}
 * @param callback: succeed, failed
 */
exports.getUser = function (conditions, callback) {
    db.collection('tb_user', function (err, user_collection) {
        if (!err) {
            user_collection.find(conditions).toArray(function (err, result) {
                if (!err) {
                    logger.info("get user succeed.");
                    callback(errorCode.SUCCESS, result);
                } else {
                    logger.error("get user error: " + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error("get user collection error. " + err);
            callback(errorCode.FAILED, null);
        }
    });
};



