/**
 * Created by the-engine team
 * 2017-07-22
 */

var WebSocketServer = require('ws').Server;
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var poker = require('./node_poker');
var playerDao = require('../models/player_dao');

var logger = require('../poem/logging/logger4js').helper;

var Enums = require('../constants/enums.js');
var ErrorCode = require('../constants/error_code.js');

var enums = new Enums();
var errorCode = new ErrorCode();

var errorCb = function (rtc) {
    return function (error) {
        if (error) {
            logger.error('server internal error occurred: ' + error);
            rtc.emit('error', error);
        }
    };
};

function SkyRTC() {
    this.table = {};
    this.admin = null;
    this.players = {};
    this.guests = {};
    this.exitPlayers = {};
    this.playerNumber = 0;
    this.playerAndTable = {};
    this.on('__join', function (data, socket) {
        var that = this;
        var playerName = data.playerName;
        var table = data.table;
        logger.info('on __join, playerName = ' + playerName + ', table=' + table);
        if (that.playerAndTable[playerName]) {
            socket.id = playerName;
        } else if (table) {
            socket.tableNumber = table;
        } else
            return;

        var tableNumber = that.playerAndTable[socket.id];
        if (tableNumber != undefined) {
            if (that.players[socket.id]) {
                logger.warn('player: ' + socket.id + ' already exist, reject');
                return;
            }
            that.playerNumber++;
            var exitPlayerTableNum = that.exitPlayers[socket.id];
            if (exitPlayerTableNum != undefined) {
                socket.tableNumber = exitPlayerTableNum;
                delete that.exitPlayers[socket.id];
            } else if (!(that.table[tableNumber] && that.table[tableNumber].isStart)) {
                socket.tableNumber = that.playerAndTable[socket.id];
            }

            if (socket.tableNumber) {
                logger.info('player : ' + data.playerName + ' join!!');
                that.players[socket.id] = socket;
                this.emit('new_peer', socket.id);
                that.notifyGuestAndPlayer();
                that.initPlayerData(socket.id);
            } else
                logger.info("player : " + data.playerName + " can't join because game has start");
        } else {
            logger.info('guest join!!');
            that.guests[socket.id] = socket;
            that.notifyGuestAndPlayer();
            that.initGuestData(socket.id);
        }
    });

    this.on('__start_game', function (data) {
        this.startGame(data.tableNumber);
    });

    this.on('__reload', function (data, socket) {
        logger.info('player: ' + socket.id + ', reload');
        var that = this;
        var playerName = socket.id;
        var tableNum = that.players[playerName].tableNumber;
        var currentTable = that.table[tableNum];
        if (currentTable.isReloadTime && that.players[playerName]) {
            var playerIndex = parseInt(getPlayerIndex(playerName, currentTable.players));
            if (playerIndex !== -1) {
                var player = currentTable.players[playerIndex];
                if (player.reloadCount < currentTable.maxReloadCount) {
                    player.chips += currentTable.initChips;
                    player.reloadCount++;
                    logger.info('player: ' + playerName + '  reload success');
                } else {
                    logger.info('player: ' + playerName + '  had used all reload chance');
                }
            }
        }
    });

    this.on('__action', function (data, socket) {
        var timestamp = new Date().getTime();
        logger.info('receive action,time is ' + timestamp);
        try {
            var that = this;
            var action = data.action;
            var playerName = socket.id;
            if (that.players[playerName]) {
                var tableNum = that.players[playerName].tableNumber;
                var currentTable = that.table[tableNum];
                var playerIndex = parseInt(getPlayerIndex(playerName, currentTable.players));
                if (playerIndex != -1 && currentTable.checkPlayer(playerIndex)) {
                    if (currentTable.timeout)
                        clearTimeout(currentTable.timeout);
                    try {
                        switch (action) {
                            case 'bet':
                                if (currentTable.isBet) {
                                    var amount;
                                    try {
                                        amount = parseInt(data.amount);
                                    } catch (e) {
                                        logger.error(e.message);
                                        amount = currentTable.bigBlind;
                                    }
                                    currentTable.players[playerIndex].Bet(amount);
                                } else
                                    currentTable.players[playerIndex].Call();
                                break;
                            case 'call':
                                if (currentTable.isBet)
                                    currentTable.players[playerIndex].Bet(currentTable.smallBlind);
                                else
                                    currentTable.players[playerIndex].Call();
                                break;
                            case 'check':
                                currentTable.players[playerIndex].Check();
                                break;
                            case 'raise':
                                if (currentTable.isBet)
                                    currentTable.players[playerIndex].Bet(currentTable.smallBlind);
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
        } catch (e) {
            logger.error(e.message);
        }
    });
}

util.inherits(SkyRTC, events.EventEmitter);

function getPlayerIndex(playerName, players) {
    for (var i in players) {
        var player = players[i];
        if (player.playerName === playerName) {
            return i;
        }
    }
    return -1;
}

SkyRTC.prototype.initAdminData = function () {
    logger.info('initAdminData');
    var that = this;
    if (that.admin) {
        var data = that.getBasicData(that.admin.tableNumber);
        var message = {
            'eventName': '_join',
            'data': data
        };
        that.admin.send(JSON.stringify(message), errorCb);
    }
};

SkyRTC.prototype.initGuestData = function (guest) {
    logger.info('initGuestData');
    var that = this;
    var data = that.getBasicData(that.guests[guest].tableNumber);
    var message = {
        'eventName': '_join',
        'data': data
    };
    that.guests[guest].send(JSON.stringify(message), errorCb);

};

SkyRTC.prototype.initPlayerData = function (player) {
    logger.info('initPlayerData');
    var that = this;
    var data = that.getBasicData(that.players[player].tableNumber);
    for (var i in data.players) {
        if (data.players[i].playerName !== that.players[player].id)
            delete data.players[i].cards;
    }
    var message = {
        'eventName': '_join',
        'data': data
    };
    that.players[player].send(JSON.stringify(message), errorCb);
};

SkyRTC.prototype.getBasicData = function (tableNumber) {
    var that = this;
    var players = [];
    var table = {};
    var data = {};
    var desTable = that.table[tableNumber];
    if (desTable) {
        /*
         for (var i = 0; i < desTable.players.length; i++) {
         var player = {};
         player['playerName'] = desTable.players[i]['playerName'];
         player['chips'] = desTable.players[i]['chips'];
         player['folded'] = desTable.players[i]['folded'];
         player['allIn'] = desTable.players[i]['allIn'];
         player['cards'] = desTable.players[i]['cards'];
         player['reloadCount'] = desTable.players[i]['reloadCount'];
         players.push(player);
         }
         table['tableNumber'] = desTable.tableNumber;
         table['roundName'] = desTable.roundName;
         table['board'] = desTable.game.board;
         data.players = players;
         data.table = table;
         */
        data = poker.getBasicData(desTable);
    }

    return data;
};

SkyRTC.prototype.notifyGuestAndPlayer = function () {
    var that = this;
    var tableAndPlayer = {};
    for (var playerName in that.players) {
        if (!tableAndPlayer[that.players[playerName].tableNumber]) {
            tableAndPlayer[that.players[playerName].tableNumber] = [];
        }
        tableAndPlayer[that.players[playerName].tableNumber].push(playerName);
    }
    var message;
    for (var guest in that.guests) {
        message = {
            'eventName': '__new_peer',
            'data': tableAndPlayer[that.guests[guest].tableNumber]
        };
        that.guests[guest].send(JSON.stringify(message), errorCb);
    }
    for (var player in that.players) {
        message = {
            'eventName': '__new_peer',
            'data': tableAndPlayer[that.players[player].tableNumber]
        };
        that.players[player].send(JSON.stringify(message), errorCb);
    }
};

SkyRTC.prototype.startGame = function (tableNumber) {
    var that = this;
    var message;
    try {
        parseInt(tableNumber);
    } catch (e) {
        logger.error('table : ' + tableNumber + ' start fail, type is not correct');
        return;
    }

    logger.info("game start for table: " + tableNumber);
    if (that.table[tableNumber] && that.table[tableNumber].timeout) {
        clearTimeout(that.table[tableNumber].timeout);
        logger.info("remove table " + tableNumber + " timeout");
    }

    // initialize game parameters
    that.table[tableNumber] = new poker.Table(10, 20, 3, 10, 1000, 2, 100);
    that.table[tableNumber].tableNumber = tableNumber;

    for (var player in that.players) {
        if (that.players[player].tableNumber === tableNumber)
            that.table[tableNumber].AddPlayer(player);
    }
    that.initTable(tableNumber);
    logger.info("init table done");

    if (that.table[tableNumber].playersToAdd.length < that.table[tableNumber].minPlayers) {
        logger.info(that.table);
        message = {
            'eventName': '__game_start',
            'data': {
                'msg': 'table ' + tableNumber + ' need at least ' + that.table[tableNumber].minPlayers + ' users to attend',
                'tableNumber': tableNumber
            }
        }
    } else {
        that.table[tableNumber].StartGame();
        message = {
            'eventName': '__game_start',
            'data': {'msg': 'table ' + tableNumber + ' start successfully', 'tableNumber': tableNumber}
        }
    }
    logger.info('broadcast __game_start');

    that.broadcastInGuests(message);
    // that.broadcastInPlayers(message);

    // also broadcast __new_round message to all
    /* logger.info("force preparing round 1 for table: " + tableNumber);
     that.table[tableNumber].start1stRound();*/
};

SkyRTC.prototype.initTable = function (tableNumber) {
    var that = this;

    that.table[tableNumber].eventEmitter.on('__turn', function (data) {
        var message = {
            'eventName': '__action',
            'data': data
        };
        that.getPlayerAction(message);
    });

    that.table[tableNumber].eventEmitter.on('__bet', function (data) {
        var message = {
            'eventName': '__bet',
            'data': data
        };
        that.getPlayerAction(message);
        var data = that.getBasicData(data.tableNumber);
        var message2 = {
            'eventName': '__deal',
            'data': data
        };
        that.broadcastInGuests(message2);
        that.broadcastInPlayers(message2);
    });

    that.table[tableNumber].eventEmitter.on('__game_over', function (data) {
        var message = {
            'eventName': '__game_over',
            'data': data
        };
        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
        if (that.table[data.table.tableNumber].timeout)
            clearTimeout(data.table.tableNumber.timeout);
        delete that.table[data.table.tableNumber];
    });

    that.table[tableNumber].eventEmitter.on('__new_round', function (data) {
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
        var message = {
            'eventName': '__round_end',
            'data': data
        };
        that.broadcastInPlayers(message);
    });

    that.table[tableNumber].eventEmitter.on('__show_action', function (data) {
        var message = {
            'eventName': '__show_action',
            'data': data
        };

        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
    });
};

SkyRTC.prototype.getPlayerAction = function (message, isSecond) {
    var that = this;
    var player = message.data.self.playerName;
    var tableNumber;
    var currentTable;
    tableNumber = that.playerAndTable[player];
    currentTable = that.table[tableNumber];
    if (that.players[player]) {
        logger.info('server request: ' + JSON.stringify(message));
        if (that.players[player]) {
            that.players[player].send(JSON.stringify(message), function (error) {
                if (error) {
                    logger.error('server send error: ' + JSON.stringify(error));
                    that.getPlayerAction(message);
                } else {
                    var timestamp = new Date().getTime();
                    logger.info('send player action,time is ' + timestamp);
                    currentTable.timeout = setTimeout(function () {
                        if (currentTable.isStart) {
                            logger.info("table " + tableNumber +" player " + player + " response timeout, auto FOLD");
                            currentTable.players[currentTable.currentPlayer].Fold();
                        }
                    }, 5000);
                }
            });
        }
    } else if (!isSecond) {
        currentTable.timeout = setTimeout(function () {
            if (currentTable.isStart) {
                that.getPlayerAction(message, true);
            }
        }, 10 * 1000);
    } else {
        // bug fix - crash after players quit
        if (currentTable && currentTable.isStart) {
            logger.info("table " + tableNumber + " player " + player + " response timeout, auto fold");
            currentTable.players[currentTable.currentPlayer].Fold();
        }
    }
};

SkyRTC.prototype.removeSocket = function (socket) {
    var id = socket.id;
    var that = this;
    if (that.players[id]) {
        delete that.players[id];
        that.playerNumber--;
    }
    delete that.guests[id];
};

SkyRTC.prototype.broadcastInGuests = function (message) {
    var that = this;
    var tableNumber = message.data.tableNumber || message.data.table.tableNumber;
    for (var guest in that.guests) {
        if (that.guests[guest].tableNumber === tableNumber)
            that.guests[guest].send(JSON.stringify(message), errorCb);
    }
};

SkyRTC.prototype.broadcastInPlayersForReload = function (message) {
    var tableNumber = message.data.tableNumber;
    for (var player in this.players) {
        if (this.players[player].tableNumber === tableNumber) {
            this.players[player].send(JSON.stringify(message), errorCb);
        }
    }
};

SkyRTC.prototype.broadcastInPlayers = function (message) {
    var cards = {};
    var playersData = {};
    for (var i = 0; i < message.data.players.length; i++) {
        cards[message.data.players[i].playerName] = message.data.players[i].cards;
        playersData[message.data.players[i].playerName] = message.data.players[i];
        if (message.eventName != '__game_over' && message.eventName != '__round_end')
            delete message.data.players[i].cards;
    }
    var tableNumber = message.data.table.tableNumber;
    for (var player in this.players) {
        if (this.players[player].tableNumber == tableNumber) {
            if (message.eventName != '__game_over' && message.eventName != '__round_end') {
                playersData[player].cards = cards[player];
                this.players[player].send(JSON.stringify(message), errorCb);
                playersData[player].cards = [];
            } else {
                this.players[player].send(JSON.stringify(message), errorCb);
            }
        }
    }
};

SkyRTC.prototype.init = function (socket) {
    var that = this;
    socket.id = UUID.v4();

    socket.on('message', function (data) {
            logger.info('message received from ' + socket.id + ' : ' + data);
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

    socket.on('close', function () {
        that.emit('remove_peer', socket.id);
        var tableNumber = that.playerAndTable[socket.id];
        if (tableNumber && that.table[tableNumber].isStart) {
            that.exitPlayers[socket.id] = socket.tableNumber;
        }
        that.removeSocket(socket);
    });

    playerDao.getAllPlayers(function (getPlayerErr, players) {
        if (getPlayerErr.code === errorCode.SUCCESS.code) {
            for (var i = 0; i < players.length; i++) {
                var player = players[i];
                that.playerAndTable[player.playerName] = player.tableNumber;
            }
            logger.info('players and tables : ' + JSON.stringify(that.playerAndTable));
        } else {
            logger.error('no players found');
        }
        that.emit('new_connect', socket);
    });
};

exports.listen = function (server) {
    var SkyRTCServer;
    if (typeof server === 'number') {
        SkyRTCServer = new WebSocketServer({
            port: server
        });
    } else {
        SkyRTCServer = new WebSocketServer({
            server: server
        });
    }

    SkyRTCServer.rtc = new SkyRTC();
    errorCb = errorCb(SkyRTCServer.rtc);
    SkyRTCServer.on('connection', function (socket) {
        this.rtc.init(socket);
    });

    return SkyRTCServer;
};
