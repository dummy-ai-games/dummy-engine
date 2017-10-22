/**
 * Created by the-engine-team
 * 2017-10-19
 */

$(document).ready(function() {
    // initialize score board
    updateScoreBoard();
    setInterval(function() {
        updateScoreBoard();
    }, 10 * 1000);
});

function updateScoreBoard() {
    $.ajax({
        url: '/game/list_ranked_players',
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
    var level1 = 25;
    var level2 = 50;
    var level3 = 75;
    var table1 = document.getElementById('1st_rank');
    var table2 = document.getElementById('2nd_rank');
    var table3 = document.getElementById('3rd_rank');
    var table4 = document.getElementById('4th_rank');
    table1.innerHTML = '';
    table2.innerHTML = '';
    table3.innerHTML = '';
    table4.innerHTML = '';

    for (var i = 0; i < rankedPlayers.length; i++) {
        var target;
        if (i < level1) {
            target = $('#1st_rank');
        } else if (i < level2) {
            target = $('#2nd_rank');
        } else if (i < level3) {
            target = $('#3rd_rank');
        } else {
            target = $('#4th_rank');
        }
        var row = '<tr>' +
            '<th scope="row">' + (i + 1) + '</th>' +
            '<td style="text-align: left;">' + rankedPlayers[i].displayName + '</td>' +
            '<td style="text-align: left;">' + rankedPlayers[i].chips + '</td>' +
            '</tr>';
        target.append(row);
    }
}
