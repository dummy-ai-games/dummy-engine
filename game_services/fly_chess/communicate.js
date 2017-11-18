/**
 * Created by the-engine team
 * 2017-07-22
 */


const WebSocket = require('ws');
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var flyChess = require('./game.js');
var playerLogic = require('../../work_units/player_logic.js');
var tableLogic = require('../../work_units/table_logic.js');

var DEFAULT_GAME_OVER_DELAY = 1000;



var logger = require('../../poem/logging/logger4js').helper;

var Enums = require('../../constants/enums.js');
var ErrorCode = require('../../constants/error_code.js');

var enums = new Enums();
var errorCode = new ErrorCode();

var MD5Utils = require('../../poem/crypto/md5.js');

/**
 * Class SkyRTC
 * @constructor
 */
function SkyRTC(tableNumber) {
    this.table = {};
    this.admin = null;
    this.players = {};
    this.guests = {};
    this.exitPlayers = {};
    this.tableNumber = tableNumber;


    this.on('__join', function (data, socket) {
        var that = this;
        var playerName = data.playerName;
        var table = data.tableNumber;

        logger.info('on __join, playerName = ' + playerName + ', table = ' + table);
        if (table) {
            socket.tableNumber = table;
        } else if (!playerName) {
            logger.info('player is invalid, close its socket');
            socket.close();
            return;
        }

        if (playerName) {
            var MD5Id = MD5Utils.MD5(playerName);
            if (that.players[MD5Id]) {
                logger.warn('player: ' + playerName + ' already exist, reject');
                return;
            }
            playerLogic.getPlayerByName(playerName, function (getPlayerErr, player) {
                if (errorCode.SUCCESS.code === getPlayerErr.code) {
                    var tableNumber = player.tableNumber + "";
                    if (!that.tableNumber || tableNumber === that.tableNumber) {
                        socket.id = playerName;
                        socket.displayName = player.displayName;
                        socket.MD5Id = MD5Id;
                        if (that.players[MD5Id]) {
                            that.players[MD5Id].isReplace = true;
                            that.players[MD5Id].close();
                        }
                        var exitPlayerTableNum = that.exitPlayers[socket.MD5Id];
                        if (exitPlayerTableNum !== undefined) {
                            socket.tableNumber = exitPlayerTableNum;
                            delete that.exitPlayers[socket.MD5Id];
                            logger.info('player rejoin, accept join');
                        } else if (that.players[MD5Id]) {
                            socket.tableNumber = tableNumber;
                            logger.info('exist player replace, accept join');
                        } else if (!(that.table[tableNumber] &&
                            that.table[tableNumber].status === enums.GAME_STATUS_RUNNING)) {
                            socket.tableNumber = tableNumber;
                            logger.info('game not started, accept join');
                        }
                        if (socket.tableNumber) {
                            logger.info('player : ' + data.playerName + ' join!!');
                            that.players[socket.MD5Id] = socket;
                            var tablePlayers = that.notifyJoin(socket.tableNumber);
                            that.initPlayerData(socket.MD5Id);
                            // update game
                            that.updateTable(socket.tableNumber, tablePlayers, enums.GAME_STATUS_STANDBY);
                        } else {
                            socket.close();
                            logger.info('player : ' + data.playerName + ' can not join because game has started');
                        }
                    } else {
                        logger.info('player ' + playerName + ' tableNumber is wrong, connection should be dropped');
                        socket.close();
                    }
                } else {
                    logger.info('player ' + playerName + ' is not valid, connection should be dropped');
                    socket.close();
                }
            });
        } else{
            socket.isGuest = true;
            that.guests[socket.id] = socket;
            that.initGuestData(socket.id);
            // updated by strawmanbobi - the Live UI need this command to show joined players
            that.notifyJoin(socket.tableNumber);
        }
    });

    this.on('__prepare_game', function (data) {
        this.prepareGame(data.tableNumber, data.sumFly, data.commandInterval, data.commandTimeout, data.lostTimeout);
    });

    this.on('__start_game', function (data) {
        // TODO: do something with this command
    });

    this.on('__stop_game', function (data) {
        this.stopGame(data.tableNumber);
    });

    this.on('__end_game', function (data) {
        this.endGame(data.tableNumber);
    });


    this.on('__action', function (data, socket) {
        var timestamp = new Date().getTime();
        try {
            var that = this;
            var action = data.action;
            var playerName = socket.MD5Id;
            if (that.players[playerName]) {
                var tableNum = that.players[playerName].tableNumber;
                var currentTable = that.table[tableNum];
                if (currentTable) {
                    var playerIndex = parseInt(getPlayerIndex(playerName, currentTable.players));
                    if (playerIndex !== -1 && currentTable.checkPlayer(playerIndex) && currentTable.isActionTime) {
                        if (currentTable.timeout)
                            clearTimeout(currentTable.timeout);
                        //fix bug, should not accept action util server have request action
                        currentTable.isActionTime = false;
                        try {
                            switch (action) {
                                case 'move':
                                    var flys = data.flys;
                                    currentTable.players[playerIndex].Move(flys);
                                    break;
                                case 'fly':
                                    var flyIndex = data.flyIndex;
                                    currentTable.players[playerIndex].flyOne(flyIndex);
                                    break;
                                default:
                                    currentTable.players[playerIndex].defaultAction();
                                    break;
                            }
                        } catch (e) {
                            logger.error(e.message);
                            currentTable.players[playerIndex].defaultAction();
                        }
                    }
                }
            }
        } catch (e) {
            logger.error(e.message);
        }
    });
}

util.inherits(SkyRTC, events.EventEmitter);

SkyRTC.prototype.initGuestData = function (guest) {
    var that = this;
    if (that.guests[guest]) {
        var tableNumber = that.guests[guest].tableNumber;
        logger.info('initGuestData, tableNumber = ' + tableNumber);
        if (that.table[tableNumber] && that.table[tableNumber].status === enums.GAME_STATUS_RUNNING) {
            var data = that.getBasicData(that.guests[guest].tableNumber);
            var message = {
                'eventName': '_join',
                'data': data
            };
            if (!that.guests[guest]) {
                logger.info('guest socket is null');
            }
            that.sendMessage(that.guests[guest], message);
        }
    } else {
        logger.info('guest ' + guest + 'already exit');
    }
};

SkyRTC.prototype.initPlayerData = function (player) {
    var that = this;
    if (that.players[player]) {
        logger.info('initPlayerData');
        var tableNumber = that.players[player].tableNumber;
        if (that.table[tableNumber] && that.table[tableNumber].status === enums.GAME_STATUS_RUNNING) {
            var data = that.getBasicData(that.players[player].tableNumber);
            for (var i in data.players) {
                if (data.players[i].playerName !== that.players[player].id)
                    delete data.players[i].cards;
            }
            var message = {
                'eventName': '__join',
                'data': data
            };
            that.sendMessage(that.players[player], message);
        }
    } else
        logger.info('player ' + player + 'already exit');
};

SkyRTC.prototype.removeAllGuestByIP = function (ip) {
    var that = this;
    logger.info("start remove guest of ip -> " + ip);
    for (var guest in that.guests) {
        if (that.guests[guest] && that.guests[guest].ip === ip) {
            delete that.guests[guest];
        }
    }
};

SkyRTC.prototype.getBasicData = function (tableNumber) {
    var that = this;
    var data = {};
    var desTable = that.table[tableNumber];
    if (desTable) {
        data = flyChess.getBasicData(desTable);
    }

    return data;
};

SkyRTC.prototype.updateTable = function (tableNumber, tablePlayers, status) {
    var players = [];
    var playerLength;
    if (tablePlayers) {
        playerLength = tablePlayers.length;
    } else {
        playerLength = 0;
    }
    // only update game before game started
    for (var i = 0; i < playerLength; i++) {
        var player = {
            playerName: tablePlayers[i].playerName,
            isOnline: tablePlayers[i].isOnline
        };
        players.push(player);
    }
    var newTable = {
        tableNumber: tableNumber,
        players: players,
        status: status
    };
    tableLogic.updateTableWorkUnit(tableNumber, newTable, function (updateTableErr) {
    });
};

SkyRTC.prototype.sendMessage = function (socket, message) {
    var that = this;
    var errorFunc = function (error) {
        if (error) {
            if (socket) {
                that.exitHandle(socket);
                logger.error('player:' + socket.id + ' socket error, msg: ' + error);
            } else
                logger.error('socket error, msg: ' + error);
        }
    };

    try {
        if (socket)
            socket.send(JSON.stringify(message), errorFunc);
    } catch (e) {
        var player = socket ? socket.id : '';
        logger.error('player:' + player + ' socket error, msg:' + e.message);
    }
};

SkyRTC.prototype.notifyJoin = function (tableNumber) {
    var that = this;
    var tablePlayers = [];
    var tableDatas;
    var tableAndPlayer = [];


    logger.info('notify join, tableNumber = ' + tableNumber);
    for (var playerName in that.players) {
        if (that.players[playerName] && that.players[playerName].tableNumber === tableNumber) {
            tablePlayers.push({"playerName": playerName, "isOnline": true});
            tableAndPlayer.push(playerName);
        } else if (that.exitPlayers[playerName] === tableNumber) {
            tablePlayers.push({"playerName": playerName, "isOnline": false});
        }
    }

    if (that.table[tableNumber] && that.table[tableNumber].status === enums.GAME_STATUS_RUNNING) {
        tableDatas = flyChess.getBasicData(that.table[tableNumber]);
        tableDatas.table.currentPlayer =
            that.table[tableNumber].players[that.table[tableNumber].currentPlayer].playerName;
    }

    var message;

    // TODO: to make clear how the Live and Player UI would be affected by aliens join and left
    for (var guest in that.guests) {
        if (that.guests[guest].tableNumber === tableNumber) {
            message = {
                'eventName': '__new_peer',
                'data': {
                    'tableNumber': tableNumber,
                    'players': tablePlayers,
                    'basicData': tableDatas
                }
            };
            if (that.table[tableNumber])
                message.data.tableStatus = that.table[tableNumber].status;
            else
                message.data.tableStatus = enums.GAME_STATUS_STANDBY;
            that.sendMessage(that.guests[guest], message);
        }
    }

    for (var player in that.players) {
        if (that.players[player] && that.players[player].tableNumber === tableNumber) {

            message = {
                'eventName': '__new_peer',
                'data': {
                    'tableNumber': tableNumber,
                    'players': tablePlayers,
                    'basicData': tableDatas
                }
            };
            if (that.table[tableNumber])
                message.data.tableStatus = that.table[tableNumber].status;
            else
                message.data.tableStatus = enums.GAME_STATUS_STANDBY;
            that.sendMessage(that.players[player], message);

        }
    }
    return tablePlayers;
};

SkyRTC.prototype.notifyLeft = function (tableNumber) {
    var that = this;
    var tablePlayers = [];
    var tableAndPlayer = [];

    logger.info('notify left, tableNumber = ' + tableNumber);
    for (var playerName in that.players) {
        if (that.players[playerName] && that.players[playerName].tableNumber === tableNumber) {
            tablePlayers.push({"playerName": playerName, "isOnline": true});
            tableAndPlayer.push(playerName);
        } else if (that.exitPlayers[playerName] === tableNumber) {
            tablePlayers.push({"playerName": playerName, "isOnline": false});
        }
    }

    var message;

    for (var guest in that.guests) {
        if (that.guests[guest].tableNumber === tableNumber) {
            message = {
                'eventName': '__left',
                'data': {
                    'tableNumber': tableNumber,
                    'players': tablePlayers
                }
            };
            if (that.table[tableNumber])
                message.data.tableStatus = that.table[tableNumber].status;
            else
                message.data.tableStatus = enums.GAME_STATUS_STANDBY;
            that.sendMessage(that.guests[guest], message);
        }
    }
    for (var player in that.players) {
        if (that.players[player] && that.players[player].tableNumber === tableNumber) {

            message = {
                'eventName': '__left',
                'data': {
                    'tableNumber': tableNumber,
                    'players': tablePlayers
                }
            };
            if (that.table[tableNumber])
                message.data.tableStatus = that.table[tableNumber].status;
            else
                message.data.tableStatus = enums.GAME_STATUS_STANDBY;
            that.sendMessage(that.players[player], message);
        }
    }

    that.updateTable(tableNumber, tablePlayers, enums.GAME_STATUS_STANDBY);
};

SkyRTC.prototype.prepareGame = function (tableNumber, sumFly, commandInterval, commandTimeout, lostTimeout) {
    var that = this;
    try {
        parseInt(tableNumber);
    } catch (e) {
        logger.error('table : ' + tableNumber + ' start game failed, type is not correct');
        return;
    }

    tableNumber += "";

    logger.info('game preparing start for table: ' + tableNumber);
    if (that.table[tableNumber]) {
        if (that.table[tableNumber].timeout)
            clearTimeout(that.table[tableNumber].timeout);
        that.table[tableNumber].status = enums.GAME_STATUS_STANDBY;
        delete that.table[tableNumber];
        logger.info('remove table ' + tableNumber + ' timeout');
    }


    that.table[tableNumber] = new flyChess.Table(2, 4, sumFly, commandTimeout, commandInterval, lostTimeout);
    that.table[tableNumber].tableNumber = tableNumber;
    that.initTable(tableNumber);
    logger.info('init table done');
    that.sendCountDown(tableNumber);
};

SkyRTC.prototype.sendCountDown = function (tableNumber) {
    // start count down
    var that = this;
    if (that.table[tableNumber].countDown > 0) {
        var message = {
            'eventName': '__game_prepare',
            'data': {
                'tableNumber': tableNumber,
                'countDown': that.table[tableNumber].countDown
            }
        };
        logger.info('send broadcast to guest and players with count down = ' + that.table[tableNumber].countDown);
        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
        that.table[tableNumber].countDown--;
        // continue start countdown timer
        setTimeout(function () {
            that.sendCountDown(tableNumber);
        }, 1000);
    } else {
        that.startGame(tableNumber);
    }
};

SkyRTC.prototype.startGame = function (tableNumber) {
    var that = this;
    var message;
    for (var player in that.players) {
        if (that.players[player] && that.players[player].tableNumber === tableNumber)
            that.table[tableNumber].AddPlayer(player, that.players[player].displayName);
    }

    if (that.table[tableNumber].playersToAdd.length < that.table[tableNumber].minPlayers) {
        logger.info('table ' + tableNumber + ' start fail, it need at least ' +
            that.table[tableNumber].minPlayers + ' users to attend');
        message = {
            'eventName': '__game_start',
            'data': {
                'msg': 'table ' + tableNumber + ' need at least ' +
                that.table[tableNumber].minPlayers + ' users to attend',
                'tableNumber': tableNumber,
                'error_code': 0
            }
        };
        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
    } else {
        message = {
            'eventName': '__game_start',
            'data': {
                'msg': 'table ' + tableNumber + ' started successfully',
                'tableNumber': tableNumber,
                'error_code': 1
            }
        };

        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
        that.table[tableNumber].StartGame();
        that.table[tableNumber].resetCountDown();
    }
};

SkyRTC.prototype.stopGame = function (tableNumber) {
    var that = this;
    var message;
    try {
        parseInt(tableNumber);
    } catch (e) {
        logger.error('table : ' + tableNumber + ' stop game failed, type is not correct');
        return;
    }

    logger.info('game stop for table: ' + tableNumber);
    if (that.table[tableNumber]) {
        if (that.table[tableNumber].timeout)
            clearTimeout(that.table[tableNumber].timeout);

        that.table[tableNumber].status = enums.GAME_STATUS_FINISHED;

        delete that.table[tableNumber];
        logger.info('remove table ' + tableNumber + ' timeout');
    }

    message = {
        'eventName': '__game_stop',
        'data': {'msg': 'table ' + tableNumber + ' stopped successfully', 'tableNumber': tableNumber}
    };

    that.broadcastInGuests(message);
    that.broadcastInPlayers(message);
};

SkyRTC.prototype.endGame = function (tableNumber) {
    var that = this;
    var message;
    try {
        parseInt(tableNumber);
    } catch (e) {
        logger.error('table : ' + tableNumber + ' end game failed, type is not correct');
        return;
    }

    logger.info('game end for table: ' + tableNumber);
    if (that.table[tableNumber]) {
        if (that.table[tableNumber].timeout)
            clearTimeout(that.table[tableNumber].timeout);

        that.table[tableNumber].status = enums.GAME_STATUS_FINISHED;

        delete that.table[tableNumber];
        logger.info('remove table ' + tableNumber + ' timeout');
    }

    // TODO: send game over to frontend, broadcast __game_over to Players and Lives
    message = {
        'eventName': '__game_over',
        'data': {'msg': 'table ' + tableNumber + ' ended successfully', 'tableNumber': tableNumber}
    };

    that.broadcastInGuests(message);
    that.broadcastInPlayers(message);
};


SkyRTC.prototype.initTable = function (tableNumber) {
    var that = this;

    that.table[tableNumber].eventEmitter.on('__turn', function (data) {
        var message = {
            'eventName': '__action',
            'data': data
        };
        that.addPlayerStatus(data);
        that.broadcastInGuests(message);
        that.getPlayerAction(message);
    });


    that.table[tableNumber].eventEmitter.on('__game_over', function (data) {
        var tableNumber = data.table.tableNumber;
        if (that.table[tableNumber] && that.table[tableNumber].timeout)
            clearTimeout(that.table[tableNumber].timeout);

        //delete offline player
        for (var player in that.players) {
            if (!that.players[player] && that.exitPlayers[player] === tableNumber) {
                delete that.players[player];
                delete that.exitPlayers[player];
            }
        }
        if (that.table[tableNumber] && that.table[tableNumber].status === enums.GAME_STATUS_FINISHED)
            delete that.table[tableNumber];

        setTimeout(function () {
            that.addPlayerStatus(data);
            var message = {
                'eventName': '__game_over',
                'data': data
            };
            that.broadcastInGuests(message);
            that.broadcastInPlayers(message);
        }, DEFAULT_GAME_OVER_DELAY);
    });


    that.table[tableNumber].eventEmitter.on('__show_action', function (data) {
        that.addPlayerStatus(data);
        var message = {
            'eventName': '__show_action',
            'data': data
        };

        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
    });

    that.table[tableNumber].eventEmitter.on('__dice', function (data) {
        that.addPlayerStatus(data);
        var message = {
            'eventName': '__dice',
            'data': data
        };

        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
    });
};

SkyRTC.prototype.addPlayerStatus = function (data) {
    var that = this;
    for (var i = 0; i < data.players.length; i++) {
        var playerName = data.players[i].playerName;
        if (that.players[playerName]) {
            data.players[i].isOnline = true;
        } else {
            data.players[i].isOnline = false;
        }
    }
};

SkyRTC.prototype.getPlayerAction = function (message, isSecond) {
    var that = this;
    var player = message.data.self.playerName;
    var tableNumber;
    var currentTable;
    var commandTimeout = 0;
    tableNumber = message.data.tableNumber;
    currentTable = that.table[tableNumber];
    if (!currentTable)
        return;


    if (that.players[player]) {
        that.sendMessage(that.players[player], message);
        var timestamp = new Date().getTime();
        commandTimeout = currentTable.commandTimeout;

        flyChess.logGame(tableNumber, 'server request sent, time is ' + timestamp);
        currentTable.timeout = setTimeout(function () {
            currentTable.timeout = null;
            if (currentTable.status === enums.GAME_STATUS_RUNNING) {
                flyChess.logGame(tableNumber, 'player :' + player + ', response timeout, auto FOLD');
                currentTable.isActionTime = false;
                currentTable.players[currentTable.currentPlayer].defaultAction();
            }
        }, commandTimeout * 1000); // for BETA test, set to 1 min, for official game, set to 2 sec
    } else if (!isSecond) {
        currentTable.timeout = setTimeout(function () {
            currentTable.timeout = null;
            if (currentTable.status === enums.GAME_STATUS_RUNNING) {
                that.getPlayerAction(message, true);
                flyChess.logGame(tableNumber, 'player :' + player + ', might be lost');
            }
        }, currentTable.lostTimeout * 1000); // for BETA test, set to 10s
    } else {
        // bug fix - crash after players quit
        if (currentTable && currentTable.status === enums.GAME_STATUS_RUNNING) {
            flyChess.logGame(tableNumber, 'player: ' + player + ', quited, auto FOLD');
            currentTable.isActionTime = false;
            currentTable.players[currentTable.currentPlayer].defaultAction();
        }
    }
};

SkyRTC.prototype.removeSocket = function (socket) {
    var id = socket.MD5Id;
    var that = this;


    // broadcast player left
    if (that.players[id] || that.players[id] === null) {
        if (that.players[id]) {
            delete that.players[id];
        }
        that.notifyLeft(socket.tableNumber);
    } else if (socket.isGuest) {
        delete that.guests[socket.id];
    }

};


SkyRTC.prototype.broadcastInGuests = function (message) {
    var that = this;
    var tableNumber = message.data.tableNumber || message.data.table.tableNumber;
    for (var guest in that.guests) {
        if (that.guests[guest].tableNumber === tableNumber) {
            that.sendMessage(that.guests[guest], message);
        }
    }
};


SkyRTC.prototype.broadcastInPlayers = function (message) {
    var that = this;
    var tableNumber = message.data.table.tableNumber;
    for (var player in this.players) {
        if (this.players[player] && this.players[player].tableNumber === tableNumber) {
            that.sendMessage(this.players[player], message);

        }
    }
};

SkyRTC.prototype.exitHandle = function (socket) {
    var that = this;
    if (socket && !socket.isReplace) {
        var tableNumber = socket.tableNumber;
        if (that.players[socket.MD5Id] && tableNumber && that.table[tableNumber] &&
            that.table[tableNumber].status === enums.GAME_STATUS_RUNNING) {
            that.exitPlayers[socket.MD5Id] = socket.tableNumber;
            that.players[socket.MD5Id] = null;
            flyChess.logGame(tableNumber, 'player: ' + socket.id + ', exit!!');
        }
        that.removeSocket(socket);
    }
};

SkyRTC.prototype.socketJoin = function (socket) {
    var that = this;
    socket.id = UUID.v4();

    socket.on('message', function (data) {
            try {
                var json = JSON.parse(data);
                if (json.eventName) {
                    that.emit(json.eventName, json.data, socket);
                } else {
                    that.emit('socket_message', socket, data);
                }
            } catch (e) {
                logger.error(e.message);
            }
        }
    );

    socket.on('error', function (err) {
        logger.error('socket ' + socket.id + ' error, msg:' + err);
        that.exitHandle(socket);
    });

    socket.on('close', function () {
        logger.info('player ' + socket.id + ' exit');
        that.exitHandle(socket);
    });
};

/**
 * Public functions
 */
function getPlayerIndex(playerName, players) {
    for (var i in players) {
        var player = players[i];
        if (player.playerName === playerName) {
            return i;
        }
    }
    return -1;
}

exports.SkyRTC = SkyRTC;
