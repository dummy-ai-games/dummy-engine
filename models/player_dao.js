/**
 * Created by Elsie
 * 2017-11-25
 */

var db = require('../database/msession');
var logger = require('../poem/logging/logger4js').helper;
var ErrorCode = require('../poem/configuration/error_code');
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
 * @param user:{player object}
 * @param callback: succeed, failed
 */
exports.createUser = function (player, callback) {
    db.collection('player', function (err, player_collection) {
        if (err) {
            logger.error("connect to player table failed. " + err);
            callback(errorCode.FAILED, null);
        } else {
            player_collection.insert(player, function (err, result) {
                if (err) {
                    logger.error("insert player failed: " + err);
                    callback(errorCode.FAILED, null);
                } else {
                    logger.info("insert player succeed");
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
exports.getUser = function (player, callback) {
    db.collection('player', function (err, player_collection) {
        if (!err) {
            player_collection.find(player).toArray(function (err, result) {
                if (!err) {
                    logger.info("get player succeed.");
                    callback(errorCode.SUCCESS, result);
                } else {
                    logger.error("get player error: " + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error("get player collection error. " + err);
            callback(errorCode.FAILED, null);
        }
    });
};



