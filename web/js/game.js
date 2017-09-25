/**
 * Created by the-engine-team
 * 2017-08-21
 */

var ccTheGame;
var rtc = SkyRTC();
var tableNumber = 0;
var playerName = '';
var dbPlayers = [];

(function () {
    // get table number first
    tableNumber = getParameter('table');
    playerName = getParameter('name');
    initGame();
})();

// fetch player display name
function initPlayerInfo() {
    $.ajax({
        url: '/player/list_players',
        type: 'POST',
        dataType: 'json',
        data: {
            table_number: tableNumber
        },
        timeout: 20000,
        success: function (response) {
            if(response.status.code === 0) {
                console.log("get db players: " + JSON.stringify(response.entity));
                dbPlayers = response.entity;
            } else if(response.status.code === 1) {
                console.log('list player failed, use player name as display name');
            }
            initWebsock();
        },
        error: function () {
            console.log('list player failed, use player name as display name');
            initWebsock();
        }
    });
}

// game communication with back-end
function initWebsock() {
    // initialize web communication
    rtc.connect('ws:' + window.location.href.substring(window.location.protocol.length).split('#')[0], playerName,tableNumber);

    rtc.on('__new_peer', function (data) {
        if (data) {
            console.log('player_join : ' + JSON.stringify(data));
        } else {
            console.log('guest_join');
        }

        if (undefined !== data && null !== data) {
            for (var i = 0; i < data.length; i++) {
                var playerName = data[i];
                console.log('player: ' + playerName + ', joined');
            }

            currentPlayers = data.length;
            for (i = 0; i < data.length; i++) {
                var playerDisplayName = findDBPlayerNameById(data[i]);
                console.log("playerDisplayName on join = " + playerDisplayName);
                if (!players[i]) {

                    players[i] =
                        new Player(data[i], data[i], playerDisplayName, 1000);
                } else {
                    players[i].id = data[i];
                    players[i].name = data[i];
                    players[i].displayName = playerDisplayName;
                }
            }
        }
    });

    rtc.on('__game_over', function (data) {
        var tableNumber = data.table.tableNumber;
        var result = 'table ' + tableNumber + ' game over, winners: ';
        var winners = data.winners;
        for (var i in winners) {
            var player = winners[i];
            result += 'player:' + player.playerName + ', chips: ' + player.chips + '\n';
        }
        console.log(result);

        // update in game engine
        console.log('finish_game : ' + JSON.stringify(data));
        updateTable(data);
        gameStatus = STATUS_GAME_FINISHED;

        // auto start another game in 3s
        setTimeout(function () {
            startGame();
        }, 3000);
    });

    rtc.on('__game_start', function (data) {
        // update in game engine
        console.log('start_game : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
    });

    rtc.on('__deal', function (data) {
        var tableNumber = data.table.tableNumber;
        var board_card = data.table.board;
        var board = '';
        for (var index in board_card) {
            board += board_card[index] + ',';
        }
        console.log('table ' + tableNumber + ', public cards:' + board);

        // update in game engine
        gameStatus = STATUS_GAME_RUNNING;
        console.log('deal : ' + JSON.stringify(data));
        updateTable(data);
    });

    rtc.on('__new_round', function (data) {
        var roundCount = data.table.roundCount;
        var tableNumber = data.table.tableNumber;
        gameStatus = STATUS_GAME_RUNNING;
        console.log('table ' + tableNumber + ', new round: ' + roundCount);

        // update in game engine
        console.log('new_round : ' + JSON.stringify(data));
        updateTable(data);
    });

    rtc.on('__round_end', function (data) {
        var roundCount = data.table.roundCount;
        var tableNumber = data.table.tableNumber;
        gameStatus = STATUS_GAME_RUNNING;
        console.log('table ' + tableNumber + ', round finished: ' + roundCount);
        updateTable(data);
    });

    rtc.on('__show_action', function (data) {
        console.log('action : ' + JSON.stringify(data));

        gameStatus = STATUS_GAME_RUNNING;

        var tableNumber = data.table.tableNumber;
        var roundAction = data.action;

        var playerIndex = findPlayerIndexById(data.action.playerName);

        if (roundAction.action === 'check' ||
            roundAction.action === 'fold' ||
            roundAction.action === 'raise' ||
            roundAction.action === 'call') {
            console.log('table ' + tableNumber + ', player: ' + roundAction.playerName + ' take action: ' + roundAction.action);
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setAction(roundAction.action);
                if (data.action.amount) {
                    players[playerIndex].setBet(data.action.amount);
                }
            }
        } else {
            console.log('table ' + tableNumber + ', player:' + roundAction.playerName + ' take action:' + roundAction.action + ', bet amount: ' + roundAction.amount);
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setAction(roundAction.action);
                if (data.action.amount) {
                    players[playerIndex].setBet(data.action.amount);
                }
            }
        }
        // set in turn
        for (var i = 0; i < currentPlayers; i++) {
            if (playerIndex === i) {
                players[i].setInTurn();
            } else {
                players[i].clearInTurn();
            }
        }
        updateTable(data);
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
            '<p>Google Chrome is a browser that combines a minimal design with sophisticated technology ' +
            'to make the web faster, safer, and easier.Click the logo to download.</p>' +
            '<a href="http://www.google.com/chrome" target="_blank">' +
            '<img src="http://www.google.com/intl/zh-CN/chrome/assets/common/images/chrome_logo_2x.png" border="0"/></a>';
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
                    initPlayerInfo();
                }
            });
            cc.director.runScene(new LSScene());
        }, this);
    };
    cc.game.run('gameCanvas');
}

// utilities
function startGame() {
    rtc.startGame(tableNumber);
}

function updateTable(data) {
    var i;

    // update round
    if (data.table && data.table.roundCount) {
        currentRound = data.table.roundCount;
    }

    // update players
    if (data.players) {
        for (i = 0; i < data.players.length; i++) {
            players[i].id = data.players[i].playerName;
            players[i].displayName = findDBPlayerNameById(data.players[i].playerName);
            console.log('player[' + i + '].displayName = ' + players[i].displayName);
            if (data.players[i].cards && data.players[i].cards.length === 2) {
                players[i].privateCards[0] = data.players[i].cards[0];
                players[i].privateCards[1] = data.players[i].cards[1];
            }
            players[i].chips = data.players[i].chips;
        }
    }

    // update table
    if (data.table) {
        publicCards = [];
        for (i = 0; i < data.table.board.length; i++) {
            publicCards[i] = data.table.board[i];
        }
    } else {
        console.log('data.table is null');
    }
}

function findPlayerIndexById(id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].id === id) {
            return i;
        }
    }
    return -1;
}

function findDBPlayerNameById(playerName) {
    if (dbPlayers) {
        console.log("findDBPlayerNameById, playerName = " + playerName + ", dbPlayers = " + JSON.stringify(dbPlayers));
        for (var i = 0; i < dbPlayers.length; i++) {
            if (dbPlayers[i].playerName === playerName) {
                if (dbPlayers[i].displayName) {
                    return dbPlayers[i].displayName;
                } else {
                    return dbPlayers[i].playerName;
                }
            }
        }
    } else {
        return playerName;
    }
}
