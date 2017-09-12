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
    db.collection("tables", function (err, collection) {
        collection.insert(table, function (err, docs) {
            if (!err) {
                logger.info("insert table " + table.tableNumber + " successfully");
                callback(errorCode.SUCCESS);
            } else {
                logger.error("insert player " + table.tableNumber + " failed : " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};

exports.listTables = function (callback) {
    db.collection("tables", function (err, collection) {
        collection.find().sort({tableNumber : 1}).toArray(function (err, results) {
            if (!err) {
                callback(errorCode.SUCCESS, results);
            } else {
                logger.error("list tables error : " + err);
                callback(errorCode.FAILED, null);
            }
        });
    });
};

exports.getTable = function(conditions, callback) {
    db.collection("tables", function (err, collection) {
        collection.find(conditions).toArray(function (err, results) {
            if (!err) {
                callback(errorCode.SUCCESS, results);
            } else {
                logger.error("get tables error : " + err);
                callback(errorCode.FAILED, null);
            }
        });
    });
};
