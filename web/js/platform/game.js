/**
 * Created by the-engine-team
 * 2017-08-21
 */

// data related
var tableNumber = 0;
var playerName = '';
var dbPlayers = [];
var autoStart = 0;

// game board related
var winWidth, winHeight;
var gameWidth, gameHeight;

// game model related
var STATUS_GAME_STANDBY = 0;
var STATUS_GAME_PREPARING = 1;
var STATUS_GAME_RUNNING = 2;
var STATUS_GAME_FINISHED = 3;

var ACTION_STATUS_NONE = 0;
var ACTION_STATUS_THINKING = 1;
var ACTION_STATUS_DECIDED = 2;

var MODE_LIVE = 0;
var MODE_PLAYER = 1;

var gameStatus = STATUS_GAME_STANDBY;
var gameCountDown = 0;
var playMode = MODE_LIVE;

var currentRoundName = '';
var currentRound = 1;
var currentRaiseCount = 0;
var currentBetCount = 0;

var yourTurn = false;
var turnAnimationShowed = false;

var PLAYER_AT_LEFT = 0;
var PLAYER_AT_RIGHT = 1;

var players = [];
var currentPlayers = 0;
var winners = [];

var defaultInitChips = 1000;
var publicCards = [];

var currentSmallBlind = 0;
var currentBigBlind = 0;

// communication related
var rtc = SkyRTC();

$(document).ready(function () {
    // get table number first
    tableNumber = getParameter('table');
    playerName = getParameter('name');
    autoStart = getParameter('auto') || 0;

    if (playerName) {
        playMode = MODE_PLAYER;
        document.title = "The Game";
    } else {
        playMode = MODE_LIVE;
        document.title = "THE Live";
    }
    initGame();
});

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
            if (response.status.code === 0) {
                console.log("get db players: " + JSON.stringify(response.entity));
                dbPlayers = response.entity;
            } else if (response.status.code === 1) {
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
    rtc.connect('ws:' + window.location.href.substring(window.location.protocol.length).split('#')[0],
        playerName, tableNumber);

    rtc.on('__new_peer', function (data) {
        console.log("receive __new_peer" + JSON.stringify(data));
        var joinPlayers = data.players;
        if (joinPlayers) {
            console.log('player join : ' + JSON.stringify(joinPlayers));
        } else {
            console.log('guest join');
        }

        if (undefined !== joinPlayers && null !== joinPlayers) {
            currentPlayers = joinPlayers.length;
            // rebuild player list
            players = [];
            for (var i = 0; i < currentPlayers; i++) {
                var playerDisplayName = findDBPlayerNameByName(joinPlayers[i]);
                players[i] = new Player(joinPlayers[i], playerDisplayName, defaultInitChips, true, 0);
            }
        }
    });

    rtc.on('__left', function (data) {
        if (undefined !== data && null !== data) {
            console.log('player left : ' + JSON.stringify(data));
        } else {
            console.log('guest left');
        }

        if (undefined !== data && null !== data) {
            var index;
            if (gameStatus === STATUS_GAME_STANDBY || gameStatus === STATUS_GAME_FINISHED) {
                // rebuild player list
                currentPlayers = data.length;
                players = [];
                for (index = 0; index < currentPlayers; index++) {
                    var playerDisplayName = findDBPlayerNameByName(data[index]);
                    players[index] = new Player(data[index], data[index], playerDisplayName, defaultInitChips, true, 0);
                }
            } else {
                for (index = 0; index < currentPlayers; index++) {
                    players[index].setOnline(playerOnline(players[index].playerName, data));
                }
            }
        }
    });

    rtc.on('__game_over', function (data) {
        console.log('game over : ' + JSON.stringify(data));
        // set winners
        winners = data.winners;
        for (var index = 0; index < winners.length; index++) {
            winners[index].displayName = findDBPlayerNameByName(winners[index].playerName);
        }

        updateGame(data, true);
        gameStatus = STATUS_GAME_FINISHED;

        if (undefined !== autoStart && (autoStart === 1 || autoStart === '1')) {
            // auto start another game in 3s
            setTimeout(function () {
                startGame();
            }, 10 * 10000);
        }
    });

    rtc.on('__game_prepare', function (data) {
        console.log('game preparing : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_PREPARING;
        gameCountDown = data.countDown;
    });

    rtc.on('__game_start', function (data) {
        // update in game engine
        console.log('game start : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
    });

    rtc.on('__game_stop', function (data) {
        // update in game engine
        console.log('game stop : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_STANDBY;
    });

    rtc.on('__deal', function (data) {
        console.log('deal : ' + JSON.stringify(data));
        var board_card = data.table.board;
        var board = '';
        for (var index = 0; index < board_card.length; index++) {
            board += board_card[index] + ',';
        }

        // update player actions
        for (var i = 0; i < currentPlayers; i++) {
            players[i].setTakeAction(ACTION_STATUS_NONE);
        }

        // update in game engine
        gameStatus = STATUS_GAME_RUNNING;
        updateGame(data, false);
    });

    rtc.on('__new_round', function (data) {
        console.log('new round : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;

        // update in game engine
        updateGame(data, true);
    });

    rtc.on('__round_end', function (data) {
        console.log('round end : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
        updateGame(data, false);
    });

    // this request could be received in player mode only
    rtc.on('__action', function (data) {
        console.log('server request action : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
        // it's your turn !!
        if (playMode === MODE_PLAYER) {
            if (data.self.playerName === playerName) {
                turnAnimationShowed = false;
                yourTurn = true;
            } else {
                yourTurn = false;
            }
        }

        for (var i = 0; i < currentPlayers; i++) {
            if (players[i]) {
                if (players[i].playerName === data.self.playerName) {
                    players[i].setInTurn(true);
                    console.log('set player ' + data.self.playerName + ' thinking');
                    players[i].setTakeAction(ACTION_STATUS_THINKING);
                } else {
                    players[i].setInTurn(false);
                }
            }
        }
    });

    rtc.on('__bet', function (data) {
        console.log('server request bet : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
        // it's your turn !!
        if (playMode === MODE_PLAYER) {
            if (data.self.playerName === playerName) {
                turnAnimationShowed = false;
                yourTurn = true;
            } else {
                yourTurn = false;
            }
        }
        for (var i = 0; i < currentPlayers; i++) {
            if (players[i]) {
                if (players[i].playerName === data.self.playerName) {
                    players[i].setInTurn(true);
                    console.log('set player ' + data.self.playerName + ' thinking');
                    players[i].setTakeAction(ACTION_STATUS_THINKING);
                } else {
                    players[i].setInTurn(false);
                }
            }
        }
    });

    rtc.on('__show_action', function (data) {
        console.log('show action : ' + JSON.stringify(data));

        gameStatus = STATUS_GAME_RUNNING;
        var roundAction = data.action;

        console.log('find player by name ' + data.action.playerName);
        var playerIndex = findPlayerIndexByName(data.action.playerName);
        console.log('players : ' + JSON.stringify(players) + ', index = ' + playerIndex);

        if (roundAction.action === 'check' ||
            roundAction.action === 'fold' ||
            roundAction.action === 'raise' ||
            roundAction.action === 'call') {
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setTakeAction(ACTION_STATUS_DECIDED);
                players[playerIndex].setAction(roundAction.action);
                console.log('set player ' + players[playerIndex].playerName + ' decided : ' +
                    players[playerIndex].action);
                if (roundAction.action === 'fold') {
                    players[playerIndex].setBet(0);
                }
            }
        } else {
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setTakeAction(ACTION_STATUS_DECIDED);
                players[playerIndex].setAction(roundAction.action);
                console.log('set player ' + players[playerIndex].playerName + ' decided : ' +
                    players[playerIndex].action);
            }
        }
        // remove your turn
        if (yourTurn) {
            yourTurn = false;
        }
        // set in turn
        for (var i = 0; i < currentPlayers; i++) {
            if (players[i]) {
                if (playerIndex === i) {
                    players[i].setInTurn(true);
                } else {
                    players[i].setInTurn(false);
                }
            }
        }
        updateGame(data, false);
    });
}

function initGame() {
    var d = document;
    var container = document.getElementById('gameContainer');

    // the reference proportion HEIGHT / WIDTH = 3 / 4 = 0.75;
    var refProportion = 0.75;

    var marginLeft = getElementLeft(document.getElementById("gameContainer"));
    var marginTop = getElementTop(document.getElementById("gameContainer"));

    winHeight = document.documentElement.clientHeight;
    winWidth = document.documentElement.clientWidth;

    var realProportion = winHeight / winWidth;

    if (realProportion > refProportion) {
        // not likely
        gameWidth = winWidth;
        gameHeight = winWidth * refProportion;
    } else {
        // probably always
        gameHeight = winHeight;
        gameWidth = winHeight / refProportion;
    }

    container.innerHTML = '<canvas id="gameCanvas" width="' + gameWidth + '" height="' + gameHeight + '"></canvas>';
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
        p.insertBefore(s, null);

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
                    var gameBoard = new BoardLayer();
                    gameBoard.init();
                    this.addChild(gameBoard);
                    initPlayerInfo();
                }
            });
            cc.director.runScene(new LSScene());
        }, this);
    };
    cc.game.run('gameCanvas');
}

// game helper
function startGame() {
    rtc.startGame(tableNumber);
    gameStatus = STATUS_GAME_PREPARING;
}

function stopGame() {
    rtc.stopGame(tableNumber);
}

function updateGame(data, isNewRound) {
    var i;

    // update round
    if (data.table && data.table.roundCount) {
        currentRound = data.table.roundCount;
        currentRaiseCount = data.table.raiseCount;
        currentBetCount = data.table.betCount;
        currentRoundName = data.table.roundName;
    }

    // update table
    if (data.table) {
        publicCards = [null, null, null, null, null];
        for (i = 0; i < data.table.board.length; i++) {
            publicCards[i] = data.table.board[i];
        }
        currentSmallBlind = data.table.smallBlind.amount;
        currentBigBlind = data.table.bigBlind.amount;
    } else {
        console.log('data.table is null');
    }

    // update players
    if (data.players) {
        currentPlayers = data.players.length;
        console.log('player list (' + currentPlayers + ') = ' + JSON.stringify(players));
        for (i = 0; i < data.players.length; i++) {
            var targetPlayer = findTargetPlayer(data.players[i].playerName);
            if (null === targetPlayer) {
                continue;
            }
            targetPlayer.setDisplayName(findDBPlayerNameByName(data.players[i].playerName));
            if (isNewRound) {
                targetPlayer.setAction('');
                targetPlayer.setPrivateCards(null, null);
                targetPlayer.setAccumulate(0);
                targetPlayer.setBet(0);
                targetPlayer.setRoundBet(0);
                targetPlayer.setTakeAction(ACTION_STATUS_NONE);
                targetPlayer.setFolded(false);
                targetPlayer.setAllin(false);
            } else {
                if (data.players[i].cards && data.players[i].cards.length === 2) {
                    targetPlayer.setPrivateCards(data.players[i].cards[0], data.players[i].cards[1]);
                }
                targetPlayer.setBet(data.players[i].bet);
                targetPlayer.setRoundBet(data.players[i].roundBet);
                targetPlayer.setChips(data.players[i].chips);
                targetPlayer.setSurvive(data.players[i].isSurvive);
                targetPlayer.setFolded(data.players[i].folded);
                targetPlayer.setAllin(data.players[i].allIn);
                targetPlayer.setReloadCount(data.players[i].reloadCount);
            }

            if (data.table) {
                targetPlayer.setSmallBlind(targetPlayer.playerName === data.table.smallBlind.playerName);
                targetPlayer.setBigBlind(targetPlayer.playerName === data.table.bigBlind.playerName);
            }
        }
    }
}

function findTargetPlayer(playerName) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].playerName === playerName) {
            return players[i];
        }
    }
    return null;
}

function findPlayerIndexByName(playerName) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].playerName === playerName) {
            return i;
        }
    }
    return -1;
}

function playerOnline(playerName, playerList) {
    if (playerList) {
        for (var i = 0; i < playerList.length; i++) {
            if (playerList[i] === playerName) {
                return true;
            }
        }
        return false;
    }
    return true;
}

function findDBPlayerNameByName(playerName) {
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

// UI helper
function getElementLeft(element) {
    var actualLeft = element.offsetLeft;
    var current = element.offsetParent;
    while (current !== null) {
        actualLeft += current.offsetLeft;
        current = current.offsetParent;
    }
    return actualLeft;
}

function getElementTop(element) {
    var actualTop = element.offsetTop;
    var current = element.offsetParent;
    while (current !== null) {
        actualTop += current.offsetTop;
        current = current.offsetParent;
    }
    return actualTop;
}

// Action helper

function reload() {
    console.log('>>> reload');
    rtc.Reload();
}

function bet(amount) {
    console.log('>>> bet: ' + amount);
    rtc.Bet(amount);
}

function call() {
    console.log('>>> call');
    rtc.Call();
}

function check() {
    console.log('>>> check');
    rtc.Check();
}

function raise() {
    console.log('>>> raise');
    rtc.Raise();
}

function allin() {
    console.log('>>> allin');
    rtc.AllIn();
}

function fold() {
    console.log('>>> fold');
    rtc.Fold();
}