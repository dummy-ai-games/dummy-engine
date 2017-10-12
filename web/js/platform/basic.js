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
    if (null === tableNumber || isNaN(tableNumber)) {
        return;
    }
    window.open('./game.html?table='+tableNumber, '_blank');
    localStorage.setItem('game_table', tableNumber);
    $('#goto_game_dialog').modal('hide');
}

function setPlayer() {
    $('#goto_play_dialog').modal();
}

function gotoPlay() {
    var tableNumber = $('#play_table_number').val();
    var playerName = $('#play_player_name').val();
    if (null === tableNumber || isNaN(tableNumber)) {
        return;
    }
    if (null === playerName) {
        return;
    }
    window.open('./game.html?table='+tableNumber+'&name='+playerName, '_blank');
    $('#play_player_name').val('');
    localStorage.setItem('game_table', tableNumber);
    $('#goto_play_dialog').modal('hide');
}