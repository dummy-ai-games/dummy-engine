/**
 * Created by dummy team
 * 2017-09-08
 */

// global inclusion
var logger = require('../poem/logging/logger4js').helper;

// local inclusion
var playerDao = require('../models/player_dao.js');
var tableDao = require('../models/table_dao.js');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

var MD5Utils = require('../poem/crypto/md5');

exports.getPlayerByName = function(playerName, callback) {
    var conditions = {
        playerName: playerName
    };

    playerDao.getPlayers(conditions, function(getPlayersErr, players) {
        if (getPlayersErr.code === errorCode.SUCCESS.code && null !== players && players.length > 0) {
            var displayName;
            if (players[0].displayName) {
                displayName = players[0].displayName;
            } else {
                displayName = players[0].playerName;
            }
            logger.info('player ' + displayName + ' is validated');
            callback(getPlayersErr, players[0]);
        } else {
            callback(errorCode.FAILED, null);
        }
    });
};

exports.getPlayersByTableWorkUnit = function(tableNumber, callback) {
    var conditions = {
        tableNumber: tableNumber
    };

    playerDao.getPlayers(conditions, function(getPlayersErr, players) {
        if (errorCode.SUCCESS.code === getPlayersErr.code && null !== players && players.length > 0) {
            for (var i = 0; i < players.length; i++) {
                if (undefined === players[i].displayName ||
                    null === players[i].displayName ||
                    "" === players[i].displayName) {
                    players[i].displayName = players[i].playerName;
                }
                players[i].plainName = players[i].playerName;
                players[i].playerName = MD5Utils.MD5(players[i].playerName);
            }
        }
        callback(getPlayersErr, players);
    });
};

exports.countPlayersByTableWorkUnit = function(tableNumber, callback) {
    var conditions = {
        tableNumber: tableNumber
    };

    playerDao.countPlayers(conditions, function(countPlayersErr, count) {
        callback(countPlayersErr, count);
    });
};

exports.listPlayersWorkUnit = function(callback) {
    playerDao.listPlayers(function(listPlayersErr, players) {
        if (errorCode.SUCCESS.code === listPlayersErr.code && null !== players && players.length > 0) {
            for (var i = 0; i < players.length; i++) {
                if (undefined === players[i].displayName ||
                    null === players[i].displayName ||
                    "" === players[i].displayName) {
                    players[i].displayName = players[i].playerName;
                }
                players[i].plainName = players[i].playerName;
                players[i].playerName = MD5Utils.MD5(players[i].playerName);
            }
        }
        callback(listPlayersErr, players);
    });
};

// for server internal usage, do not hash player name
exports.listPlayersInternalWorkUnit = function(callback) {
    playerDao.listPlayers(function(listPlayersErr, players) {
        if (errorCode.SUCCESS.code === listPlayersErr.code && null !== players && players.length > 0) {
            for (var i = 0; i < players.length; i++) {
                if (undefined === players[i].displayName ||
                    null === players[i].displayName ||
                    "" === players[i].displayName) {
                    players[i].displayName = players[i].playerName;
                }
            }
        }
        callback(listPlayersErr, players);
    });
};

exports.getAllTablesWorkUnit = function(callback) {
    playerDao.getAllTables(function(getTablesErr, tables) {
        callback(getTablesErr, tables);
    });
};

exports.updatePlayerWorkUnit = function(player, callback) {
    var conditions = null;

    conditions = {
        tableNumber: player.tableNumber
    };

    // create table
    tableDao.getTables(conditions, function(getTableErr, tables) {
        if (getTableErr.code === errorCode.SUCCESS.code && null !== tables && tables.length > 0) {
            logger.info("table : " + player.tableNumber + " already exist");
        } else {
            logger.info("table : " + player.tableNumber + " does not exist, create new table");
            var newTable = {
                tableNumber: player.tableNumber
            };
            tableDao.createTable(newTable, function(createTableErr) {
                // do nothing
            });
        }

        // create player
        conditions = {
            playerName: player.playerName
        };
        playerDao.getPlayers(conditions, function(getPlayersErr, players) {
            if (getPlayersErr.code === errorCode.SUCCESS.code && null !== players && players.length > 0) {
                logger.info("player : " + player.playerName + " already exist");
                callback(errorCode.PLAYER_EXIST);
            } else {
                logger.info("player : " + player.playerName + " does not exist, create new");
                playerDao.createPlayer(player, function(createPlayerErr) {
                    callback(createPlayerErr);
                });
            }
        });
    });
};

exports.deletePlayerWorkUnit = function(player, callback) {
    var conditions = {
        playerName: player.plainName
    };

    playerDao.deletePlayer(conditions, function(deletePlayerErr) {
        callback(deletePlayerErr);
    });
};

exports.getTableNumberByPlayerWorkUnit = function(playerName, callback) {
    var conditions = {
        playerName: playerName
    };

    playerDao.getPlayers(conditions, function(getPlayersErr, players) {
        if (getPlayersErr.code === errorCode.SUCCESS.code &&
            null !== players && players.length > 0) {
            var tableNumber = players[0].tableNumber;
            callback(getPlayersErr, tableNumber);
        } else {
            callback(errorCode.FAILED, null);
        }
    });
};
