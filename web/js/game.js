/**
 * Created by the-engine-team
 * 2017-08-21
 */

var ccTheGame;
var rtc = SkyRTC();
var tableNumber = 0;

(function () {
    // get table number first
    tableNumber = getParameter('table');
    initGame();
})();

// game communication with back-end
function initWebsock() {
    // initialize web communication
    rtc.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('#')[0], tableNumber);

    rtc.on("_join", function (data) {
        console.log("init data : " + JSON.stringify(data));
    });

    rtc.on("__new_peer", function (data) {
        console.log("player_join : " + JSON.stringify(data));

        if (undefined !== data && null !== data) {
            for (var i = 0; i < data.length; i++) {
                var playerName = data[i];
                console.log("用户:" + playerName + "加入");
            }

            currentPlayers = data.length;
            for (i = 0; i < data.length; i++) {
                if (null == players[i]) {
                    players[i] =
                        new Player(data[i], playerNames[i], 900);
                } else {
                    players.id = data[i];
                    players[i].name = playerNames[i];
                }
            }
        }
    });

    rtc.on("__gameOver", function (data) {
        var tableNumber = data.table.tableNumber;
        var result = "table " + tableNumber + " 游戏结束，胜者如下：";
        var winners = data.winners;
        for (var i in winners) {
            var player = winners[i];
            result += "用户:" + player.playerName + ",最终金额:" + player.chips + "\n";
        }
        console.log(result);

        // update in game engine
        console.log("finish_game : " + JSON.stringify(data));
        updateTable(data);
        gameStatus = STATUS_GAME_FINISHED;
    });

    rtc.on('startGame', function (data) {
        // update in game engine
        console.log("start_game : " + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
    });

    rtc.on('__deal', function (data) {
        var tableNumber = data.table.tableNumber;
        var board_card = data.table.board;
        var board = "";
        for (var index in board_card) {
            board += board_card[index] + ",";
        }
        console.log("table " + tableNumber + " 当前公共牌：" + board);

        // update in game engine
        console.log("deal : " + JSON.stringify(data));
        updateTable(data);
    });

    rtc.on('__newRound', function (data) {
        var roundCount = data.table.roundCount;
        var tableNumber = data.table.tableNumber;
        console.log("table " + tableNumber + " 第" + roundCount + "轮开始");

        // update in game engine
        console.log("new_round : " + JSON.stringify(data));
        updateTable(data);
    });

    rtc.on('__showAction', function (data) {
        console.log("action : " + JSON.stringify(data));

        var tableNumber = data.table.tableNumber;
        var roundAction = data.action;

        var playerIndex = findPlayerIndexById(data.action.playerName);

        if (roundAction.action == "check" ||
            roundAction.action == "fold" ||
            roundAction.action == "raise" ||
            roundAction.action == "call") {
            console.log("table " + tableNumber + " 玩家：" + roundAction.playerName + " 采取动作：" + roundAction.action);
            // update in game engine
            if (playerIndex != -1) {
                players[playerIndex].setAction(roundAction.action);
                if (data.action.amount) {
                    players[playerIndex].setBet(data.action.amount);
                }
            }
        } else {
            console.log("table " + tableNumber + " 玩家：" + roundAction.playerName + " 采取动作：" + roundAction.action + ", 押注金额：" + roundAction.amount);
            // update in game engine
            if (playerIndex != -1) {
                players[playerIndex].setAction(roundAction.action);
                if (data.action.amount) {
                    players[playerIndex].setBet(data.action.amount);
                }
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

        updateTable(data);

        $("#msg").show();
    });

    rtc.on("__action", function (data) {
        console.log(data);

        $("#userName").text("用户名:" + data.self.playerName);
        $("#bet").prop("disabled", true);
        $("#msg").text("该回合轮到你了");
        $("#msg").show();
        $("#amount").val("");
        $("#action").show();
        self = data.self;
        roundBets = data.game.roundBets;
        bets = data.game.bets;
        board = data.game.board;
        minBet = data.game.minBet;
        raiseCount = data.game.raiseCount;
        otherPlayers = data.game.otherPlayers;
        setTimeout(function () {
            rtc.Call(self.playerName);
        }, 2000);

    });

    rtc.on("__bet", function (data) {
        console.log(data);

        $("#msg").text("该回合轮到你首先押注,注意最小押注额");
        $("#bet").prop("disabled", false);
        $("#msg").show();
        $("#amount").val("");
        $("#action").show();
        self = data.self;
        roundBets = data.game.roundBets;
        bets = data.game.bets;
        board = data.game.board;
        minBet = data.game.minBet;
        raiseCount = data.game.raiseCount;
        otherPlayers = data.game.otherPlayers;
        setTimeout(function () {
            rtc.Call(self.playerName);
        }, 2000);
    });
}

function initGame() {
    var d = document;
    var container = document.getElementById('gameContainer');
    var winWidth, winHeight;
    var marginLeft = 20;
    var marginTop = 20;
    winWidth = document.documentElement.clientWidth - marginLeft;
    winHeight = document.documentElement.clientHeight - marginTop;
    container.innerHTML = '<canvas id="gameCanvas" width="' + winWidth + '" height="' + winHeight + '"></canvas>';
    if (!d.createElement('canvas').getContext) {
        var s = d.createElement('div');
        s.innerHTML = '<h2>Your browser does not support HTML5 !</h2>' +
            '<p>Google Chrome is a browser that combines a minimal design with sophisticated technology to make the web faster, safer, and easier.Click the logo to download.</p>' +
            '<a href="http://www.google.com/chrome" target="_blank">' +
            '<img game-src="http://www.google.com/intl/zh-CN/chrome/assets/common/images/chrome_logo_2x.png" border="0"/></a>';
        var p = d.getElementById(c.tag).parentNode;
        p.style.background = 'none';
        p.style.border = 'none';
        p.insertBefore(s);

        d.body.style.background = '#000000';
        return;
    }
    window.addEventListener('DOMContentLoaded', function () {
        ccLoad();
    });
}

function ccLoad() {
    cc.game.onStart = function () {
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
    rtc.startGame(tableNumber);
}

function updateTable(data) {
    var i;
    if (data.table && data.table.roundCount) {
        currentRound = data.table.roundCount;
    }
    if (data.players) {
        for (i = 0; i < data.players.length; i++) {
            players[i].id = data.players[i].playerName;
            if (data.players[i].cards && data.players[i].cards.length == 2) {
                players[i].privateCards[0] = data.players[i].cards[0];
                players[i].privateCards[1] = data.players[i].cards[1];
            }
            players[i].gold = data.players[i].chips;
        }
    }
    if (data.table) {
        publicCards = new Array();
        for (i = 0; i < data.table.board.length; i++) {
            publicCards[i] = data.table.board[i];
        }
    }
}

function findPlayerIndexById(id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].id == id) {
            return i;
        }
    }
    return -1;
}
