/**
 * Created by the-engine-team
 * 2017-08-27
 */

var db = require('../database/msession');
exports.addOrUpdateWinner = function (data) {
    db.collection("tables", function (err, collection) {
        collection.find({tableNumber: data.tableNumber}).toArray(function (err, results) {
            if (results && results.length > 0) {
                collection.update({tableNumber: data.tableNumber}, {
                    $set: {
                        winners: data.winners
                    }
                }, function (err, result) {
                    if (result)
                        console.log("update table "+ data.tableNumber + " winner success");
                    else
                        console.log("update table "+ data.tableNumber + " winner fail");
                });
            } else {
                collection.insert(data, function (err, docs) {
                    if (!err)
                        console.log("insert table "+ data.tableNumber + " winner success");
                    else
                        console.log("insert table "+ data.tableNumber + " winner fail" + err);
                });
            }
        });

    });
};

exports.clearTable = function () {
    db.collection("tables", function (err, collection) {
        collection.remove({}, function (err, docs) {
            if (!err)
                console.log("remove all data success");
        });
    });
};
