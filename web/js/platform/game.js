/**
 * Created by the-engine-team
 * 2017-08-21
 */

// data related
var tableNumber = 0;
var playerNamePlain = '';
var playerName = '';
var dbPlayers = [];
var autoStart = 0;
var gameBgm = 0;
var commandInterval = 1;
var roundInterval = 10;
var commandTimeout = 2;
var lostTimeout = 10;
var defaultSb = 10;
var defaultChips = 1000;
var reloadChance = 2;

// game board related
var gameBoard;
var winWidth, winHeight;
var gameWidth, gameHeight;
var audio1, audio2;

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
var playerMinBet = 0;
var playerMaxBet = 0;

var reloadTime = false;

var PLAYER_AT_LEFT = 0;
var PLAYER_AT_RIGHT = 1;

var players = [];
var currentPlayers = 0;
var onLinePlayers = 0;
var winners = [];

var defaultInitChips = 1000;
var publicCards = [];

var currentSmallBlind = 0;
var currentBigBlind = 0;

// communication related
var rtc = SkyRTC();

window.onbeforeunload = function () {
    return 'Are you sure to leave?';
};

$(document).ready(function () {
    // get table number first
    tableNumber = getParameter('table');
    playerNamePlain = getParameter('name');
    autoStart = getParameter('auto') || 0;
    gameBgm = getParameter('bgm') || 0;
    commandInterval = getParameter('commandInterval') || 0.5;
    roundInterval = getParameter('roundInterval') || 10;
    defaultSb = getParameter('defaultSb') || 10;
    defaultChips = getParameter('defaultChips') || 1000;
    reloadChance = getParameter('reloadChance') || 2;
    commandTimeout = getParameter('commandTimeout') || 5;
    lostTimeout = getParameter('lostTimeout') || 10;

    if (playerNamePlain) {
        playMode = MODE_PLAYER;
        playerName = md5(playerNamePlain);
        document.title = 'The Game';
    } else {
        playMode = MODE_LIVE;
        document.title = 'THE Live';
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
            tableNumber: tableNumber
        },
        timeout: 20000,
        success: function (response) {
            if (response.status.code === 0) {
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
        playerNamePlain, tableNumber, true);

    rtc.on('__new_peer', function (data) {
        console.log('legacy join : ' + JSON.stringify(data));
    });

    rtc.on('__new_peer_2', function (data) {
        var inPlayers = data.players;
        var tableStatus = data.tableStatus;

        if (gameStatus === STATUS_GAME_FINISHED) {
            return;
        }

        gameStatus = tableStatus;
        if (inPlayers) {
            console.log('player join : ' + JSON.stringify(data));
        } else {
            console.log('guest join');
        }

        if (undefined !== inPlayers && null !== inPlayers) {
            // rebuild player list
            players = [];
            currentPlayers = inPlayers.length;
            onLinePlayers = 0;
            for (var i = 0; i < inPlayers.length; i++) {
                var playerName = inPlayers[i].playerName;
                var playerDisplayName = findDBPlayerNameByName(playerName);
                console.log('create player ' + playerName);
                players[i] = new Player(playerName, playerDisplayName,
                    defaultInitChips, true, 0, inPlayers[i].isOnline);
                if (undefined !== inPlayers[i].isOnline && null !== inPlayers[i].isOnline && inPlayers[i].isOnline) {
                    onLinePlayers++;
                }

                if (gameBoard) {
                    gameBoard.resetPlayerLayers(players);
                }
            }
        }

        // sync game status here
        console.log('game status = ' + tableStatus);
        console.log('local players = ' + JSON.stringify(players));

        if (gameStatus === STATUS_GAME_RUNNING) {
            updateGame(data.basicData, false, false);
        }
    });

    rtc.on('__left', function (data) {
        console.log('legacy left : ' + JSON.stringify(data));
    });

    rtc.on('__left_2', function (data) {
        var inPlayers = data.players;
        var tableStatus = data.tableStatus;

        if (gameStatus === STATUS_GAME_FINISHED) {
            return;
        }

        if (inPlayers) {
            console.log('player left : ' + JSON.stringify(data));
        } else {
            console.log('guest left');
        }
        gameStatus = tableStatus;
        if (inPlayers) {
            var i;
            if (gameStatus === STATUS_GAME_RUNNING) {
                // update player online status while game is running
                currentPlayers = inPlayers.length;
                onLinePlayers = 0;
                for (i = 0; i < currentPlayers; i++) {
                    var playerName = inPlayers[i].playerName;
                    var targetPlayer = findTargetPlayer(playerName);
                    targetPlayer.setOnline(inPlayers[i].isOnline);
                    if (inPlayers[i].isOnline) {
                        onLinePlayers++;
                    }
                }
            } else if (gameStatus === STATUS_GAME_STANDBY) {
                // rebuild player list
                players = [];
                currentPlayers = inPlayers.length;
                onLinePlayers = 0;
                for (i = 0; i < currentPlayers; i++) {
                    console.log(inPlayers[i].playerName + ', online = ' + inPlayers[i].isOnline);
                    if (inPlayers[i].isOnline && true === inPlayers[i].isOnline) {
                        var playerName = inPlayers[i].playerName;
                        var playerDisplayName = findDBPlayerNameByName(playerName);
                        console.log('create player : ' + playerDisplayName);
                        players[i] = new Player(playerName, playerDisplayName,
                            defaultInitChips, true, 0, inPlayers[i].isOnline);
                        onLinePlayers++;
                    }
                }
                if (gameBoard) {
                    gameBoard.resetPlayerLayers(players);
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

        if (autoStart && parseInt(autoStart) === 1) {
            // auto start another game in 3s
            setTimeout(function () {
                startGame();
            }, 20 * 1000);
        } else {
            stopAudios();
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
        if (1 === parseInt(gameBgm)) {
            stopAudios();
            console.log('start play audio');
            audio1.play();
        }
    });

    rtc.on('__game_stop', function (data) {
        // update in game engine
        console.log('game stop : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_STANDBY;
        stopAudios();
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
            if (players[i]) {
                players[i].setTakeAction(ACTION_STATUS_NONE);
            }
        }

        // update in game engine
        gameStatus = STATUS_GAME_RUNNING;
        updateGame(data, false);
    });

    rtc.on('__new_round', function (data) {
        console.log('new round : ' + JSON.stringify(data));
        reloadTime = false;
        gameStatus = STATUS_GAME_RUNNING;
        // update in game engine
        updateGame(data, true);
    });

    rtc.on('__round_end', function (data) {
        console.log('round end : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
        reloadTime = true;
        updateGame(data, false, true);
    });

    // this request could be received in player mode only
    rtc.on('__action', function (data) {
        console.log('server request action : ' + JSON.stringify(data));
        gameStatus = STATUS_GAME_RUNNING;
        if (playMode === MODE_PLAYER) {
            console.log('self.name = ' + data.self.playerName + ', player name = ' + playerName);
            if (data.self.playerName.toLowerCase() === playerName.toLowerCase()) {
                turnAnimationShowed = false;
                yourTurn = true;
                playerMinBet = data.self.minBet;
                playerMaxBet = data.self.chips;
                console.log('your turn, binBet = ' + playerMinBet + ', maxBet = ' + playerMaxBet);
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
            if (data.self.playerName.toLowerCase() === playerName.toLowerCase()) {
                turnAnimationShowed = false;
                yourTurn = true;
                playerMinBet = data.self.minBet;
                playerMaxBet = data.self.chips;
                console.log('your turn, binBet = ' + playerMinBet + ', maxBet = ' + playerMaxBet);
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

        console.log('find targetPlayer by name ' + data.action.playerName);
        var targetPlayer = findTargetPlayer(data.action.playerName);
        console.log('players : ' + JSON.stringify(players));

        // play audio effect
        var audioIndex;
        if (ver === VER_ENGLISH) {
            audioIndex = roundAction.action;
        } else {
            if (roundAction.action === 'check') {
                if (targetPlayer.gender === 0) {
                    audioIndex = 'audio_check_boy';
                } else {
                    audioIndex = 'audio_check_girl';
                }
            } else if (roundAction.action === 'bet') {
                audioIndex = 'audio_bet';
            } else {
                audioIndex = 'audio_' + roundAction.action + '_' + targetPlayer.avatarId;
            }
        }
        var audioEffect = audioMap.get(audioIndex);
        cc.audioEngine.playEffect(audioEffect);

        if (roundAction.action === 'check' ||
            roundAction.action === 'fold' ||
            roundAction.action === 'raise' ||
            roundAction.action === 'call') {

            // update in game engine
            if (targetPlayer) {
                targetPlayer.setTakeAction(ACTION_STATUS_DECIDED);
                targetPlayer.setAction(roundAction.action);
                console.log('set targetPlayer ' + targetPlayer.playerName + ' decided : ' +
                    targetPlayer.action);
                if (roundAction.action === 'fold') {
                    targetPlayer.setBet(0);
                }
            }
        } else {
            // update in game engine
            if (targetPlayer) {
                targetPlayer.setTakeAction(ACTION_STATUS_DECIDED);
                targetPlayer.setAction(roundAction.action);
                console.log('set targetPlayer ' + targetPlayer.playerName + ' decided : ' +
                    targetPlayer.action);
            }
        }
        // remove your turn
        if (yourTurn) {
            yourTurn = false;
        }
        // set in turn
        for (var i = 0; i < currentPlayers; i++) {
            if (players[i]) {
                if (targetPlayer.playerName === players[i].playerName) {
                    targetPlayer.setInTurn(true);
                } else {
                    // targetPlayer.setInTurn(false);
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
                    gameBoard = new BoardLayer();
                    gameBoard.init();
                    this.addChild(gameBoard);
                    initPlayerInfo();
                }
            });
            cc.director.runScene(new LSScene());
        }, this);
    };
    cc.game.run('gameCanvas');

    // init bgm
    audio1 = new Audio('../res/audio/bgm.ogg');
    audio2 = new Audio('../res/audio/bgm.ogg');
    audio1.addEventListener('timeupdate', function () {
        if (this.currentTime > 151.7) {
            audio2.play();
        }
    }, false);
    audio1.addEventListener('ended', function () {
        this.pause();
        this.currentTime = 0;
    }, false);

    audio2.addEventListener('timeupdate', function () {
        if (this.currentTime > 151.7) {
            audio1.play();
        }
    }, false);
    audio2.addEventListener('ended', function () {
        this.pause();
        this.currentTime = 0;
    }, false);
}

// game helper
function startGame() {
    rtc.startGame(tableNumber, commandInterval, roundInterval,
        defaultSb, defaultChips, reloadChance, commandTimeout, lostTimeout);
    gameStatus = STATUS_GAME_PREPARING;
}

function stopGame() {
    rtc.stopGame(tableNumber);
}

function updateGame(data, isNewRound, roundClear) {
    var i;

    // update round
    if (data.table) {
        if (data.table.roundCount) {
            currentRound = data.table.roundCount;
        }
        if (data.table.raiseCount) {
            currentRaiseCount = data.table.raiseCount;
        }
        if (data.table.betCount) {
            currentBetCount = data.table.betCount;
        }
        if (data.table.roundName) {
            currentRoundName = data.table.roundName;
        }
        if (data.table.initChips) {
            defaultChips = data.table.initChips;
        }
        if (data.table.maxReloadCount) {
            reloadChance = data.table.maxReloadCount;
        }
        if (data.table.currentPlayer) {
            if (data.table.currentPlayer === playerName) {
                // show thinking
                var targetPlayer = findTargetPlayer(playerName);
                if (targetPlayer) {
                    targetPlayer.setInTurn(true);
                    console.log('set player ' + targetPlayer.playerName + ' thinking after reloaded');
                    turnAnimationShowed = false;
                    yourTurn = true;
                    playerMinBet = data.table.bigBlind.amount;
                    playerMaxBet = targetPlayer.chips;
                    targetPlayer.setTakeAction(ACTION_STATUS_THINKING);
                }
            }
        }
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
        for (i = 0; i < data.players.length; i++) {
            var targetPlayer = findTargetPlayer(data.players[i].playerName);
            if (null === targetPlayer) {
                continue;
            }
            targetPlayer.setDisplayName(findDBPlayerNameByName(data.players[i].playerName));
            targetPlayer.setOnline(data.players[i].isOnline);

            if (undefined !== data.players[i].reloadCount && null !== data.players[i].reloadCount) {
                targetPlayer.setReloadCount(data.players[i].reloadCount);
            }

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
                targetPlayer.setTotalChips(defaultChips, reloadChance);
                targetPlayer.setSurvive(data.players[i].isSurvive);
                targetPlayer.setFolded(data.players[i].folded);
                targetPlayer.setAllin(data.players[i].allIn);
                targetPlayer.setReloadCount(data.players[i].reloadCount);
            }

            if (roundClear) {
                if (undefined !== data.players[i].hand && null !== data.players[i].hand) {
                    targetPlayer.setHand(data.players[i].hand);
                }
                if (undefined !== data.players[i].winMoney && null !== data.players[i].winMoney) {
                    targetPlayer.setPrize(data.players[i].winMoney);
                }
            } else {
                targetPlayer.setHand(null);
                targetPlayer.setPrize(null);
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
        if (players[i] && players[i].playerName === playerName) {
            return players[i];
        }
    }
    return null;
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
            if (dbPlayers[i] && dbPlayers[i].playerName === playerName) {
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

function stopAudios() {
    audio1.pause();
    audio2.pause();
    audio1.currentTime = 0;
    audio2.currentTime = 0;
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
