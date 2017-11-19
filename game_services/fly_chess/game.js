/**
 * Created by the-engine-team
 * 2017-08-21
 */

var events = require('events');

var gameLogic = require('../../work_units/game_logic.js');
var tableLogic = require('../../work_units/table_logic.js');

var logger = require('../../poem/logging/logger4js').helper;

var Enums = require('../../constants/enums.js');
var enums = new Enums();
var ErrorCode = require('../../constants/error_code.js');
var errorCode = new ErrorCode();

var dateUtils = require('../../poem/utils/date_utils.js');
var MD5Utils = require('../../poem/crypto/md5.js');

var INNER_FLUSH = true;


var conf = require("./conf.js");
/**
 * Class Table
 * @param smallBlind
 * @param bigBlind
 * @param minPlayers
 * @param maxPlayers
 * @param initChips
 * @param maxReloadCount
 * @param maxRoundCount
 * @param commandInterval
 * @param roundInterval
 * @param commandTimeout
 * @param lostTimeout
 * @returns {*}
 * @constructor
 */
function Table(minPlayers, maxPlayers, sumFly, commandTimeout, commandInterval, lostTimeout) {

    this.minPlayers = minPlayers || 2;
    this.maxPlayers = maxPlayers || 4;
    this.sumFly = sumFly || 3;
    this.players = [];
    this.timeout = null;
    this.playersToRemove = [];
    this.playersToAdd = [];
    this.eventEmitter = new events.EventEmitter();
    this.turnBet = {};
    this.gameWinners = [];
    this.currentPlayer = 0;
    this.playingCount = 0;
    this.randNumber = 0;


    this.status = enums.GAME_STATUS_STANDBY;
    this.isActionTime = false;
    this.countDown = 5;

    this.commandTimeout = commandTimeout || 2;
    this.commandInterval = commandInterval || 1;
    this.lostTimeout = lostTimeout || 10;

    this.startTime = dateUtils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
    // generate a game instance with ID
    this.instID = MD5Utils.MD5(this.startTime);


    // Validate acceptable value ranges.
    var err;
    if (minPlayers < 2) { // Require at least 3 players to start a game.
        err = new Error(101, 'Parameter [minPlayers] must be a positive integer of a minimum value of 2.');
    } else if (maxPlayers > 4) { // Hard limit of 10 players at a table.
        err = new Error(102, 'Parameter [maxPlayers] must be a positive integer less than or equal to 10.');
    } else if (minPlayers > maxPlayers) { // Without this we can never start a game!
        err = new Error(103, 'Parameter [minPlayers] must be less than or equal to [maxPlayers].');
    }
    var that = this;
    if (err) {
        return err;
    }

    this.eventEmitter.on('getAction', function () {
        logGame(that.tableNumber, 'get Action');

        if (getNextPlayer(that))
            takeAction(that, '__turn');
    });

    this.eventEmitter.on('showAction', function (data) {
        var myData = getBasicData(that);
        myData.action = data;
        logGame(that.tableNumber, 'show action:' + data);
        that.eventEmitter.emit('__show_action', myData);
    });

    this.eventEmitter.on('deal', function () {
        if (that.playingCount <= 1) {
            that.eventEmitter.emit("gameEnd");
        } else {
            var lastRandNumber = that.randNumber;
            that.randNumber = parseInt(Math.random() * (6)) + 1;
            var myData = getBasicData(that);
            that.eventEmitter.emit('__dice', myData);
            if (lastRandNumber === 6) {
                takeAction(that, '__turn');
            } else if (getNextPlayer(that)) {
                takeAction(that, '__turn');
            } else {
                logGame(that.tableNumber, "get next player error");
            }
            logGame(that.tableNumber, "__turn, current player is " + that.players[that.currentPlayer].playerName);
        }
    });

    this.eventEmitter.on('gameEnd', function () {
        updateGame(that);
        updateTable(that, enums.GAME_STATUS_FINISHED);

        logGame(that.tableNumber, 'game over, winners : ');
        that.status = enums.GAME_STATUS_FINISHED;
        logGame(that.tableNumber, JSON.stringify(that.gameWinners));

        var data = getBasicData(that);
        data.winners = that.gameWinners;
        that.eventEmitter.emit('__game_over', data);
    });
}

Table.prototype.resetCountDown = function () {
    this.countDown = 3;
};

Table.prototype.checkPlayer = function (player) {
    return player === this.currentPlayer;
};


Table.prototype.getEventEmitter = function () {
    return this.eventEmitter;
};

Table.prototype.getCurrentPlayer = function () {
    return this.players[this.currentPlayer].playerName;
};

// Player actions: Check(), Fold(), Bet(bet), Call(), AllIn()

Table.prototype.getWinners = function () {
    return this.gameWinners;
};

Table.prototype.StartGame = function () {
    // If there is no current game and we have enough players, start a new game.
    var that = this;
    logger.info('start game');
    if (!this.game) {
        this.playersToRemove = [];
        this.currentPlayer = parseInt(Math.random() * (this.playingCount));
        this.status = enums.GAME_STATUS_RUNNING;
        this.game = new Game(that.sumFly);
        this.NewRound();
        updateGame(that);
        updateTable(that, enums.GAME_STATUS_RUNNING);
    }
};

Table.prototype.StopGame = function () {
    logger.info('stop game');
    if (!this.game) {
        // TODO: to implement a status for game PAUSED
        this.status = enums.GAME_STATUS_STANDBY;
    }
};

Table.prototype.AddPlayer = function (playerName, displayName) {
    var that = this;
    if (that.playersToAdd.length >= that.maxPlayers) {
        logGame(that.tableNumber, "already arrive max players,can't continue join");
        return;
    }
    var player = new Player(playerName, displayName, that);
    that.playersToAdd.push(player);
    that.playingCount++;
};


Table.prototype.NewRound = function () {
    // Add players in waiting list
    var removeIndex = 0;
    var i;
    var that = this;
    for (i = 0; i < that.playersToAdd.length; i++) {
        var player = that.playersToAdd[i];
        for (var j = 0; j < that.sumFly; j++)
            player.arrFly.push(new Fly());
        player.position = i;
        that.players.push(this.playersToAdd[i]);
    }
    that.playersToAdd = [];
    that.gameWinners = [];

    // Get currentPlayer
    that.eventEmitter.emit('deal');
};


/**
 * Class Player
 * @param playerName
 * @param displayName
 * @constructor
 */
function Player(playerName, displayName, table) {
    this.arrFly = [];//总的飞行棋
    this.nSumFlying = 0;//起飞的个数
    this.nSumFlied = 0;//已经成功的个数
    this.playerName = playerName;
    this.displayName = displayName;
    this.position = -1;
    this.table = table;
    this.isFinished = false;
}

function Game(SumFly) {
    this.SumFly = SumFly || 3;// 每个玩家的棋子个数

    this.SumGridsFinshed = 56;// 一个棋子在地图上需要行走的总数

    this.SumGridsPublic = 50;// 每个棋子公共棋道步数

    this.SumGridsPublicTotal = 52;//公共棋道总数

    this.SumGridsuser = 6;// 进入自己城堡后的棋道步数

    this.ArrGridsOriginal = [//地图
        0, 0, 4, 0, 0, 0, 4, 0, 0, 0,
        4, 0, 0, 0, 4, 0, 0, 0, 12, 0,
        0, 0, 4, 0, 0, 0, 4, 0, 0, 0,
        4, 0, 0, 0, 4, 0, 0, 0, 4, 0,
        0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0 // 6个入城堡的格子
    ];
}

function getBasicData(table) {
    var players = [];
    var data = {};

    for (var i = 0; i < table.players.length; i++) {
        var player = {};
        player.playerName = table.players[i]['playerName'];
        player.displayName = table.players[i]['displayName'];
        player.position = table.players[i]['position'];
        player.isFinished = table.players[i]['isFinished'];
        player.nSumFlying = table.players[i]['nSumFlying'];
        player.nSumFlied = table.players[i]['nSumFlied'];
        player.arrFly = [];
        for (var j = 0; j < table.players[i]['arrFly'].length; j++) {
            var fly = table.players[i]['arrFly'][j];
            player.arrFly.push({
                "nIndGridLocal": fly.nIndGridLocal,
                "nIndGridGlobal": fly.nIndGridGlobal
            })
        }
        if (i === table.currentPlayer) {
            data.currentPlayer = player;
        }
        players.push(player);
    }
    var table = {
        "tableNumber": table.tableNumber,
        "status": table.status,
        "randNumber": table.randNumber,
        "game": {
            "SumFly": table.game.SumFly,// 每个玩家的棋子个数

            "SumGridsFinshed": table.game.SumGridsFinshed,// 一个棋子在地图上需要行走的总数

            "SumGridsPublic": table.game.SumGridsPublic,// 公共棋道步数

            "SumGridsPublicTotal": table.game.SumGridsPublicTotal,

            "SumGridsuser": table.game.SumGridsuser,// 进入自己城堡后的棋道步数

            "ArrGridsOriginal": table.game.ArrGridsOriginal//地图
        }
    };
    data.players = players;
    data.table = table;
    return data;
}

var Fly = function (table) {
    this.nIndGridLocal = -1;// -1表示未起飞， 0表示已经起飞，>0表示在航道上，conf.SumGridsFinshed表示到达终点
    this.nIndGridGlobal = -1;

    this.moveOperate = function (user, step) {
        if (this.nIndGridLocal == -1) {// 起飞
            this.nIndGridLocal = 0;
            user.nSumFlying++;
            return [];
        }
        if (step !== 0)
            this.computeIndLocalGlobal(user, step);
    };


    this.computeIndLocalGlobal = function (user, step) {
        this.nIndGridLocal += step;
        if (this.nIndGridLocal <= 0) {
            this.nIndGridLocal = 1;
        }
        this.adjustLocalAndGlobal(user);
    };

    this.beBroken = function () {
        this.nIndGridLocal = this.nIndGridGlobal = -1;
    };
    this.adjustLocalAndGlobal = function (user) {
        if (this.nIndGridLocal === user.table.game.SumGridsFinshed) {// succeed
            user.succeedFlyOne();
        } else if (this.nIndGridLocal > user.table.game.SumGridsFinshed) {// 超过了目标点
            this.nIndGridLocal = user.table.game.SumGridsFinshed - (this.nIndGridLocal - user.table.game.SumGridsFinshed);
        }
        this.nIndGridGlobal = this.gridLocalToGlobal(user, this);
    };

    this.gridLocalToGlobal = function (user, fly) {
        var nGlobal = fly.nIndGridLocal;
        if (fly.nIndGridLocal <= user.table.game.SumGridsPublic) {// on public road
            nGlobal = nGlobal + user.position * (user.table.game.SumGridsPublicTotal / user.table.maxPlayers);
            if (nGlobal > user.table.game.SumGridsPublic)     nGlobal -= user.table.game.SumGridsPublic;
            console.log('************************************************************');
            console.log('nPos/nLocal/nGlobal', user.position, fly.nIndGridLocal, nGlobal);
            console.log('************************************************************');
        }
        return nGlobal;
    };
};


Player.prototype.brokenOneFly = function (index) {
    this.arrFly[index].beBroken();
    this.nSumFlying--;
};

Player.prototype.succeedFlyOne = function () {
    this.nSumFlying--;
    this.nSumFlied++;
    var that = this;
    if (that.nSumFlied === that.table.game.SumFly) {
        that.table.gameWinners.push({
            "playerName": that.playerName,
            "displayName": that.displayName
        });
        that.isFinished = true;
        that.table.playingCount--;
    }
};

Player.prototype.Move = function (flys) {
    var that = this;
    if (flys && flys.length > 0) {
        var step = parseInt(that.randNumber / flys.length);
        logGame(that.tableNumber, "start forward " + step);
        var beforMove = that.arrFly[flys[0]].nIndGridLocal;
        that.forward(flys, step);
        var afterMove = that.arrFly[flys[0]].nIndGridLocal;
        var finalStep = afterMove - beforMove;
        that.turnBet = {action: 'move', playerName: this.playerName, flys: flys, step: finalStep};
        that.table.eventEmitter.emit('showAction', this.turnBet);
        progress(that.table);
    } else {
        that.defaultAction();
    }
};

Player.prototype.flyOne = function (index) {
    var that = this;
    logGame(that.tableNumber, "start get a new fly");
    if (index > 0 && index < that.arrFly.length) {
        var isMove = false;
        var flys = [];
        flys.push(index);
        var flyLocal = that.arrFly[index].nIndGridLocal;
        if (flyLocal > 0)
            isMove = true;
        if (isMove) {
            var step = parseInt(that.randNumber);
            var beforMove = that.arrFly[flys[0]].nIndGridLocal;
            that.forward(flys, step);
            var afterMove = that.arrFly[flys[0]].nIndGridLocal;
            var finalStep = afterMove - beforMove;
            that.turnBet = {action: 'move', playerName: this.playerName, flys: flys, step: finalStep};
            that.table.eventEmitter.emit('showAction', this.turnBet);
        } else {
            that.turnBet = {action: 'flyone', playerName: this.playerName, flyIndex: index};
            that.table.eventEmitter.emit('showAction', this.turnBet);
            that.arrFly[index].moveOperate(that, 0);
        }
        progress(that.table);
    } else {
        logGame(that.tableNumber, "index is illegal, default choose one fly to move");
        that.defaultAction();
    }
};

Player.prototype.defaultAction = function () {
    var that = this;
    var flys = [];
    logGame(that.tableNumber, "start defalut action");
    for (var i = 0; i < that.arrFly.length; i++) {
        var flyLocal = that.arrFly[i].nIndGridLocal;
        if (flyLocal !== that.table.game.SumGridsFinshed && flyLocal > -1) {
            flys.push(i);
            break;
        }
    }
    var step = parseInt(that.randNumber);
    var beforMove = that.arrFly[flys[0]].nIndGridLocal;
    that.forward(flys, step);
    var afterMove = that.arrFly[flys[0]].nIndGridLocal;
    var finalStep = afterMove - beforMove;
    that.turnBet = {action: 'move', playerName: that.playerName, flys: flys, step: finalStep};
    that.table.eventEmitter.emit('showAction', this.turnBet);
    progress(that.table);
}

Player.prototype.forward = function (flys, step) {
    var that = this;
    var legalFlys = that.testLegal(flys);
    var startLocal = that.arrFly[legalFlys[0]].nIndGridLocal;
    var startGlobal = that.arrFly[legalFlys[0]].nIndGridGlobal;
    var isPrize = false;
    var prize = 0;
    var isFly = false;
    var fly = 0;
    for (var i = 1; i <= step; i++) {
        var tempGlobal = startGlobal + i;
        var tempLocal = startLocal + i;
        var isFinalStep = i == step ? true : false;
        var result = 0;
        var arrFliesConflict = that.testConflictOtherFly(tempLocal, tempGlobal, legalFlys.length, isFinalStep);
        if (arrFliesConflict === -1) {
            logGame(that.table.tableNumber, "is blocked,can't continue forward,start back");
            var isEnd = true;
            if (isFly)
                result = step - fly;
            else if (isPrize)
                result = step - prize;
            else
                result = step - i > 0 ? 2 * i - step : i - 1;
            if (result < 0) {
                result = that.back(legalFlys, -result);
                if (result > 0) {
                    step += result;
                    isEnd = false;
                }
            }
            if (isEnd) {
                for (var j = 0; j < legalFlys.length; j++) {
                    that.arrFly[legalFlys[j]].moveOperate(that, result);
                }
                break;
            }
        } else if (isFinalStep) {
            var typeGrid = that.table.game.ArrGridsOriginal[tempLocal];
            if (!isPrize || typeGrid === conf.TypeGrid.FLY) {
                var temp = that.testPrizeGrid(tempLocal);
                if (typeGrid === conf.TypeGrid.FLY)
                    fly = temp;
                else
                    prize = temp;
                step += temp;
                if (temp > 0) {
                    if (temp === conf.TypeGrid.FLY) {
                        i = step - 1;
                        isFly = true;
                    } else
                        isPrize = true;
                }
            } else {
                result = step;
                for (var j = 0; j < legalFlys.length; j++) {
                    that.arrFly[legalFlys[j]].moveOperate(that, result);
                }
            }
        }
    }
};

Player.prototype.back = function (flys, step) {
    var startLocal = that.arrFly[flys[0]].nIndGridLocal;
    var startGlobal = that.arrFly[flys[0]].nIndGridGlobal;
    var that = this;
    var result = -step;

    for (var i = 1; i <= step; i++) {
        var tempGlobal = startGlobal - i;
        var tempLocal = startLocal - i;

        var isFinalStep = i === step ? true : false;
        var arrFliesConflict = that.testConflictOtherFly(tempLocal, tempGlobal, flys.length, isFinalStep);
        if (arrFliesConflict === -1) {
            logGame(that.table.tableNumber, "is blocked, can't continue back,start forward");
            result = -(step - i > 0 ? 2 * i - step : i - 1);
            break;
        }
    }
    return result;
};

Player.prototype.testLegal = function (flys) {
    var isLegal = true;
    var that = this;
    for (var i = 0; i < flys.length - 1; i++) {
        var fly = that.arrFly[flys[i]];
        var fly2 = that.arrFly[fly[i + 1]];
        if (fly.nIndGridGlobal != fly2.nIndGridGlobal) {
            isLegal = false;
            break
        }
    }
    if (!isLegal) {
        logGame(that.table.tableNumber, "choose flys are illegal, default choose first fly");
        return flys[0];
    } else
        return flys;
}

Player.prototype.testPrizeGrid = function (local) {
    var that = this;
    if (local > that.table.game.SumGridsPublic)     return 0;

    var typeGrid = that.table.game.ArrGridsOriginal[local];
    var prize = 0;
    switch (typeGrid) {
        case conf.TypeGrid.NONE:
            prize = 0;
            break;
        case conf.TypeGrid.FLY:
            prize = conf.TypeGrid.FLY;
            break;
        case conf.TypeGrid.FORWARD:
            prize = conf.TypeGrid.FORWARD;
            break;
    }
    return prize;
};

Player.prototype.testConflictOtherFly = function (local, global, count, isFinalStep) {
    var arrFliesConflict = [];
    var that = this;
    if (local > that.table.game.SumGridsPublic)
        return 0;

    if (local <= 0) {
        return -1;
    }

    if (!isFinalStep && that.table.randNumber === 6) {//掷出6可以跳过其他棋子
        return 0;
    }

    var arrUsers = that.table.players;
    var arrFly;
    var fly;
    var user;
    for (var i = arrUsers.length - 1; i > -1; i--) {
        user = arrUsers[i];
        if (!user || that === user)
            continue;
        arrFly = user.arrFly;
        var num = [];
        for (var j = arrFly.length - 1; j > -1; j--) {
            fly = arrFly[j];
            if (fly.nIndGridLocal > 0 && fly.nIndGridGlobal === global) {
                num.push(j);
            }
        }
        if (num.length > 0 && num.length <= count) {
            if (isFinalStep) {
                for (var k = 0; k < num.length; k++) {
                    user.brokenOneFly(k);
                    arrFliesConflict++;
                }
            }
        } else if (num.length > 0) {
            arrFliesConflict = -1;
        }

    }

    return arrFliesConflict;
};


function progress(table) {
    table.isActionTime = false;
    if (table.game && table.status === enums.GAME_STATUS_RUNNING) {
        table.eventEmitter.emit("deal");
    }
}


function getNextPlayer(table) {
    if (!table) {
        logger.error('table is destroyed');
    }

    var result = true;
    var count = 0;

    do {
        table.currentPlayer = (table.currentPlayer >= table.players.length - 1) ?
            (table.currentPlayer - table.players.length + 1) : (table.currentPlayer + 1 );
        count++;
        if (count > table.players.length)//fix bug for cpu 100%
        {
            result = false;
            break;
        }

    } while (table.players[table.currentPlayer].isFinished);

    return result;
}


function updateGame(table) {
    var players = [];
    for (var i = 0; i < table.players.length; i++) {
        var allChips = table.players[i].chips +
            (table.maxReloadCount - table.players[i].reloadCount) * table.initChips;
        var player = {
            playerName: table.players[i].playerName,
            displayName: table.players[i].displayName,
            chips: allChips
        };
        players.push(player);
    }

    var newGame = {
        tableNumber: table.tableNumber,
        status: table.status,
        players: players,
        startTime: table.startTime,
        instID: table.instID
    };
    gameLogic.updateGameWorkUnit(table.tableNumber, table.instID, newGame, function (updateGameErr) {
        if (updateGameErr.code === errorCode.SUCCESS.code) {
        }
    });
}

function updateTable(table, status) {
    var players = [];
    var playerLength;

    if (table.players) {
        playerLength = table.players.length;
    } else {
        playerLength = 0;
    }
    for (var i = 0; i < playerLength; i++) {
        var player = {
            playerName: table.players[i].playerName,
            isOnline: true
        };
        players.push(player);
    }

    var newTable = {
        tableNumber: table.tableNumber,
        players: players,
        status: status
    };
    tableLogic.updateTableWorkUnit(table.tableNumber, newTable, function (updateTableErr) {
        if (updateTableErr.code === errorCode.SUCCESS.code) {
        }
    })
}

function takeAction(table, action) {
    table.timeout = setTimeout(function () {
        table.timeout = null;
        if (table.status === enums.GAME_STATUS_RUNNING) {
            var data = getBasicData(table);
            table.eventEmitter.emit(action, data);
            table.isActionTime = true;
        }
    }, table.commandInterval * 1000);
}


function logGame(tableNumber, msg) {
    logger.info('>>> table ' + tableNumber + ' >>> ' + msg);
}

/**
 * Exported functions
 */
exports.Table = Table;
exports.getBasicData = getBasicData;
exports.getNextPlayer = getNextPlayer;
exports.logGame = logGame;
