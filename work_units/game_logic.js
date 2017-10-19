/**
 * Created by the-engine team
 * 2017-10-19
 */

// global inclusion
var logger = require('../poem/logging/logger4js').helper;

// local inclusion
var gameDao = require('../models/game_dao.js');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

var collectionUtils = require('../poem/utils/collection_utils.js');

exports.updateGame = function(tableNumber, newGame, callback) {
    var conditions = {
        tableNumber: tableNumber
    };

    gameDao.getGames(conditions, 0, 1, function(getGameErr, game) {
        if (getGameErr.code === errorCode.SUCCESS.code &&
            null !== game && game.length > 0) {
            logger.info('get game_services successfully, update it');
            gameDao.updateGame(conditions, newGame, function(updateGameErr) {
                callback(updateGameErr);
            });
        } else {
            logger.info('get game_services failed, create a new one');
            gameDao.createGame(newGame, function(createGameErr) {
                callback(createGameErr);
            });
        }
    });
};

exports.getRankedPlayersWorkUnit = function(from, count, callback) {
    from = from || 0;
    count = count || 20;
    gameDao.getGames({}, from, count, function(getGamesErr, games) {
        if (errorCode.SUCCESS.code === getGamesErr.code &&
            null !== games &&
            games.length > 0) {
            var players = [];
            for (var index = 0; index < games.length; index++) {
                var game = games[index];
                if (game.players) {
                    for (var pIndex = 0; pIndex < game.players.length; pIndex++) {
                        players.push(game.players[pIndex]);
                    }
                }
            }
            if (players) {
                players.sort(collectionUtils.sortArray("-chips"));
            }
            callback(errorCode.SUCCESS, players);
        } else {
            logger.error('get games error in get ranked players');
            callback(errorCode.FAILED, null);
        }
    });
};