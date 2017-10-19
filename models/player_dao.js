/**
 * Created by the-engine-team
 * 2017-08-31
 */

var db = require('../database/msession');

// local inclusion
var logger = require('../poem/logging/logger4js').helper;

var ErrorCode = require('../constants/error_code');
var errorCode = new ErrorCode();

exports.getPlayers = function (conditions, callback) {
    db.collection("players", function (err, collection) {
        collection.find(conditions).sort({playerName: 1, chips: -1}).toArray(function (err, results) {
            if (!err) {
                callback(errorCode.SUCCESS, results);
            } else {
                logger.error("get players error : " + err);
                callback(errorCode.FAILED, null);
            }
        });
    });
};

exports.listPlayers = function (callback) {
    db.collection("players", function (err, collection) {
        collection.find({}).toArray(function (err, results) {
            if (!err) {
                callback(errorCode.SUCCESS, results);
            } else {
                logger.error("get all players error : " + err);
                callback(errorCode.FAILED, null);
            }
        });
    });
};

exports.getAllTables = function (callback) {
    db.collection("players", function (err, collection) {
        collection.find({}).toArray(function (err, results) {
            var tables = {};
            if (!err) {
                for (var i = 0; i < results.length; i++) {
                    var player = results[i];
                    if (tables[player.tableNumber] === undefined)
                        tables[player.tableNumber] = [];
                    var table = tables[player.tableNumber];
                    table.push(player.playerName);
                }
                callback(errorCode.SUCCESS, tables);
            } else {
                logger.error("get all tables error : " + err);
                callback(errorCode.FAILED, null);
            }
        });
    });
};

exports.updatePlayerChips = function (players, callback) {
    db.collection("players", function (err, collection) {
        if (players) {
            for (var i = 0; i < players.length; i++) {
                updatePlayerChip(collection, players[i]);
            }
        }
        callback();
    });
};

exports.createPlayer = function (player, callback) {
    db.collection("players", function (err, collection) {
        collection.insert(player, function (err, docs) {
            if (!err) {
                logger.info("insert player " + player.playerName + " successfully");
                callback(errorCode.SUCCESS);
            } else {
                logger.error("insert player " + player.playerName + " failed : " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};

exports.updatePlayer = function(conditions, newPlayer, callback) {
    db.collection("players", function (err, collection) {
        collection.update(conditions, {
            $set: {
                playerName: newPlayer.playerName,
                displayName: newPlayer.displayName,
                tableNumber: newPlayer.tableNumber
            }
        }, function (err, result) {
            if (!err) {
                logger.info("update player " + newPlayer.playerName + " successfully : " + JSON.stringify(result));
                callback(errorCode.SUCCESS);
            } else {
                logger.error("update player " + newPlayer.playerName + " failed: " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};

exports.deletePlayer = function (conditions, callback) {
    db.collection("players", function (err, collection) {
        collection.remove(conditions, function (err) {
            if (!err) {
                logger.info("delete player successfully");
                callback(errorCode.SUCCESS);
            } else {
                logger.error("insert player failed : " + err);
                callback(errorCode.FAILED);
            }
        });
    });
};

// work utils
function updatePlayerChip(collection, player) {
    collection.update({playerName: player.playerName}, {
        $set: {
            chips: player.chips
        }
    }, function (err, result) {
        if (result)
            logger.info("update player " + player.playerName + " success");
        else
            logger.error("update player " + player.playerName + " fail");
    });
}
