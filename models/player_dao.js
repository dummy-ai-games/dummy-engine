/**
 * Created by Elsie
 * 2017-11-25
 */

var db = require('../database/msession');
var logger = require('../poem/logging/logger4js').helper;

// pls. use local error code
var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

/**
 * player
 * Fields:
 *      name(string)
 *      phoneNumber(string)(primary key)
 *      password(string)
 *      avatar(string)
 *      role(int): 0-player, 1-admin
 *      status(int): 0-active, 1-deleted
 */


/**
 * create a new player to player table
 * @param player:{player object}
 * @param callback: succeed, failed
 */
exports.createPlayer = function (player, callback) {
    db.collection('player', function (err, playerCollection) {
        if (err) {
            logger.error("connect to player table failed. " + err);
            callback(errorCode.FAILED, null);
        } else {
            playerCollection.insert(player, function (err, result) {
                if (err) {
                    logger.error("insert player failed: " + err);
                    callback(errorCode.FAILED, null);
                } else {
                    logger.info("insert player succeeded");
                    callback(errorCode.SUCCESS, result);
                }
            });
        }
    });
};

/**
 * query player in player table
 * @param condition: {phoneNumber:'123', password:'*****'}
 * @param callback: succeed, failed
 */
exports.getPlayer = function (conditions, callback) {
    db.collection('player', function (err, playerCollection) {
        if (!err) {
            playerCollection.find(conditions).toArray(function (err, result) {
                if (!err) {
                    callback(errorCode.SUCCESS, result);
                } else {
                    logger.error("get player error : " + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error("get player collection error : " + err);
            callback(errorCode.FAILED, null);
        }
    });
};
