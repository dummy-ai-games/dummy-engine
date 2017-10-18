/**
 * Created by the-engine-team
 * 2017-08-29
 */


function listKanban() {
    $.ajax({
        url: '/list_kanban',
        type: 'GET',
        dataType: 'json',
        timeout: 20000,
        success: function (response) {
            if(response.status.code == 0) {
                onKanbanListed(response.entity);
            } else {
                console.log("list kanban failed");
            }
        },
        error: function () {
            console.log("list kanban failed");
        }
    });
}

function onKanbanListed(data) {
    for (var i = 0; i < data.length; i++) {
        var trContent = "<tr><td>";
        trContent += data.playerId + "</td><td>" + data.playerScore + "</td></tr>";

    }
}
