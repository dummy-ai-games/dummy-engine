/**
 * Created by Elsie
 *  2017/12/01
 */

var db = require('../database/msession');
var logger = require('../poem/logging/logger4js').helper;
var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

/**
 * board
 * Fields:
 *      gameName (string): 指明该桌是什么游戏，游戏名称
 *      minPlayer (int): 等于Game的minPlayer
 *      maxPlayer (int): 等于Game的maxPlayer
 *      currentPlayer (array): 一个数组，当前已经加入的玩家
 *      status (int): 0-准备中，1-进行中，2-结束
 *      creator (string): 创建者的手机号
 *      creatorName (string): 创建者的名字  // newly add
 *      createTime (string): 该board实例创建时间
 *      updateTime (string): 更新时间
 *      ticket (string) (primary key): 供程序加入的私密串号
 *      type (int): 0-公开游戏(default)，2-私密游戏
 */

exports.createBoard = function (board, callback) {
    db.collection('board', function (err, boardCollection) {
        if (err) {
            logger.error("connect to board table failed. " + err);
            callback(errorCode.FAILED, null);
        } else {
            boardCollection.insert(board, function (err, result) {
                if (err) {
                    logger.error("insert board failed: " + err);
                    callback(errorCode.FAILED, null);
                } else {
                    logger.info("insert board succeed");
                    callback(errorCode.SUCCESS, result);
                }
            });
        }
    });
};

/**
 * update board instance with newBoard value by condition
 * @param condition: {ticket: ticket_value}
 * @param newBoard: Board entity
 * @param callback
 */
exports.updateBoard = function (condition, newBoard, callback) {
    db.collection('board', function (err, boardCollection) {
        if (!err) {
            boardCollection.update(condition, {$set: newBoard}, function (err, result) {
                if (!err) {
                    logger.info("update board by condition " + condition + " succeed.");
                    callback(errorCode.SUCCESS, result);
                } else {
                    logger.error("update board by condition: " + condition + " occur error." + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error("get board collection error. " + err);
            callback(errorCode.FAILED, null);
        }
    });

};

/**
 * get board info by condition
 * @param condition: Json format
 * @param callback: callback(errorCode.SUCCESS, result)
 *                  callback(errorCode.FAILED, nulls)
 */
exports.getBoard = function (condition, callback) {
    db.collection('board', function (err, boardCollection) {
        if (!err) {
            boardCollection.find(condition).toArray(function (err, result) {
                if (!err) {
                    logger.info("get board by condition " + JSON.stringify(condition) + " succeed." + JSON.stringify(result));
                    callback(errorCode.SUCCESS, result); //return board array
                } else {
                    logger.error("get board by condition: " + JSON.stringify(condition) + " occur error." + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error("get board collection error. " + err);
            callback(errorCode.FAILED, null);
        }
    });
};

exports.listBoards = function (condition, from, count, callback) {
    db.collection('board', function (err, boardCollection) {
        if (!err) {
            boardCollection.find(condition, {}, {
                "limit": parseInt(count),
                "skip": parseInt(from),
                "sort": [['createTime','desc']]
            }).toArray(function (err, result) {
                if (!err) {
                    logger.info("list boards by condition " + JSON.stringify(condition) + " succeed." + JSON.stringify(result));
                    callback(errorCode.SUCCESS, result); //return board array
                } else {
                    logger.error("list boards by condition: " + JSON.stringify(condition) + " occur error." + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error("get board collection error. " + err);
            callback(errorCode.FAILED, null);
        }
    });
};
