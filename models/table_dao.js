/**
 * Created by the-engine-team
 * 2017-08-31
 */

var db = require('../database/msession');

// local inclusion
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

exports.createTable = function (table, callback) {
    db.collection('tables', function (err, collection) {
        if (!err) {
            collection.insert(table, function (err, docs) {
                if (!err) {
                    logger.info('insert table ' + table.tableNumber + ' successfully');
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

exports.listTables = function (callback) {
    db.collection('tables', function (err, collection) {
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

exports.getTables = function(conditions, callback) {
    db.collection('tables', function (err, collection) {
        if (!err) {
            collection.find(conditions).toArray(function (err, results) {
                if (!err) {
                    logger.info('get tables successfully');
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
    db.collection('tables', function (err, collection) {
        if (!err) {
            collection.remove({}, function (err, docs) {
                if (!err) {
                    logger.info('remove all tables success');
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
