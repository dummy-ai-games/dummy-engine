/**
 * Created by Elsie
 *  2017/12/02
 */

var db = require('../database/msession');
var logger = require('../poem/logging/logger4js').helper;
var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

/**
 * game
 * Fields:
 *      name (string)(primary key): 游戏名称
 *      minPlayer (int): 最小容纳玩家数
 *      maxPlayer (int): 最大容纳玩家数
 */
exports.getGameInfo = function (gameName, callback) {
    db.collection('game', function (err, gameCollection) {
        if (!err) {
            gameCollection.find(gameName).toArray(function (err, result) {
                if (!err) {
                    logger.info("get game info by gameName: " + gameName.name + " succeed.");
                    callback(errorCode.SUCCESS, result); //return board array
                } else {
                    logger.error("get game info by gameName: " + gameName.name + " occur error." + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error("get game collection error. " + err);
            callback(errorCode.FAILED, null);
        }
    });
};

/**
 * insert a new game to tb_game
 * @param game
 * @param callback
 */
exports.createGame = function (game, callback) {
    db.collection('game', function (err, gameCollection) {
        if (err) {
            logger.error("connect to game table failed. " + err);
            callback(errorCode.FAILED, null);
        } else {
            gameCollection.insert(game, function (err, result) {
                if (err) {
                    logger.error("insert new game failed: " + err);
                    callback(errorCode.FAILED, null);
                } else {
                    logger.info("insert new game succeed");
                    callback(errorCode.SUCCESS, result);
                }
            });
        }
    });
};
