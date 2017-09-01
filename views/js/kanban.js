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