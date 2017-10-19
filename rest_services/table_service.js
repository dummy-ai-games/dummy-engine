/**
 * Created by the-engine team
 * 2017-10-19
 */

var TablesResponse = require('../responses/tables_response.js');

var tableLogic = require('../work_units/table_logic.js');

/**
 * function :   List tables
 * parameter :
 * return :     TablesResponse
 */
exports.listTables = function (req, res) {
    var tablesResponse = new TablesResponse();

    tableLogic.listTablesWorkUnit(function (listTablesErr, tables) {
        tablesResponse.status = listTablesErr;
        tablesResponse.entity = tables;
        res.send(tablesResponse);
        res.end();
    });
};
