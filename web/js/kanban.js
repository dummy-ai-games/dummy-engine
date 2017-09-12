/**
 * Created by the-engine-team
 * 2017-08-29
 */

var rtc = SkyRTC();

rtc.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('#')[0], 'kanban');

rtc.on("_join", function (data) {
    console.log("init data : " + JSON.stringify(data));
    var kanban = $("#kanban");
    for (var index in data) {
        var player = data[index];
        var temp = kanban.find("#" + player.id);
        if (temp.length > 0) {
            temp.text(player.chips);
        } else {
            var div = $("<div/>", {
                class: "form-group"
            }).prependTo(kanban);
            $("<span/>", {
                style: "color:red"
            }).text(player.playerName + ":").appendTo(div);
            $("<span/>", {
                id: player.id
            }).text(player.chips).appendTo(div);
        }
    }

});

rtc.on('_showAction', function (player) {
    console.log("action update data : " + JSON.stringify(player));
    var kanban = $("#kanban");
    var temp = kanban.find("#" + player.id);
    if (temp.length > 0) {
        temp.text(player.chips);
    } else {
        var div = $("<div/>", {
            class: "form-group"
        }).prependTo(kanban);
        $("<span/>", {
            style: "color:red"
        }).text(player.playerName + ":").appendTo(div);
        $("<span/>", {
            id: player.id
        }).text(player.chips).appendTo(div);
    }
});

rtc.on('_playerExit', function (player) {
    var kanban = $("#kanban");
    var temp = kanban.find("#" + player.id);
    if (temp.length > 0) {
        temp.text("offline");
    }
});

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
