/**
 * Created by the-engine team
 * 2017-10-19
 */

// system inclusion
var async = require('async');

// global inclusion
var logger = require('../poem/logging/logger4js').helper;

// local inclusion
var gameDao = require('../models/game_dao.js');
var tableDao = require('../models/table_dao.js');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

var collectionUtils = require('../poem/utils/collection_utils.js');

exports.updateGameWorkUnit = function(tableNumber, instID, newGame, callback) {
    var conditions = {
        tableNumber: tableNumber,
        instID: instID
    };

    gameDao.getGames(conditions, 0, 1, function(getGameErr, game) {
        if (getGameErr.code === errorCode.SUCCESS.code &&
            null !== game && game.length > 0) {
            logger.info('get game successfully, update it');
            gameDao.updateTable(conditions, newGame, function(updateGameErr) {
                callback(updateGameErr);
            });
        } else {
            logger.info('get game failed, create a new one');
            gameDao.createGame(newGame, function(createGameErr) {
                callback(createGameErr);
            });
        }
    });
};

exports.getRankedPlayersWorkUnit = function(callback) {
    var players = [];
    // TODO: to support unlimited tables
    tableDao.listTables(function(listTablesErr, tables) {
        if (errorCode.SUCCESS.code === listTablesErr.code && tables && tables.length > 0) {
            async.eachSeries(tables, function (table, innerCallback) {
                var conditions = {
                    tableNumber: table.tableNumber
                };
                gameDao.getGames(conditions, 0, 1, function(getGamesErr, games){
                    if (errorCode.SUCCESS.code === getGamesErr.code && games && games.length > 0) {
                        // actually, there is only 1 game returned
                        var game = games[0];
                        if (game.players) {
                            for (var pIndex = 0; pIndex < game.players.length; pIndex++) {
                                players.push(game.players[pIndex]);
                            }
                        }
                    }
                    innerCallback();
                });
            }, function(err) {
                if (players) {
                    players.sort(collectionUtils.sortArray("-chips"));
                }
                callback(errorCode.SUCCESS, players);
            });
        } else {
            callback(errorCode.FAILED, null);
        }
    });
};