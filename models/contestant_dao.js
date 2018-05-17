/**
 * Created by the-engine-team
 * 2017-08-31
 */

var db = require('../database/msession');

// local inclusion
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

/**
 * Player
 * Fields:
 *      playerName (key)
 *      displayName
 *      tableNumber
 */
exports.getContestants = function (conditions, callback) {
    db.collection('contestant', function (err, collection) {
        if (!err) {
            collection.find(conditions).sort({playerName: 1, chips: -1}).toArray(function (err, results) {
                if (!err) {
                    callback(errorCode.SUCCESS, results);
                } else {
                    logger.error('get players error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection player failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};

exports.countContestants = function (conditions, callback) {
    db.collection('contestant', function (err, collection) {
        if (!err) {
            collection.find(conditions).count(function(err, count) {
                if (!err) {
                    callback(errorCode.SUCCESS, count);
                } else {
                    logger.error('count players error : ' + err);
                    callback(errorCode.FAILED, 0);
                }
            });
        } else {
            logger.error('get collection player failed : ' + err);
            callback(errorCode.FAILED, 0);
        }
    });
};

exports.listContestants = function (callback) {
    db.collection('contestant', function (err, collection) {
        if (!err) {
            collection.find({}).toArray(function (err, results) {
                if (!err) {
                    callback(errorCode.SUCCESS, results);
                } else {
                    logger.error('get all players error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection player failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};

exports.getAllTables = function (callback) {
    db.collection('contestant', function (err, collection) {
        if (!err) {
            collection.find({}).toArray(function (err, results) {
                var tables = {};
                if (!err) {
                    for (var i = 0; i < results.length; i++) {
                        var player = results[i];
                        if (tables[player.tableNumber] === undefined)
                            tables[player.tableNumber] = [];
                        var table = tables[player.tableNumber];
                        table.push(player.playerName);
                    }
                    callback(errorCode.SUCCESS, tables);
                } else {
                    logger.error('get all tables error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection player failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};

exports.createContestant = function (player, callback) {
    db.collection('contestant', function (err, collection) {
        if (!err) {
            collection.insert(player, function (err, docs) {
                if (!err) {
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('insert player ' + player.playerName + ' failed : ' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection player failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.updateContestant = function(conditions, newPlayer, callback) {
    db.collection('contestant', function (err, collection) {
        if (!err) {
            collection.update(conditions, {
                $set: {
                    playerName: newPlayer.playerName,
                    displayName: newPlayer.displayName,
                    tableNumber: newPlayer.tableNumber
                }
            }, function (err, result) {
                if (!err) {
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('update player ' + newPlayer.playerName + ' failed: ' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection player failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.deleteContestant = function (conditions, callback) {
    db.collection('contestant', function (err, collection) {
        if (!err) {
            collection.remove(conditions, function (err) {
                if (!err) {
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('insert player failed : ' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection player failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};
