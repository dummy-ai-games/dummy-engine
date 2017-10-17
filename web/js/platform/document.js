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

function createDummy() {
    var playerNameArray = $('#player_name').val();
    if (null === playerNameArray || "" === playerNameArray) {
        return;
    }
    var playerNames = playerNameArray.split(';');

    var host = window.location.hostname;
    var port = window.location.port;
    if (port === '') {
        port = '80';
    }
    var serverAddress = host + ':' + port;

    for (var i = 0; i < playerNames.length; i++) {
        var playerName = playerNames[i];
        window.open('./dummy.html?name='+playerName+'&server='+serverAddress, '_blank');
    }
    $('#player_name').val('');
}

function hashName() {
    var playerName = $('#hash_name_in').val();
    var digest = MD5(playerName);
    $('#hash_name_out').val(digest);
}