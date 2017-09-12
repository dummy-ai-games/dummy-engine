/**
 * Created by the-engine team
 * 2017-09-08
 */

// global inclusion
var logger = require('../poem/logging/logger4js').helper;

// local inclusion
var Player = require('../models/player_dao.js');
var Table = require('../models/table_dao.js');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();


exports.listTablesWorkUnit = function(callback) {
    Table.listTables(function(getTablesErr, tables) {
        callback(getTablesErr, tables);
    });
};

exports.getPlayersWorkUnit = function(tableNumber, callback) {
    var conditions = {
        tableNumber: tableNumber
    };

    Player.getPlayers(conditions, function(getPlayersErr, players) {
        callback(getPlayersErr, players);
    });
};

exports.getAllTablesWorkUnit = function(callback) {
    Player.getAllTables(function(getTablesErr, tables) {
        callback(getTablesErr, tables);
    });
};

exports.updatePlayerWorkUnit = function(player, callback) {
    var conditions = null;

    conditions = {
        tableNumber: player.tableNumber
    };

    // create table
    Table.getTable(conditions, function(getTableErr, tables) {
        if (getTableErr.code === errorCode.SUCCESS.code && null !== tables && tables.length > 0) {
            logger.info("table : " + player.tableNumber + " already exist");
        } else {
            logger.info("table : " + player.tableNumber + " does not exist, create new table");
            var newTable = {
                tableNumber: player.tableNumber
            };
            Table.createTable(newTable, function(createTableErr) {
                // do nothing
            });
        }

        // create player
        conditions = {
            playerName: player.playerName
        };
        Player.getPlayers(conditions, function(getPlayersErr, players) {
            if (getPlayersErr.code === errorCode.SUCCESS.code && null !== players && players.length > 0) {
                logger.info("player : " + player.playerName + " already exist");
                callback(errorCode.PLAYER_EXIST);
            } else {
                logger.info("player : " + player.playerName + " does not exist, create new");
                Player.createPlayer(player, function(createPlayerErr) {
                    callback(createPlayerErr);
                });
            }
        });
    });
};

exports.deletePlayerWorkUnit = function(player, callback) {
    var conditions = {
        playerName: player.playerName
    };

    Player.deletePlayer(conditions, function(deletePlayerErr) {
        callback(deletePlayerErr);
    });
};
