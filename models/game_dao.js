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
    db.collection('game', function (err, collection) {
        if (!err) {
            game.updateTime = dateUtils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
            collection.insert(game, function (err, docs) {
                if (!err) {
                    logger.info('create game_services ' + game.tableNumber + ',  successfully');
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('create game_services ' + game.tableNumber + ', failed : ' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection game failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.updateGame = function(conditions, newGame, callback) {
    db.collection('game', function (err, collection) {
        if (!err) {
            collection.update(conditions, {
                $set: {
                    tableNumber: newGame.tableNumber,
                    status: newGame.status,
                    players: newGame.players,
                    startTime: newGame.startTime,
                    updateTime: dateUtils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss')
                }
            }, function (err, result) {
                if (!err) {
                    logger.info('update game_services ' + newGame.tableNumber + ' successfully : ' + JSON.stringify(result));
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('update game_services ' + newGame.tableNumber + ' failed: ' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection game failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.getGames = function(conditions, from, count, callback) {
    db.collection('game', function (err, collection) {
        if (!err) {
            collection.find(conditions).skip(from).limit(count).toArray(function (err, results) {
                if (!err) {
                    callback(errorCode.SUCCESS, results);
                } else {
                    logger.error('get game_services error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection game failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};
