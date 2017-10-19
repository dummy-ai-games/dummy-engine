/**
 * Created by the-engine-team
 * 2017-08-27
 */

// local inclusion
var db = require('../database/msession');
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

exports.createWinners = function(winner, callback) {
    db.collection('winners', function (err, collection) {
        if (!err) {
            collection.insert(winner, function (err, docs) {
                if (!err) {
                    logger.info('insert winners ' + winner.tableNumber + ' winner success');
                    callback(errorCode.SUCCESS, docs);
                } else {
                    logger.error('insert table ' + winner.tableNumber + ' winner fail' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection winners failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.updateWinners = function(conditions, newWinner, callback) {
    db.collection('winners', function (err, collection) {
        if (!err) {
            collection.update(conditions, {
                $set: {
                    winners: newWinner
                }
            }, function (err, result) {
                if (result) {
                    logger.info('update winners ' + data.tableNumber + ' successfully');
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('update winners ' + data.tableNumber + ' failed');
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection winners failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.getWinners = function(conditions, callback) {
    db.collection('winners', function (err, collection) {
        if (!err) {
            collection.find(conditions).toArray(function (err, results) {
                if (!err) {
                    callback(errorCode.SUCCESS, results);
                } else {
                    logger.error('get winners error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection winners failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};
