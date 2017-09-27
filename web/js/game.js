/**
 * Created by the-engine-team
 * 2017-08-21
 */

var ccTheGame;
var rtc = SkyRTC();
var tableNumber = 0;
var playerName = '';
var dbPlayers = [];
var autoRestart = 0;

(function () {
    // get table number first
    tableNumber = getParameter('table');
    playerName = getParameter('name');
    autoRestart = getParameter('auto') || 0;
    console.log("auto restart = " + autoRestart);
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
        updateGame(data, true);
        gameStatus = STATUS_GAME_FINISHED;

        if (1 === autoRestart) {
            // auto start another game in 3s
            setTimeout(function () {
                startGame();
            }, 3000);
        }
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
        updateGame(data, false);
    });

    rtc.on('__new_round', function (data) {
        var roundCount = data.table.roundCount;
        var tableNumber = data.table.tableNumber;
        gameStatus = STATUS_GAME_RUNNING;
        console.log('table ' + tableNumber + ', new round: ' + roundCount);

        // update in game engine
        console.log('new_round : ' + JSON.stringify(data));
        updateGame(data, true);
    });

    rtc.on('__round_end', function (data) {
        var roundCount = data.table.roundCount;
        var tableNumber = data.table.tableNumber;
        gameStatus = STATUS_GAME_RUNNING;
        console.log('table ' + tableNumber + ', round finished: ' + roundCount);
        updateGame(data, false);
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
            console.log('table ' + tableNumber + ', player: ' + roundAction.playerName +
                ' take action: ' + roundAction.action);
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setAction(roundAction.action);
                if (roundAction.action === 'fold') {
                    players[playerIndex].setBet(0);
                } else if (roundAction.amount) {
                    players[playerIndex].setBet(roundAction.amount);
                }
            }
        } else {
            console.log('table ' + tableNumber + ', player:' + roundAction.playerName + ' take action:' +
                roundAction.action + ', bet amount: ' + roundAction.amount);
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setAction(roundAction.action);
                if (roundAction.amount) {
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
        updateGame(data, false);
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

function updateGame(data, isNewRound) {
    var i;

    // update round
    if (data.table && data.table.roundCount) {
        currentRound = data.table.roundCount;
    }

    // update table
    if (data.table) {
        publicCards = [];
        for (i = 0; i < data.table.board.length; i++) {
            publicCards[i] = data.table.board[i];
        }
        currentSmallBlind = data.table.smallBlind.amount;
        currentBigBlind = data.table.bigBlind.amount;
        console.log("current small blind = " + currentSmallBlind + ", current big blind = " + currentBigBlind);
    } else {
        console.log('data.table is null');
    }

    // update players
    if (data.players) {
        for (i = 0; i < data.players.length; i++) {
            players[i].id = data.players[i].playerName;
            players[i].setDisplayName(findDBPlayerNameById(data.players[i].playerName));
            if (data.players[i].cards && data.players[i].cards.length === 2) {
                players[i].privateCards[0] = data.players[i].cards[0];
                players[i].privateCards[1] = data.players[i].cards[1];
            }
            players[i].setAccRoundBet(data.players[i].roundBet);
            players[i].setAccBet(data.players[i].bet);

            // set player accumulate
            var accumulate = players[i].accRoundBet + players[i].accBet;
            players[i].setAccumulate(accumulate);
            // reset action when received __new_round
            if (isNewRound) {
                players[i].setAction("-");
                players[i].setBet(0);
                players[i].setAccRoundBet(0);
                players[i].setAccBet(0);
                players[i].setAccumulate(0);
            }

            players[i].setChips(data.players[i].chips);
            players[i].setSurvive(data.players[i].isSurvive);

            if (data.table) {
                players[i].isSmallBlind = players[i].name === data.table.smallBlind.playerName;
                players[i].isBigBlind = players[i].name === data.table.bigBlind.playerName;
            }

            // let blind be blind : )
            /*
            if (true === players[i].isSmallBlind) {
                console.log(players[i].name + " is small blind : " + currentSmallBlind);
                players[i].setBlind(currentSmallBlind);
            }

            if (true === players[i].isBigBlind) {
                console.log(players[i].name + " is big blind : " + currentBigBlind);
                players[i].setBlind(currentBigBlind);
            }
            */

            // get float 1
            players[i].setChips(players[i].chips.toFixed(1));
        }
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