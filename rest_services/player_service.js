/**
 * Created by the-engine team
 * 2017-09-08
 */

var ServiceResponse = require('../responses/service_response.js');
var IntegerResponse = require('../responses/integer_response.js');
var PlayersResponse = require('../responses/players_response.js');
var TablesNPlayersResponse = require('../responses/tablesnplayers_response.js');

var playerLogic = require('../work_units/player_logic.js');

/**
 * function :   Get players
 * parameter :
 * return :     raw player list
 */
exports.getPlayers = function (req, res) {
    var tableNumber = req.query.tableNumber;

    playerLogic.getPlayersByTableWorkUnit(tableNumber, function (getPlayersErr, players) {
        res.send(players);
        res.end();
    });
};

/**
 * function :   List players
 * parameter :
 * return :     PlayerResponse
 */
exports.listPlayers = function (req, res) {
    var tableNumber = req.body.tableNumber;

    var playersResponse = new PlayersResponse();
    playerLogic.getPlayersByTableWorkUnit(tableNumber, function (listPlayersErr, players) {
        playersResponse.status = listPlayersErr;
        playersResponse.entity = players;
        res.send(playersResponse);
        res.end();
    });
};

/**
 * function :   Count players by table
 * parameter :
 * return :     IntegerResponse
 */
exports.countPlayersByTable = function (req, res) {
    var tableNumber = req.body.tableNumber;

    var integerResponse = new IntegerResponse();
    playerLogic.countPlayersByTableWorkUnit(tableNumber, function (countPlayersErr, count) {
        integerResponse.status = countPlayersErr;
        integerResponse.entity = count;
        res.send(integerResponse);
        res.end();
    });
};

/**
 * function :   Update player
 * parameter :  Player object
 * return :     ServiceResponse
 */
exports.updatePlayer = function (req, res) {
    var player = req.body;
    var serviceResponse = new ServiceResponse();

    playerLogic.updatePlayerWorkUnit(player, function (createPlayersErr) {
        serviceResponse.status = createPlayersErr;
        res.send(serviceResponse);
        res.end();
    });
};

/**
 * function :   Delete player
 * parameter :  Player object
 * return :     ServiceResponse
 */
exports.deletePlayer = function (req, res) {
    var player = req.body;
    var serviceResponse = new ServiceResponse();

    playerLogic.deletePlayerWorkUnit(player, function (createPlayersErr) {
        serviceResponse.status = createPlayersErr;
        res.send(serviceResponse);
        res.end();
    });
};

/**
 * function :   Get table by player
 * parameter :  Player name
 * return :     Table number
 */
exports.getTableByPlayer = function (req, res) {
    var playerName = req.body.playerName;
    var integerResponse = new IntegerResponse();

    playerLogic.getTableNumberByPlayerWorkUnit(playerName, function(getTableNumberErr, tableNumber) {
        integerResponse.status = getTableNumberErr;
        integerResponse.entity = tableNumber;
        res.send(integerResponse);
        res.end();
    });
};

/**
 * function :   Dump log
 * parameter :  Table object
 * return :     File redirect
 */
exports.dumpLog = function (req, res) {
    // deprecated
    res.end();
};

/**
 * function :   Get tables
 * parameter :
 * return :     TablesNPlayersResponse
 */
exports.getTables = function (req, res) {
    var tablesNPlayersResponse = new TablesNPlayersResponse();

    playerLogic.getAllTablesWorkUnit(function (getTablesErr, tables) {
        tablesNPlayersResponse.status = getTablesErr;
        tablesNPlayersResponse.entity = tables;
        res.send(tablesNPlayersResponse);
        res.end();
    });
};
