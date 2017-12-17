/**
 * Created by dummy team
 * 2017-07-22
 */

var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var flyChess = require('./game.js');
var playerLogic = require('../../work_units/player_logic.js');
var boardLogic = require('../../work_units/board_logic.js');


var DEFAULT_GAME_OVER_DELAY = 1000;


var logger = require('../../poem/logging/logger4js').helper;

var Enums = require('../../constants/enums.js');
var ErrorCode = require('../../constants/error_code.js');

var enums = new Enums();
var errorCode = new ErrorCode();


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
    this.gameName = enums.GAME_FLY_CHESS;
    var token = data.token;


    this.on('__join', function (data, socket) {
        var that = this;
        var phoneNumber = data.phoneNumber;
        var password = data.password;
        var table = data.ticket;
        var token = data.token;

        logger.info('on __join, phoneNumber = ' + phoneNumber + ', ticket = ' + table);
        if (phoneNumber && password) {

        } else if (table) {
            socket.tableNumber = table;
        } else {
            logger.info('user is invalid, close its socket');
            socket.close();
            return;
        }

        socket.token = token;
        if (phoneNumber && password) {
            playerLogic.getPlayerWorkUnit(phoneNumber, password, function (getPlayerErr, players) {
                if (errorCode.SUCCESS.code === getPlayerErr.code) {
                    boardLogic.getBoardByTicketWorkUnit(table, that.gameName, function (getBoardErr, boards) {
                        if (errorCode.SUCCESS.code === getBoardErr.code) {
                            var tableNumber = table;
                            var board = boards[0];
                            if (!that.tableNumber || tableNumber === that.tableNumber) {
                                var playerName = players[0].name;
                                if (that.players[playerName]) {
                                    that.players[playerName].isReplace = true;
                                    that.players[playerName].close();
                                }
                                var exitPlayerTableNum = that.exitPlayers[playerName];
                                if (exitPlayerTableNum !== undefined) {
                                    socket.tableNumber = exitPlayerTableNum;
                                    delete that.exitPlayers[playerName];
                                    logger.info('player rejoin, accept join');
                                } else if (that.players[playerName]) {
                                    socket.tableNumber = tableNumber;
                                    logger.info('exist player replace, accept join');
                                } else if (!(that.table[tableNumber] &&
                                        that.table[tableNumber].status === enums.GAME_STATUS_RUNNING)) {
                                    socket.tableNumber = tableNumber;
                                    logger.info('game not started, accept join');
                                }
                                if (socket.tableNumber) {
                                    logger.info('player : ' + playerName + ' join!!');
                                    socket.id = playerName;
                                    socket.displayName = playerName;
                                    that.players[socket.id] = socket;
                                    var tablePlayers = that.notifyJoin(socket.tableNumber, board.maxPlayer);
                                    if (tablePlayers.length <= board.maxPlayer) {
                                        that.initPlayerData(socket.id);
                                        // update game
                                        that.updateBoard(socket.tableNumber, tablePlayers, enums.GAME_STATUS_STANDBY);
                                    } else {
                                        socket.close();
                                        logger.info('player : ' + playerName + ' can not join because no empty place');
                                    }
                                } else {
                                    socket.close();
                                    logger.info('player : ' + playerName + ' can not join because game has started');
                                }

                            } else {
                                logger.info('ticket : ' + table + ' is wrong');
                            }

                        } else {
                            logger.info('ticket ' + table + ' not exist');
                            socket.close();
                        }
                    });
                } else {
                    logger.info('phoneNumber ' + phoneNumber + ' is not valid, connection should be dropped');
                    socket.close();
                }
            });
        } else {
            socket.isGuest = true;
            that.guests[socket.id] = socket;
            that.initGuestData(socket.id);
            // updated by strawmanbobi - the Live UI need this command to show joined players
            that.notifyJoin(socket.tableNumber);
        }
    });

    this.on('__prepare_game', function (data, socket) {
        this.prepareGame(data.tableNumber, socket.token);
    });

    this.on('__start_game', function (data) {
        // TODO: do something with this command
    });

    this.on('__stop_game', function (data, socket) {
        this.stopGame(data.tableNumber, socket.token);
    });

    this.on('__end_game', function (data, socket) {
        this.endGame(data.tableNumber, socket.token);
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

SkyRTC.prototype.updateBoard = function (ticket, tablePlayers, status) {
    var that = this;
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
    var newBoard = {
        ticket: ticket,
        currentPlayer: players,
        status: status,
        updateTime:new Date().getTime(),
        type: 0
    };
    boardLogic.updateBoardWorkUnit(ticket, that.gameName, newBoard, function (updateBoardErr, board) {
        if (errorCode.SUCCESS.code === updateBoardErr.code) {
            logger.info("update board success");
        }
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

SkyRTC.prototype.notifyJoin = function (tableNumber, maxPlayer) {
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

    if (tablePlayers.length > maxPlayer) {
        return tablePlayers;
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

    that.updateBoard(tableNumber, tablePlayers, enums.GAME_STATUS_STANDBY);
};

SkyRTC.prototype.prepareGame = function (tableNumber, token) {
    var that = this;
    if (that.table[tableNumber] && that.table[tableNumber].countDown !== 3) {
        return;
    }

    boardLogic.getBoardByTicketWorkUnit(tableNumber, that.gameName, function (getBoardErr, boards) {
        if (errorCode.SUCCESS.code === getBoardErr.code) {
            var board = boards[0];
            playerLogic.getPhoneNumberByTokenWorkUnit(token, function (getValueErr, phoneNumber) {
                if (board.creator !== phoneNumber) {
                    logger.info('socket is not the creator, reject start game command');
                    return;
                }

                logger.info('game preparing start for table: ' + tableNumber);
                if (that.table[tableNumber]) {
                    if (that.table[tableNumber].timeout)
                        clearTimeout(that.table[tableNumber].timeout);
                    that.table[tableNumber].status = enums.GAME_STATUS_STANDBY;
                    delete that.table[tableNumber];
                    logger.info('remove table ' + tableNumber + ' timeout');
                }

                var minPlayer = 2;
                var maxPlayer = 4;
                var sumFly = 4;
                var commandTimeout = 1;
                var commandInterval = 2;
                var lostTimeout = 5;

                if (board.minPlayer && board.minPlayer >= 2) {
                    minPlayer = parseInt(board.minPlayer);
                }

                if (board.maxPlayer && board.maxPlayer >= 2 && board.maxPlayer <= 4) {
                    maxPlayer = parseInt(board.maxPlayer);
                }

                if (board.sumFly && board.sumFly >= 0) {
                    sumFly = parseInt(board.sumFly);
                }

                if (board.commandInterval && board.commandInterval >= 0) {
                    commandInterval = parseInt(board.commandInterval);
                }

                if (board.commandTimeout && board.commandTimeout >= 0) {
                    commandTimeout = parseFloat(board.commandTimeout);
                }

                if (board.lostTimeout && board.lostTimeout >= 0) {
                    lostTimeout = parseInt(board.lostTimeout);
                }

                that.table[tableNumber] = new flyChess.Table(minPlayer, maxPlayer, sumFly, commandTimeout, commandInterval, lostTimeout);
                that.table[tableNumber].tableNumber = tableNumber;
                that.initTable(tableNumber);
                logger.info('init table done');
                that.sendCountDown(tableNumber);
            });

        } else {
            logger.error('table : ' + tableNumber + ' start game failed, the ticket not valid');
        }
    });

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

    if (that.table[tableNumber].playersToAdd.length < that.table[tableNumber].minPlayer) {
        logger.info('table ' + tableNumber + ' start fail, it need at least ' +
            that.table[tableNumber].minPlayer + ' users to attend');
        message = {
            'eventName': '__game_start',
            'data': {
                'msg': 'table ' + tableNumber + ' need at least ' +
                that.table[tableNumber].minPlayer + ' users to attend',
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
        that.updateBoard(tableNumber, that.getTablePlayer(tableNumber), enums.GAME_STATUS_RUNNING);
    }
};

SkyRTC.prototype.getTablePlayer = function (tableNumber) {
    var players = [];
    var that = this;
    for (var i = 0; i < that.table[tableNumber].players.length; i++) {
        var player = {};
        var playerName = that.table[tableNumber].players[i].playerName;
        player.playerName = playerName;
        player.isOnline = that.players[playerName] ? true : false;
        players.push(player);
    }
    return players;
};

SkyRTC.prototype.stopGame = function (tableNumber, token) {
    var that = this;
    var message;
    if (that.table[tableNumber] && that.table[tableNumber].countDown !== 3) {
        return;
    }

    boardLogic.getBoardByTicketWorkUnit(tableNumber, that.gameName, function (getBoardErr, boards) {
        if (errorCode.SUCCESS.code === getBoardErr.code) {
            var board = boards[0];
            playerLogic.getPhoneNumberByTokenWorkUnit(token, function (getValueErr, phoneNumber) {
                if (board.creator !== phoneNumber) {
                    logger.info('socket is not the creator, reject stop game command');
                    return;
                }

                logger.info('game stop for table: ' + tableNumber);
                if (that.table[tableNumber]) {
                    if (that.table[tableNumber].timeout)
                        clearTimeout(that.table[tableNumber].timeout);

                    that.table[tableNumber].status = enums.GAME_STATUS_FINISHED;
                    that.updateBoard(tableNumber, that.getTablePlayer(tableNumber), enums.GAME_STATUS_FINISHED);

                    delete that.table[tableNumber];
                    logger.info('remove table ' + tableNumber + ' timeout');

                }

                message = {
                    'eventName': '__game_stop',
                    'data': {'msg': 'table ' + tableNumber + ' stopped successfully', 'tableNumber': tableNumber}
                };

                that.broadcastInGuests(message);
                that.broadcastInPlayers(message);
            });

        }
    });
};

SkyRTC.prototype.endGame = function (tableNumber, token) {
    var that = this;
    var message;
    if (that.table[tableNumber] && that.table[tableNumber].countDown !== 3) {
        return;
    }

    boardLogic.getBoardByTicketWorkUnit(tableNumber, that.gameName, function (getBoardErr, boards) {
        if (errorCode.SUCCESS.code === getBoardErr.code) {
            var board = boards[0];
            playerLogic.getPhoneNumberByTokenWorkUnit(token, function (getValueErr, phoneNumber) {
                if (board.creator !== phoneNumber) {
                    logger.info('socket is not the creator, reject end game command');
                    return;
                }

                logger.info('game end for table: ' + tableNumber);
                if (that.table[tableNumber]) {
                    if (that.table[tableNumber].timeout)
                        clearTimeout(that.table[tableNumber].timeout);

                    that.table[tableNumber].status = enums.GAME_STATUS_FINISHED;
                    that.updateBoard(tableNumber, that.getTablePlayer(tableNumber), enums.GAME_STATUS_ENDED);
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
            });

        }
    });
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


        if (that.table[tableNumber] && that.table[tableNumber].status === enums.GAME_STATUS_FINISHED) {
            that.updateBoard(tableNumber, that.getTablePlayer(tableNumber), enums.GAME_STATUS_FINISHED);
            delete that.table[tableNumber];
        }

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
                flyChess.logGame(tableNumber, 'player :' + player + ', response timeout, execute default action');
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
            flyChess.logGame(tableNumber, 'player: ' + player + ', quited, execute default action');
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
