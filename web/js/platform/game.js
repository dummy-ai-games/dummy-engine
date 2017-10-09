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
var STATUS_GAME_RUNNING = 1;
var STATUS_GAME_FINISHED = 2;

var gameStatus = STATUS_GAME_STANDBY;

var currentRoundName = '';
var currentRound = 1;
var currentRaiseCount = 0;
var currentBetCount = 0;

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

$(document).ready(function() {
    // get table number first
    tableNumber = getParameter('table');
    playerName = getParameter('name');
    autoStart = getParameter('auto') || 0;
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
        success: function(response) {
            if(response.status.code === 0) {
                console.log("get db players: " + JSON.stringify(response.entity));
                dbPlayers = response.entity;
            } else if(response.status.code === 1) {
                console.log('list player failed, use player name as display name');
            }
            initWebsock();
        },
        error: function() {
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

    rtc.on('__new_peer', function(data) {
        if (data) {
            console.log('player join : ' + JSON.stringify(data));
        } else {
            console.log('guest join');
        }

        if (undefined !== data && null !== data) {
            currentPlayers = data.length;
            // rebuild player list
            players = [];
            for (var i = 0; i < currentPlayers; i++) {
                var playerDisplayName = findDBPlayerNameById(data[i]);
                players[i] = new Player(data[i], data[i], playerDisplayName, defaultInitChips, true, 0);
            }
        }
    });

    rtc.on('__left', function(data) {
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
                    var playerDisplayName = findDBPlayerNameById(data[index]);
                    players[index] = new Player(data[index], data[index], playerDisplayName, defaultInitChips, true, 0);
                }
            } else {
                for (index = 0; index < currentPlayers; index++) {
                    players[index].setOnline(playerOnline(players[index].playerName, data));
                }
            }
        }
    });

    rtc.on('__game_over', function(data) {
        console.log('game over : ' + JSON.stringify(data));
        // set winners
        winners = data.winners;
        for (var index = 0; index < winners.length; index++) {
            winners[index].displayName = findDBPlayerNameById(winners[index].playerName);
        }

        updateGame(data, true);
        gameStatus = STATUS_GAME_FINISHED;

        if (undefined !== autoStart && (autoStart === 1 || autoStart === '1')) {
            // auto start another game in 3s
            setTimeout(function() {
                startGame();
            }, 10000);
        }
    });

    rtc.on('__game_start', function(data) {
        // update in game engine
        console.log('game start : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
    });

    rtc.on('__game_stop', function(data) {
        // update in game engine
        console.log('game stop : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_STANDBY;
    });

    rtc.on('__deal', function(data) {
        console.log('deal : ' + JSON.stringify(data));
        var board_card = data.table.board;
        var board = '';
        for (var index = 0; index < board_card.length; index++) {
            board += board_card[index] + ',';
        }

        // update in game engine
        gameStatus = STATUS_GAME_RUNNING;
        updateGame(data, false);
    });

    rtc.on('__new_round', function(data) {
        console.log('new round : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;

        // update in game engine
        updateGame(data, true);
    });

    rtc.on('__round_end', function(data) {
        console.log('round end : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
        updateGame(data, false);
    });

    rtc.on('__show_action', function(data) {
        console.log('show action : ' + JSON.stringify(data));

        gameStatus = STATUS_GAME_RUNNING;
        var roundAction = data.action;

        var playerIndex = findPlayerIndexById(data.action.playerName);
        if (roundAction.action === 'check' ||
            roundAction.action === 'fold' ||
            roundAction.action === 'raise' ||
            roundAction.action === 'call') {
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setTakeAction(true);
                players[playerIndex].setAction(roundAction.action);
                if (roundAction.action === 'fold') {
                    players[playerIndex].setBet(0);
                }
            }
        } else {
            // update in game engine
            if (playerIndex !== -1) {
                players[playerIndex].setTakeAction(true);
                players[playerIndex].setAction(roundAction.action);
            }
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

    winHeight = document.documentElement.clientHeight - marginTop - 8;
    winWidth = document.documentElement.clientWidth - marginLeft * 2;

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
    window.addEventListener('DOMContentLoaded', function() {
        ccLoad();
    });
}

function ccLoad() {
    cc.game.onStart = function() {
        //load resources
        cc.LoaderScene.preload(resources, function() {
            var LSScene = cc.Scene.extend({
                onEnter: function() {
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
            players[i].setId(data.players[i].playerName);
            players[i].setDisplayName(findDBPlayerNameById(data.players[i].playerName));
            if (isNewRound) {
                players[i].setAction('');
                players[i].setPrivateCards(null, null);
                players[i].setAccumulate(0);
                players[i].setBet(0);
                players[i].setRoundBet(0);
                players[i].setTakeAction(false);
                players[i].setFolded(false);
                players[i].setAllin(false);
            } else {
                if (data.players[i].cards && data.players[i].cards.length === 2) {
                    players[i].setPrivateCards(data.players[i].cards[0], data.players[i].cards[1]);
                }
                players[i].setBet(data.players[i].bet);
                players[i].setRoundBet(data.players[i].roundBet);
                players[i].setChips(data.players[i].chips.toFixed(1));
                players[i].setSurvive(data.players[i].isSurvive);
                players[i].setFolded(data.players[i].folded);
                players[i].setAllin(data.players[i].allIn);
                players[i].setReloadCount(data.players[i].reloadCount);
            }

            if (data.table) {
                players[i].setSmallBlind(players[i].playerName === data.table.smallBlind.playerName);
                players[i].setBigBlind(players[i].playerName === data.table.bigBlind.playerName);
            }
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

// UI helper
function getElementLeft(element) {
    var actualLeft = element.offsetLeft;
    var current = element.offsetParent;
    while (current !== null){
        actualLeft += current.offsetLeft;
        current = current.offsetParent;
    }
    return actualLeft;
}

function getElementTop(element) {
    var actualTop = element.offsetTop;
    var current = element.offsetParent;
    while (current !== null){
        actualTop += current.offsetTop;
        current = current.offsetParent;
    }
    return actualTop;
}
