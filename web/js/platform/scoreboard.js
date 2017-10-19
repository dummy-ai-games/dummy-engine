/**
 * Created by the-engine-team
 * 2017-10-19
 */

$(document).ready(function() {
    // initialize score board
    updateScoreBoard();
});

function updateScoreBoard() {
    $.ajax({
        url: '/game_services/list_ranked_players',
        type: 'POST',
        dataType: 'json',
        timeout: 20000,
        success: function (response) {
            if(response.status.code === 0) {
                console.log(response.entity);
                onScoreBoardUpdated(response.entity);
            } else {
                console.log("list scoreboard failed");
            }
        },
        error: function () {
            console.log("list scoreboard failed");
        }
    });
}

function onScoreBoardUpdated(rankedPlayers) {
    var level1 = 30;
    var level2 = 60;
    var table1 = document.getElementById('1st_rank');
    var table2 = document.getElementById('2nd_rank');
    var table3 = document.getElementById('3rd_rank');
    table1.innerHTML = '';
    table2.innerHTML = '';
    table3.innerHTML = '';

    for (var i = 0; i < rankedPlayers.length; i++) {
        var target, style;
        if (i < level1) {
            target = $('#1st_rank');
        } else if (i < level2) {
            target = $('#2nd_rank');
        } else {
            target = $('#3rd_rank');
        }
        var row = '<tr>' +
            '<th scope="row">' + (i + 1) + '</th>' +
            '<td>' + rankedPlayers[i].displayName + '</td>' +
            '<td>' + rankedPlayers[i].chips + '</td>' +
            '</tr>';
        target.append(row);
    }
}
