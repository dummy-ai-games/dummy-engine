/**
 * Created by the-engine team
 * 2017-09-08
 */

// local inclusion
var tableDao = require('../models/table_dao.js');

exports.listTablesWorkUnit = function(callback) {
    tableDao.listTables(function(getTablesErr, tables) {
        callback(getTablesErr, tables);
    });
};
