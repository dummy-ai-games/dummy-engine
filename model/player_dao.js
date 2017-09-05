/**
 * Created by the-engine-team
 * 2017-08-31
 */

var db = require('../database/msession');

exports.getPlayers = function (req, res) {
    db.collection("players", function (err, collection) {
        collection.find({}).sort({tableNumber: 1, chips: -1}).toArray(function (err, results) {
            if (!err) {
                res.send({error_code: 0, players: results});
            } else {
                res.send({error_code: 1, players: {}})
            }
            res.end();
        });

    });
};

exports.getAllPlayer = function (data) {
    db.collection("players", function (err, collection) {
        collection.find({}).toArray(function (err, results) {
            if (!err) {
                for (var i = 0; i < results.length; i++) {
                    var player = results[i];
                    data[player.playerName] = player.tableNumber;
                }
            }
        });
    });
};

exports.getAllTable = function (req, res) {
    db.collection("players", function (err, collection) {
        collection.find({}).toArray(function (err, results) {
            var tables = {};
            if (!err) {
                for (var i = 0; i < results.length; i++) {
                    var player = results[i];
                    if (tables[player.tableNumber] == undefined)
                        tables[player.tableNumber] = [];
                    var table = tables[player.tableNumber];
                    table.push(player.playerName);
                }
                res.send({error_code: 0, data: tables});
            } else
                res.send({error_code: 1, data: {}});
            res.end();
        });
    });
};

exports.updatePlayerChips = function (players) {
    db.collection("players", function (err, collection) {
        if (players) {
            for (var i = 0; i < players.length; i++)
                updatePlayerChip(collection, players[i]);
        }
    });
};

function updatePlayerChip(collection, player) {
    collection.update({playerName: player.playerName}, {
        $set: {
            chips: player.chips
        }
    }, function (err, result) {
        if (result)
            console.log("update player " + player.playerName + " success");
        else
            console.log("update player " + player.playerName + " fail");
    });

}

exports.savePlayers = function (req, res) {
    var players = JSON.parse(req.body.players);
    db.collection("players", function (err, collection) {
        collection.remove({}, function (err, docs) {
            if (!err)
                console.log("remove all data success");
            if (players) {
                for (var i = 0; i < players.length; i++)
                    addPlayer(collection, players[i]);
            }
            res.send({error_code: 0});
            res.end();

        });
    });
};

function addPlayer(collection, player) {
    collection.insert(player, function (err, docs) {
        if (!err)
            console.log("insert player " + player.playerName + " success");
        else
            console.log("insert player " + player.playerName + " fail" + err);
    });
}