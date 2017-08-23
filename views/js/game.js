/**
 * Created by Strawmanbobi
 * 2017-08-21
 */

var ccTheGame;
var rtc = SkyRTC();

(function () {
    initGame();
})();

// game communication with back-end
function initWebsock() {
// initialize web communication
    rtc.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('#')[0], 'admin');
    rtc.on("_new_peer", function (data) {
        var parent = $("#content");
        parent.empty();

        for (var i = 0; i < data.length; i++) {
            var playerName = data[i];
            var div = $("<div/>", {
                class: "form-group"
            }).prependTo(parent);
            $("<span/>").text("用户:" + playerName + "加入").appendTo(div);
        }

        console.log("player_join : " + JSON.stringify(data));
        currentPlayers = data.length;
        for (i = 0; i < data.length; i++) {
            if (null == players[i]) {
                players[i] =
                    new Player(data[i], playerNames[i], 3000);
            } else {
                players.id = data[i];
                players[i].name = playerNames[i];
            }
        }
    });
    rtc.on("_gameOver", function (data) {
        var tableNumber = data.tableNumber;
        var result = "table " + tableNumber + " 游戏结束，胜者如下：";
        var winners = data.winners;
        for (var i in winners) {
            var player = winners[i];
            result += "用户:" + player.playerName + ",最终金额:" + player.chips + "\n";
        }
        $("#msg").html($("#msg").html() + "<br/>" + result);
        $("#msg").show();

        // update in game engine
        console.log("finish_game : " + JSON.stringify(data));
        gameStatus = STATUS_GAME_FINISHED;
    });
    rtc.on('startGame', function (data) {
        $("#msg").html($("#msg").html() + "<br/>" + data.msg);
        $("#msg").show();

        // update in game engine
        console.log("start_game : " + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
    });

    rtc.on('__deal', function (data) {
        console.log("deal : " + JSON.stringify(data));
        var tableNumber = data.tableNumber;
        var data = data.data;
        var board = "";
        for (var index in data) {
            board += data[index] + ",";
        }
        $("#msg").html($("#msg").html() + "<br/>" + "table " + tableNumber + " 当前公共牌：" + board);
        $("#msg").show();

        // update in game engine
        console.log("deal : " + JSON.stringify(data));
        for (var i = 0; i < data.length; i++) {
            publicCards[i] = data[i];
        }
    });
    rtc.on('__newRound', function (data) {
        var roundCount = data.roundCount;
        var tableNumber = data.tableNumber;
        $("#msg").html($("#msg").html() + "<br/>" + "table " + tableNumber + " 第" + roundCount + "轮开始");
        $("#msg").show();

        // update in game engine
        console.log("new_round : " + JSON.stringify(data));
    });
    rtc.on('__showAction', function (data) {
        console.log("action : " + JSON.stringify(data));

        var tableNumber = data.tableNumber;
        var roundAction = data.data;

        var playerIndex = findPlayerIndexById(roundAction.playerName);

        if (roundAction.action == "check" || roundAction.action == "fold" || roundAction.action == "raise" || roundAction.action == "call") {
            $("#msg").html($("#msg").html() + "<br/>" + "table " + tableNumber + " 玩家：" + roundAction.playerName + " 采取动作：" + roundAction.action);
            // update in game engine
            if (playerIndex != -1) {
                players[playerIndex].setAction(roundAction.action);
            }
        } else {
            $("#msg").html($("#msg").html() + "<br/>" + "table " + tableNumber + " 玩家：" + roundAction.playerName + " 采取动作：" + roundAction.action + ", 押注金额：" + roundAction.amount);
            // update in game engine
            if (playerIndex != -1) {
                players[playerIndex].setAction(roundAction.action);
            }
        }
        // set in turn
        for (var i = 0; i < currentPlayers; i++) {
            if (playerIndex == i) {
                players[i].setInTurn();
            } else {
                players[i].clearInTurn();
            }
        }

        $("#msg").show();
    });
}

function initGame() {
    var d = document;
    var container = document.getElementById('gameContainer');
    var winWidth, winHeight;
    winWidth = document.documentElement.clientWidth;
    winHeight = document.documentElement.clientHeight;
    container.innerHTML = '<canvas id="gameCanvas" width="' + winWidth + '" height="' + winHeight + '"></canvas>';
    if (!d.createElement('canvas').getContext) {
        var s = d.createElement('div');
        s.innerHTML = '<h2>您的浏览器不支持HTML5 !</h2>' +
            '<p>Google Chrome is a browser that combines a minimal design with sophisticated technology to make the web faster, safer, and easier.Click the logo to download.</p>' +
            '<a href="http://www.google.com/chrome" target="_blank">' +
            '<img src="http://www.google.com/intl/zh-CN/chrome/assets/common/images/chrome_logo_2x.png" border="0"/></a>';
        var p = d.getElementById(c.tag).parentNode;
        p.style.background = 'none';
        p.style.border = 'none';
        p.insertBefore(s);

        d.body.style.background = '#ffffff';
        return;
    }
    window.addEventListener('DOMContentLoaded', function () {
        ccLoad();
    });
}

function ccLoad() {
    cc.game.onStart = function() {
        //load resources
        cc.LoaderScene.preload(resources, function () {
            var LSScene = cc.Scene.extend({
                onEnter: function () {
                    this._super();
                    ccTheGame = new GameLayer();
                    ccTheGame.init();
                    this.addChild(ccTheGame);
                    initWebsock();
                }
            });
            cc.director.runScene(new LSScene());
        }, this);
    };
    cc.game.run("gameCanvas");
}

// utilities
function startGame() {
    rtc.startGame();
}

function findPlayerIndexById(id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].id == id) {
            return i;
        }
    }
    return -1;
}