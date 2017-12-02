/**
 * Created by dummy team
 * 2017-07-22
 */


const WebSocket = require('ws');
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var poker = require('./game.js');
var playerLogic = require('../../work_units/player_logic.js');

var DEFAULT_GAME_OVER_DELAY = 1000;
var IP_CONSTRAINT = false;

var logger = require('../../poem/logging/logger4js').helper;

var Enums = require('../../constants/enums.js');
var ErrorCode = require('../../constants/error_code.js');

var enums = new Enums();
var errorCode = new ErrorCode();



var errorCb = function (rtc) {
    return function (error) {
        if (error) {
            logger.error('server internal error occurred: ' + error);
            // rtc.emit('error', error);
        }
    };
};

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
    this.ipArray = {};
    this.gameName = enums.GAME_TEXASHOLDEM;
    // this.playerAndTable = {};

    var skyRTC = this;

    this.on('__join', function (data, socket) {
        var that = this;
        var phoneNumber = data.phoneNumber;
        var password = data.password;
        var table = data.ticket;
        var isHuman = data.isHuman || false;

        logger.info('on __join, playerName = ' + playerName + ', table = ' + table);
        if (phoneNumber) {
            socket.isHuman = isHuman;
        } else if (table) {
            socket.tableNumber = table;
        } else {
            logger.info('player is invalid, close its socket');
            socket.close();
            return;
        }

        if (phoneNumber) {
            playerLogic.getUserWorkUnit({
                phoneNumber: phoneNumber,
                password: password
            }, function (getPlayerErr, player) {
                if (errorCode.SUCCESS.code === getPlayerErr.code) {
                    playerLogic.getBoardWorkUnit({
                        gameName: that.gameName,
                        ticket: table
                    }, function (getBoardErr, board) {
                        if (errorCode.SUCCESS.code === getBoardErr.code) {
                            var tableNumber = table;
                            if (!that.tableNumber || tableNumber === that.tableNumber) {
                                var playerName = player.playerName;
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
                                    var tablePlayers = that.notifyJoin(socket.tableNumber, board.maxPlayers);
                                    if (tablePlayers.length <= board.maxPlayers) {
                                        that.initPlayerData(socket.id);
                                        if (true === IP_CONSTRAINT) {
                                            if (socket.ip && !that.ipArray[socket.ip]) {
                                                that.ipArray[socket.ip] = true;
                                                that.removeAllGuestByIP(socket.ip);
                                            }
                                        }
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
        } else if ((true === IP_CONSTRAINT && !that.ipArray[socket.ip]) || false === IP_CONSTRAINT) {
            socket.isGuest = true;
            that.guests[socket.id] = socket;
            that.initGuestData(socket.id);
            // updated by strawmanbobi - the Live UI need this command to show joined players
            that.notifyJoin(socket.tableNumber);
        } else {
            socket.close();
            logger.info(" ip -> " + socket.ip + " already has player join, so reject guest join");
        }
    });

    this.on('__prepare_game', function (data) {
        this.prepareGame(data.ticket);
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

    this.on('__reload', function (data, socket) {
        var that = this;
        var playerName = socket.id;
        var tableNum = that.players[playerName].tableNumber;
        var currentTable = that.table[tableNum];
        poker.logGame(tableNum, 'player: ' + socket.id + ', reload');
        if (currentTable && currentTable.isReloadTime && that.players[playerName]) {
            var playerIndex = parseInt(getPlayerIndex(playerName, currentTable.players));
            if (playerIndex !== -1) {
                var player = currentTable.players[playerIndex];
                if (player.reloadCount < currentTable.maxReloadCount) {
                    player.chips += currentTable.initChips;
                    player.reloadCount++;
                    poker.logGame(tableNum, 'player: ' + playerName + ', reload success');
                } else {
                    poker.logGame(tableNum, 'player: ' + playerName + ',  had used all reload chance');
                }
            }
        }
    });

    this.on('__action', function (data, socket) {
        var timestamp = new Date().getTime();
        try {
            var that = this;
            var action = data.action;
            var playerName = socket.id;
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
                                case 'bet':
                                    var amount;
                                    try {
                                        amount = parseInt(data.amount);
                                    } catch (e) {
                                        logger.error(e.message);
                                    }
                                    if (!amount)
                                        amount = currentTable.bigBlind;
                                    currentTable.players[playerIndex].Bet(amount);
                                    break;
                                case 'call':
                                    if (currentTable.isBet)
                                        currentTable.players[playerIndex].Bet(currentTable.bigBlind);
                                    else
                                        currentTable.players[playerIndex].Call();
                                    break;
                                case 'check':
                                    currentTable.players[playerIndex].Check();
                                    break;
                                case 'raise':
                                    if (currentTable.isBet)
                                        currentTable.players[playerIndex].Bet(currentTable.bigBlind);
                                    else
                                        currentTable.players[playerIndex].Raise();
                                    break;
                                case 'allin':
                                    if (currentTable.isBet)
                                        currentTable.isBet = false;
                                    currentTable.players[playerIndex].AllIn();
                                    break;
                                case 'fold':
                                    currentTable.players[playerIndex].Fold();
                                    break;
                                default:
                                    currentTable.players[playerIndex].Fold();
                                    break;
                            }
                        } catch (e) {
                            logger.error(e.message);
                            currentTable.players[playerIndex].Fold();
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
                'eventName': '_join',
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
        data = poker.getBasicData(desTable);
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
        players: players,
        status: status
    };
    playerLogic.updateBoardWorkUnit({gameName: that.gameName, board: newBoard}, function (updateBoardErr, board) {
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

SkyRTC.prototype.notifyJoin = function (tableNumber, maxPlayers) {
    var that = this;
    var tablePlayers = [];
    var tableDatas;
    var cards = {};
    var tableAndPlayer = [];
    var playerData = {};
    var onlinePlayers = [];

    logger.info('notify join, tableNumber = ' + tableNumber);
    for (var playerName in that.players) {
        if (that.players[playerName] && that.players[playerName].tableNumber === tableNumber) {
            tablePlayers.push({"playerName": playerName, "isOnline": true});
            tableAndPlayer.push(playerName);
            onlinePlayers.push(playerName);
        } else if (that.exitPlayers[playerName] === tableNumber) {
            tablePlayers.push({"playerName": playerName, "isOnline": false});
        }
    }

    if (tablePlayers.length > maxPlayers) {
        return tablePlayers;
    }

    if (that.table[tableNumber] && that.table[tableNumber].status === enums.GAME_STATUS_RUNNING) {
        tableDatas = poker.getBasicData(that.table[tableNumber]);
        tableDatas.table.currentPlayer =
            that.table[tableNumber].players[that.table[tableNumber].currentPlayer].playerName;
    }

    var message;

    // TODO: to make clear how the Live and Player UI would be affected by aliens join and left
    for (var guest in that.guests) {
        if (that.guests[guest].tableNumber === tableNumber) {
            message = {
                'eventName': '__new_peer_2',
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

    if (tableDatas) {
        for (var i = 0; i < tableDatas.players.length; i++) {
            cards[tableDatas.players[i].playerName] = tableDatas.players[i].cards;
            delete tableDatas.players[i].cards;
            playerData[tableDatas.players[i].playerName] = tableDatas.players[i];
        }
    }

    for (var player in that.players) {
        if (that.players[player] && that.players[player].tableNumber === tableNumber) {
            message = {
                'eventName': '__new_peer',
                'data': tableAndPlayer
            };
            that.sendMessage(that.players[player], message);
            // for backward compatibility, send another command to Live and Player UI
            // TODO: hide players' private cards from this message
            if (playerData[player])
                playerData[player].cards = cards[player];//add cards

            message = {
                'eventName': '__new_peer_2',
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

            if (playerData[player])
                playerData[player].cards = [];//remove cards
        }
    }
    return onlinePlayers;
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
                'eventName': '__left_2',
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
                'data': tableAndPlayer
            };
            that.sendMessage(that.players[player], message);
            // for backward compatibility, send another command to Live and Player UI
            // TODO: hide players' private cards from this message

            message = {
                'eventName': '__left_2',
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

SkyRTC.prototype.prepareGame = function (ticket) {
    var that = this;

    playerLogic.getBoardWorkUnit({gameName: that.gameName, ticket: ticket}, function (getBoardErr, board) {
        if (errorCode.SUCCESS.code === getBoardErr.code) {
            var tableNumber = ticket;
            logger.info('game preparing start for table: ' + tableNumber);
            if (that.table[tableNumber]) {
                if (that.table[tableNumber].timeout)
                    clearTimeout(that.table[tableNumber].timeout);
                that.table[tableNumber].status = enums.GAME_STATUS_STANDBY;
                delete that.table[tableNumber];
                logger.info('remove table ' + tableNumber + ' timeout');
            }

            // initialize game parameters
            var sb = 10;
            var bb = 20;
            var initChips = 1000;
            var rc = 2;
            var ci = 1;
            var ri = 15;
            var ct = 5; // schedule to 5 seconds
            var lt = 10;

            if (undefined !== board.defaultSb && null !== board.defaultSb && board.defaultSb >= 10) {
                sb = parseInt(board.defaultSb);
                bb = parseInt(sb * 2);
            }

            if (undefined !== board.defaultChips && null !== board.defaultChips && board.defaultChips >= 1000) {
                initChips = parseInt(board.defaultChips);
            }

            if (undefined !== board.reloadChance && null !== board.reloadChance && board.reloadChance >= 0) {
                rc = parseInt(board.reloadChance);
            }

            if (undefined !== board.commandInterval && null !== board.commandInterval && board.commandInterval >= 0) {
                ci = parseInt(board.commandInterval);
            }

            if (undefined !== board.roundInterval && null !== board.roundInterval && board.roundInterval >= 0) {
                ri = parseInt(board.roundInterval);
            }

            if (undefined !== board.commandTimeout && null !== board.commandTimeout && board.commandTimeout >= 0) {
                ct = parseFloat(board.commandTimeout);
            }

            if (undefined !== board.lostTimeout && null !== board.lostTimeout && board.lostTimeout >= 0) {
                lt = parseInt(board.lostTimeout);
            }

            that.table[tableNumber] = new poker.Table(sb, bb, 3, 10, initChips, rc, 100, ci, ri, ct, lt);
            that.table[tableNumber].tableNumber = tableNumber;
            that.initTable(tableNumber);
            logger.info('init table done');
            that.sendCountDown(tableNumber);
        } else {
            logger.error('table : ' + ticket + ' start game failed, the ticket not valid');
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
        if (that.players[player] && that.players[player].tableNumber === tableNumber) {
            that.table[tableNumber].AddPlayer(player, that.players[player].displayName);
        }
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
        that.addPlayerStatus(data.game);
        that.broadcastInGuests(message);
        that.broadcastInHumanPlayers(message);
        that.getPlayerAction(message);
    });

    that.table[tableNumber].eventEmitter.on('__bet', function (data) {
        var message = {
            'eventName': '__bet',
            'data': data
        };
        that.addPlayerStatus(data.game);
        that.broadcastInGuests(message);
        that.broadcastInHumanPlayers(message);
        that.getPlayerAction(message);
    });

    that.table[tableNumber].eventEmitter.on('__deal', function (data) {
        that.addPlayerStatus(data);
        var message = {
            'eventName': '__deal',
            'data': data
        };
        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
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

    that.table[tableNumber].eventEmitter.on('__new_round', function (data) {
        that.addPlayerStatus(data);
        var message = {
            'eventName': '__new_round',
            'data': data
        };
        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
    });

    that.table[tableNumber].eventEmitter.on('__start_reload', function (data) {
        var message = {
            'eventName': '__start_reload',
            'data': data
        };
        that.broadcastInPlayersForReload(message);
    });

    that.table[tableNumber].eventEmitter.on('__round_end', function (data) {
        setTimeout(function () {
            that.addPlayerStatus(data);
            var message = {
                'eventName': '__round_end',
                'data': data
            };
            that.broadcastInPlayers(message);
            that.broadcastInGuests(message);
        }, 1000);
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
};

SkyRTC.prototype.addPlayerStatus = function (data) {
    var that = this;
    for (var i = 0; i < data.players.length; i++) {
        var playerName = data.players[i].playerName;
        if (that.players[playerName]) {
            data.players[i].isOnline = true;
            data.players[i].isHuman = that.players[playerName].isHuman;
        } else {
            data.players[i].isOnline = false;
            data.players[i].isHuman = false;
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

    for (var i = 0; i < message.data.game.players.length; i++) {
        if (message.data.game.players[i].playerName !== message.data.self.playerName)
            delete message.data.game.players[i].cards;
    }

    if (that.players[player]) {
        that.sendMessage(that.players[player], message);
        var timestamp = new Date().getTime();
        if (that.players[player] && that.players[player].isHuman) {
            commandTimeout = 60;
        } else {
            commandTimeout = currentTable.commandTimeout;
        }
        poker.logGame(tableNumber, 'server request sent, time is ' + timestamp);
        currentTable.timeout = setTimeout(function () {
            currentTable.timeout = null;
            if (currentTable.status === enums.GAME_STATUS_RUNNING) {
                poker.logGame(tableNumber, 'player :' + player + ', response timeout, auto FOLD');
                currentTable.isActionTime = false;
                currentTable.players[currentTable.currentPlayer].Fold();
            }
        }, commandTimeout * 1000); // for BETA test, set to 1 min, for official game, set to 2 sec
    } else if (!isSecond) {
        currentTable.timeout = setTimeout(function () {
            currentTable.timeout = null;
            if (currentTable.status === enums.GAME_STATUS_RUNNING) {
                that.getPlayerAction(message, true);
                poker.logGame(tableNumber, 'player :' + player + ', might be lost');
            }
        }, currentTable.lostTimeout * 1000); // for BETA test, set to 10s
    } else {
        // bug fix - crash after players quit
        if (currentTable && currentTable.status === enums.GAME_STATUS_RUNNING) {
            poker.logGame(tableNumber, 'player: ' + player + ', quited, auto FOLD');
            currentTable.isActionTime = false;
            currentTable.players[currentTable.currentPlayer].Fold();
        }
    }
};

SkyRTC.prototype.removeSocket = function (socket) {
    var id = socket.id;
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

SkyRTC.prototype.broadcastInPlayersForReload = function (message) {
    var tableNumber = message.data.tableNumber;
    var that = this;
    for (var player in this.players) {
        if (this.players[player] && this.players[player].tableNumber === tableNumber) {
            that.sendMessage(this.players[player], message);
        }
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

SkyRTC.prototype.broadcastInHumanPlayers = function (message) {
    var cards = {};
    var playersData = {};
    var that = this;
    for (var i = 0; i < message.data.game.players.length; i++) {
        var player = message.data.game.players[i];
        cards[player.playerName] = player.cards;
        playersData[player.playerName] = player;
        delete player.cards;
    }
    var tableNumber = message.data.tableNumber;
    for (var player in that.players) {
        if (that.players[player] && that.players[player].isHuman && that.players[player].tableNumber === tableNumber && playersData[player]) {
            playersData[player].cards = cards[player];
            that.sendMessage(that.players[player], message);
            playersData[player].cards = [];
        }
    }
    message.data.self.cards = cards[message.data.self.playerName];//recover for getPlayerAction
};

SkyRTC.prototype.broadcastInPlayers = function (message) {
    var that = this;
    if (!message.data.players && !message.data.table) {
        var tableNumber = message.data.tableNumber;
        for (var player in this.players) {
            if (this.players[player] && this.players[player].tableNumber === tableNumber) {
                that.sendMessage(this.players[player], message);
            }
        }
    } else {
        var cards = {};
        var playersData = {};
        for (var i = 0; i < message.data.players.length; i++) {
            cards[message.data.players[i].playerName] = message.data.players[i].cards;
            playersData[message.data.players[i].playerName] = message.data.players[i];
            if (message.eventName !== '__game_over' && message.eventName !== '__round_end')
                delete message.data.players[i].cards;
        }
        var tableNumber = message.data.table.tableNumber;
        for (var player in this.players) {
            if (this.players[player] && this.players[player].tableNumber === tableNumber && playersData[player]) {
                if (message.eventName !== '__game_over' && message.eventName !== '__round_end') {
                    playersData[player].cards = cards[player];
                    that.sendMessage(this.players[player], message);
                    playersData[player].cards = [];
                } else {
                    that.sendMessage(this.players[player], message);
                }
            }
        }
    }
};

SkyRTC.prototype.exitHandle = function (socket) {
    var that = this;
    if (socket && !socket.isReplace) {
        var tableNumber = socket.tableNumber;
        if (that.players[socket.id] && tableNumber && that.table[tableNumber] &&
            that.table[tableNumber].status === enums.GAME_STATUS_RUNNING) {
            that.exitPlayers[socket.id] = socket.tableNumber;
            that.players[socket.id] = null;
            poker.logGame(tableNumber, 'player: ' + socket.id + ', exit!!');
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