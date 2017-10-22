/**
 * Created by the-engine team
 * 2017-09-08
 */

// local inclusion
var tableDao = require('../models/table_dao.js');
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

exports.listTablesWorkUnit = function(callback) {
    tableDao.listTables(function(getTablesErr, tables) {
        callback(getTablesErr, tables);
    });
};

exports.updateTableWorkUnit = function(tableNumber, newTable, callback) {
    var conditions = {
        tableNumber: tableNumber
    };

    tableDao.getTables(conditions, function(getTablesErr, tables) {
        if (errorCode.SUCCESS.code === getTablesErr.code &&
            tables && tables.length > 0) {
            logger.info('table : ' + tableNumber + ' already exist, update it');
            tableDao.updateTable(conditions, newTable, function(updateTableErr) {
                callback(updateTableErr);
            });
        } else {
            logger.info('table : ' + tableNumber + ' does not exist, create new');
            tableDao.createTable(newTable, function(createTableErr) {
                callback(createTableErr);
            });
        }
    });
};
