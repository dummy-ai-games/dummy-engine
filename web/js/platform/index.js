
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