/**
 * Created by the-engine-team
 * 2017-10-22
 */

var tileStyles = ['tile-teal', 'tile-blue', 'tile-yellow', 'tile-red', 'tile-orange', 'tile-pink',
    'tile-purple', 'tile-lime', 'tile-carrot', 'tile-cloud'];
$(document).ready(function() {
    initUI();
    initData();
});

function initUI() {

}

function initData() {
    traceTables();
    setInterval(function() {
        traceTables();
    }, 10 * 1000);
}

function traceTables() {
    $.ajax({
        url: '/table/trace_tables',
        type: 'POST',
        dataType: 'json',
        data: {
            from: 0,
            count: 100
        },
        timeout: 20000,
        success: function (response) {
            if(response.status.code === 0) {
                console.log(response.entity);
                onTableUpdated(response.entity);
            } else {
                console.log("trace table failed");
            }
        },
        error: function () {
            console.log("trace table failed");
        }
    });
}

/*
function countPlayersByTable(tableNumber, players, status) {
    $.ajax({
        url: '/player/count_players_by_table',
        type: 'POST',
        dataType: 'json',
        data: {
            tableNumber: tableNumber
        },
        timeout: 20000,
        success: function (response) {
            if(response.status.code === 0) {
                console.log(response.entity);
                onTablePlayersCounted(tableNumber, response.entity, players, status);
            } else {
                console.log("count table players failed");
            }
        },
        error: function () {
            console.log("count table players failed");
        }
    });
}
*/

function onTableUpdated(tables) {
    var tableGroup = $('#tables');

    tableGroup.html('');
    if (tables && tables.length > 0) {
        for (var i = 0; i < tables.length; i++) {
            // countPlayersByTable(tables[i].tableNumber, tables[i].players, tables[i].status);
            var number = tables[i].tableNumber;
            var status = tables[i].status;
            var players = tables[i].players;
            var playersCount = 10;
            var tileStyle = tileStyles[number % 10];
            var tableNumber = 'Table ' + number;
            var tablePlayers = countOnlinePlayers(players, playersCount);
            var tableStatus = "--";

            if (undefined !== status && null !== status) {
                if (0 === parseInt(status)) {
                    tableStatus = "Standby";
                } else if (1 === parseInt(status)) {
                    tableStatus = "Preparing";
                } else if (2 === parseInt(status)) {
                    tableStatus = "Running";
                } else if (3 === parseInt(status)) {
                    tableStatus = "Over";
                }
            }
            var tile = '<div class="col-sm-4 col-md-4">' +
                '<div class="thumbnail tile tile-wide ' + tileStyle + '">' +
                '<a href="#" style="text-decoration:none;" onclick="gotoLive('+tableNumber+')">' +
                '<h1>' + tableNumber + '</h1>' +
                '<h4 style="margin-top:5px;">' + tableStatus + '</h4>' +
                '<h4 style="margin-top:5px;">' + tablePlayers + '</h4>' +
                '</a>' +
                '</div>' +
                '</div>';
            tableGroup.append(tile);
        }
    }
}

function onTablePlayersCounted(number, count, players, status) {

}

function countOnlinePlayers(players, total) {
    var onlinePlayerCount = 0;
    if (players && players.length > 0) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].isOnline && true === players[i].isOnline) {
                onlinePlayerCount++;
            }
        }
    }
    return onlinePlayerCount + '/' + total;
}

function gotoLive(tableNumber) {
    window.open('./game.html?table='+tableNumber,
        '_blank');
}
