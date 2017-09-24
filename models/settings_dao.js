/**
 * Created by the-engine-team
 * 2017-09-24
 */

var db = require('../database/msession');

// local inclusion
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

exports.getSettings = function (conditions, callback) {
    db.collection("settings", function (err, collection) {
        collection.find(conditions).toArray(function (err, results) {
            if (!err) {
                callback(errorCode.SUCCESS, results);
            } else {
                logger.error("get settings error : " + err);
                callback(errorCode.FAILED, null);
            }
        });
    });
};

exports.createSettings = function (settings, callback) {
    db.collection("settings", function (err, collection) {
        collection.insert(settings, function (err, docs) {
            if (!err) {
                logger.info("insert settings " + settings.tableNumber + " successfully");
                callback(errorCode.SUCCESS);
            } else {
                logger.error("insert settings " + settings.tableNumber + " failed : " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};

exports.updateSettings = function(conditions, newSettings, callback) {
    db.collection("settings", function (err, collection) {
        collection.update(conditions, {
            $set: {
                // TODO:
            }
        }, function (err, result) {
            if (!err) {
                logger.info("update settings " + newSettings.tableNumber + " successfully");
                callback(errorCode.SUCCESS);
            } else {
                logger.error("update settings " + newSettings.tableNumber + " failed: " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};
