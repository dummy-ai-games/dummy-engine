/**
 * Created by the-engine-team
 * 2017-10-18
 */

var db = require('../database/msession');

// local inclusion
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

var dateUtils = require('../poem/utils/date_utils.js');

/**
 * Game is an instance of Table
 * Fields:
 *      tableNumber (key)
 *      status
 *      players
 *      createTime
 *      updateTime
 */
exports.createGame = function (game, callback) {
    logger.info('create game : ' + JSON.stringify(game));
    game.updateTime = dateUtils.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss");
    db.collection("game", function (err, collection) {
        collection.insert(game, function (err, docs) {
            if (!err) {
                logger.info("create game " + game.tableNumber + ",  successfully");
                callback(errorCode.SUCCESS);
            } else {
                logger.error("create game " + game.tableNumber + ", failed : " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};

exports.updateGame = function(conditions, newGame, callback) {
    db.collection("game", function (err, collection) {
        collection.update(conditions, {
            $set: {
                tableNumber: newGame.tableNumber,
                status: newGame.status,
                players: newGame.players,
                startTime: newGame.startTime,
                updateTime: dateUtils.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss")
            }
        }, function (err, result) {
            if (!err) {
                logger.info("update game " + newGame.tableNumber + " successfully : " + JSON.stringify(result));
                callback(errorCode.SUCCESS);
            } else {
                logger.error("update game " + newGame.tableNumber + " failed: " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};

exports.getGame = function(conditions, callback) {
    db.collection("game", function (err, collection) {
        collection.find(conditions).toArray(function (err, results) {
            if (!err) {
                callback(errorCode.SUCCESS, results);
            } else {
                logger.error("get game error : " + err);
                callback(errorCode.FAILED, null);
            }
        });
    });
};
