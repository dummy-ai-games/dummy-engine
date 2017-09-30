/**
 * Created by the-engine-team
 * 2017-09-20
 */

$(document).ready(function() {
    initUI();
});

function initUI() {
    $('#server_types').select2({
    });
}

function setGame() {
    $('#goto_game_dialog').modal();
}

function gotoGame() {
    var tableNumber = $('#game_table_number').val();
    if (null === tableNumber || isNaN(tableNumber)) {
        return;
    }
    window.location="./game.html?table="+tableNumber;
}

function hideTip() {
    $('#tip').hide();
}

function createDummy() {
    var playerName = $('#player_name').val();
    if (null === playerName || "" === playerName) {
        return;
    }
    var host = window.location.hostname;
    var port = window.location.port;
    var serverAddress = host + ':' + port;
    window.open('./simulator.html?name='+playerName+'&server='+serverAddress, '_blank');
    $('#player_name').val('');
}