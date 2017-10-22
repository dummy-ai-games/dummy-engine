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

function onTableUpdated(tables) {
    var tableGroup = $('#tables');

    tableGroup.html('');
    if (tables && tables.length > 0) {
        for (var i = 0; i < tables.length; i++) {
            var tileStyle = tileStyles[i];
            var tableNumber = 'Table ' + tables[i].tableNumber;
            players = tables[i].players;
            var tableStatus = countOnlinePlayers(players);
            var tile = '<div class="col-sm-3 col-md-3">' +
                '<div class="thumbnail tile tile-medium ' + tileStyle + '">' +
                '<a href="#" style="text-decoration: none;" onclick="gotoLive('+tables[i].tableNumber+')">' +
                '<h1>' + tableNumber + '</h1>' +
                '<h2 style="margin-top: 20px;">' + tableStatus + '</h2>' +
                '</a>' +
                '</div>' +
                '</div>';
            tableGroup.append(tile);
        }
    }
}

function countOnlinePlayers(players) {
    var playersLength = 0;
    var onlinePlayerCount = 0;
    if (players && players.length > 0) {
        playersLength = players.length;
        for (var i = 0; i < players.length; i++) {
            if (players[i].isOnline && true === players[i].isOnline) {
                onlinePlayerCount++;
            }
        }
    }
    return onlinePlayerCount + '/10';
}

function gotoLive(tableNumber) {
    window.open('./game.html?table='+tableNumber,
        '_blank');
}
