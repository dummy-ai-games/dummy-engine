/**
 * Created by jieping on 2017/8/27.
 */
var db = require('../database/msession');
exports.addOrUpdatePlayer = function (player) {
    db.collection("players", function (err, collection) {
        collection.find({playerName: player.playerName}).toArray(function (err, results) {
            if (results && results.length > 0) {
                collection.update({playerName: player.playerName}, {
                    $set: {
                        chips: player.chips,
                        hand: player.hand
                    }
                }, function (err, result) {
                    if (result)
                        console.log("update player:" + player.playerName + " success");
                    else
                        console.log("update player:" + player.playerName + " fail");
                });
            } else {
                collection.insert(player, function (err, docs) {
                    if (!err)
                        console.log("insert player:" + player.playerName + " success");
                    else
                        console.log("insert player:" + player.playerName + " fail" + err);
                });
            }
        });

    });
};

exports.clearTable = function () {
    db.collection("players", function (err, collection) {
        collection.remove({}, function (err, docs) {
            if (!err)
                console.log("remove all data success");
        });
    });
}