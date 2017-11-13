/**
 * Created by the-engine-team
 * 2017-10-12
 */
var defaultTableNumber = localStorage.getItem('game_table');
if (defaultTableNumber) {
    $('#game_table_number').val(defaultTableNumber);
    $('#play_table_number').val(defaultTableNumber);
}

function setGame() {
    $('#goto_game_dialog').modal();
}

function gotoGame() {
    var tableNumber = $('#game_table_number').val();
    var defaultChips = $('#game_default_chips').val();
    var defaultSb = $('#game_default_sb').val();
    var defaultRoundInterval = $('#game_round_interval').val();
    var defaultCommandInterval = $('#game_command_interval').val();
    var defaultCommandTimeout = $('#game_command_timeout').val();
    var defaultLostTimeout = $('#game_lost_timeout').val();
    var reloadChance = $('#game_reload_chance').val();
    var bgm = $('#game_bgm').is(':checked') ? 1 : 0;
    var sound = $('#game_sound').is(':checked') ? 1 : 0;
    var autoRestart = $('#auto_restart').is(':checked') ? 1 : 0;

    if (null === tableNumber || isNaN(tableNumber)) {
        return;
    }
    window.open('./game.html?table='+tableNumber+'&bgm='+bgm+'&sound='+sound+'&auto='+autoRestart+'&defaultChips='+defaultChips+
        '&defaultSb='+defaultSb+'&roundInterval='+defaultRoundInterval+'&commandInterval='+defaultCommandInterval+
        '&reloadChance='+reloadChance+'&commandTimeout='+defaultCommandTimeout+'&lostTimeout='+defaultLostTimeout,
        '_blank');
    localStorage.setItem('game_table', tableNumber);
    $('#goto_game_dialog').modal('hide');

}

function setPlayer() {
    $('#goto_play_dialog').modal();
}

function gotoPlay() {
    var playerName = $('#play_player_name').val();
    var tableNumber;
    if (null === playerName) {
        return;
    }
    // fetch table number by player name
    $.ajax({
        url: '/player/get_table_by_player',
        type: 'POST',
        dataType: 'json',
        data: {
            playerName: playerName
        },
        timeout: 20000,
        success: function (response) {
            if (response.status.code === 0) {
                tableNumber = response.entity;
                joinGame(tableNumber, playerName);
            } else if (response.status.code === 1) {
                console.log('player does not exist ?');
            }
        },
        error: function () {
            console.log('player does not exist ?');
        }
    });
}

function joinGame(tableNumber, playerName) {
    window.open('./game.html?table=' + tableNumber + '&name=' + playerName, '_blank');
    $('#play_player_name').val('');
    localStorage.setItem('game_table', tableNumber);
    $('#goto_play_dialog').modal('hide');
}