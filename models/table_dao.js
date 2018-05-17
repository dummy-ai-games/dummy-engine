/**
 * Created by the-engine-team
 * 2017-08-31
 */

var db = require('../database/msession');

// local inclusion
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

var dateUtils = require('../poem/utils/date_utils.js');

/**
 * Table
 * Fields:
 *      tableNumber (key)
 *      players
 */
exports.createTable = function(table, callback) {
    db.collection('table', function (err, collection) {
        if (!err) {
            table.updateTime = dateUtils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
            collection.insert(table, function (err, docs) {
                if (!err) {
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('insert player ' + table.tableNumber + ' failed : ' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection table failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.updateTable = function(conditions, newTable, callback) {
    db.collection('table', function (err, collection) {
        if (!err) {
            logger.info('update table, set players = ' + JSON.stringify(newTable.players));
            collection.update(conditions, {
                $set: {
                    tableNumber: newTable.tableNumber,
                    players: newTable.players,
                    updateTime: dateUtils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss'),
                    status: newTable.status
                }
            }, function (err, result) {
                if (!err) {
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('update table ' + newTable.tableNumber + ' failed: ' + err);
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection table failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};

exports.listTables = function (callback) {
    db.collection('table', function (err, collection) {
        if (!err) {
            collection.find().sort({tableNumber: 1}).toArray(function (err, results) {
                if (!err) {
                    logger.info('list tables successfully');
                    callback(errorCode.SUCCESS, results);
                } else {
                    logger.error('list tables error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection table failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};

exports.listTablesForTrace = function (from, count, callback) {
    db.collection('table', function (err, collection) {
        if (!err) {
            collection.find().skip(parseInt(from)).limit(parseInt(count)).sort({tableNumber: 1})
                .toArray(function (err, results) {
                if (!err) {
                    callback(errorCode.SUCCESS, results);
                } else {
                    logger.error('list tables error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection table failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};

exports.getTables = function(conditions, callback) {
    db.collection('table', function (err, collection) {
        if (!err) {
            collection.find(conditions).toArray(function (err, results) {
                if (!err) {
                    callback(errorCode.SUCCESS, results);
                } else {
                    logger.error('get tables error : ' + err);
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.error('get collection table failed : ' + err);
            callback(errorCode.FAILED, null);
        }
    });
};

exports.clearTables = function (callback) {
    db.collection('table', function (err, collection) {
        if (!err) {
            collection.remove({}, function (err, docs) {
                if (!err) {
                    callback(errorCode.SUCCESS);
                } else {
                    logger.error('remove all tables failed');
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error('get collection table failed : ' + err);
            callback(errorCode.FAILED);
        }
    });
};
