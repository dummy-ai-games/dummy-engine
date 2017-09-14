/**
 * Created by the-engine team
 * 2017-07-22
 */

var WebSocketServer = require('ws').Server;
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var poker = require('./node_poker');
var playerDao = require("../models/player_dao");

var logger = require('../poem/logging/logger4js').helper;

var Enums = require('../constants/enums.js');
var ErrorCode = require('../constants/error_code.js');

var enums = new Enums();
var errorCode = new ErrorCode();

var errorCb = function (rtc) {
    return function (error) {
        if (error) {
            rtc.emit("error", error);
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
        var param = data.playerName;
        if (that.playerAndTable[param])
            socket.id = param;
        else
            socket.tableNumber = param;

        if (that.playerAndTable[socket.id]) {
            logger.info("player join!!");
            that.playerNumber++;
            var exitPlayer = that.exitPlayers[socket.id];
            if (exitPlayer) {
                socket.tableNumber = exitPlayer.tableNumber;
                delete that.exitPlayers[socket.id];
            } else {
                socket.tableNumber = that.playerAndTable[socket.id];
            }
            that.players[socket.id] = socket;
            this.emit('new_peer', socket.id);
            that.notifyGuestAndPlayer();
            that.initPlayerData(socket.id);
        } else {
            logger.info("guest join!!");
            that.guests[socket.id] = socket;
            that.notifyGuestAndPlayer();
            that.initGuestData(socket.id);
        }
    });

    this.on('_startGame', function (data) {
        this.startGame(data.tableNumber);
    });

    this.on('__action', function (data) {
        try {
            logger.info("用户" + data.playerName + "采取动作" + data.action);
            var that = this;
            var action = data.action;
            var playerName = data.playerName;
            if (that.players[playerName]) {
                var tableNum = that.players[playerName].tableNumber;
                var currentTable = that.table[tableNum];
                if (currentTable.timeout)
                    clearTimeout(currentTable.timeout);
                var playerIndex = parseInt(getPlayerIndex(playerName, currentTable.players));
                if (playerIndex != currentTable.currentPlayer)
                    currentTable.players[playerIndex].Fold();
                else if (playerIndex != -1 && currentTable.checkPlayer(playerIndex)) {
                    try {
                        switch (action) {
                            case "bet":
                                if (currentTable.isBet) {
                                    var amount;
                                    try {
                                        amount = parseInt(data.amount);
                                    } catch (e) {
                                        logger.info(e.message);
                                        amount = currentTable.smallBlind;
                                    }
                                    currentTable.players[playerIndex].Bet(amount);
                                } else
                                    currentTable.players[playerIndex].Call();
                                break;
                            case "call":
                                if (currentTable.isBet)
                                    currentTable.players[playerIndex].Bet(currentTable.smallBlind);
                                else
                                    currentTable.players[playerIndex].Call();
                                break;
                            case "check":
                                currentTable.players[playerIndex].Check();
                                break;
                            case "raise":
                                if (currentTable.isBet)
                                    currentTable.players[playerIndex].Bet(currentTable.smallBlind);
                                else
                                    currentTable.players[playerIndex].Raise();
                                break;
                            case "allin":
                                if (currentTable.isBet)
                                    currentTable.isBet = false;
                                currentTable.players[playerIndex].AllIn();
                                break;
                            case "fold":
                                currentTable.players[playerIndex].Fold();
                                break;
                            default:
                                currentTable.players[playerIndex].Fold();
                                break;
                        }
                    } catch (e) {
                        logger.info(e.message);
                        currentTable.players[playerIndex].Fold();
                    }

                }
            }
        } catch (e) {
            logger.info(e.message);
        }
    });
}

util.inherits(SkyRTC, events.EventEmitter);

function getPlayerIndex(playerName, players) {
    for (var i in players) {
        var player = players[i];
        if (player.playerName == playerName)
            return i;
    }
    return -1;
}

SkyRTC.prototype.initAdminData = function () {
    logger.info("initAdminData");
    var that = this;
    if (that.admin) {
        var data = that.getBasicData(that.admin.tableNumber);
        var message = {
            "eventName": "_join",
            "data": data
        };
        that.admin.send(JSON.stringify(message), errorCb);
    }
};

SkyRTC.prototype.initGuestData = function (guest) {
    logger.info("initGuestData");
    var that = this;
    var data = that.getBasicData(that.guests[guest].tableNumber);
    var message = {
        "eventName": "_join",
        "data": data
    };
    that.guests[guest].send(JSON.stringify(message), errorCb);

};

SkyRTC.prototype.initPlayerData = function (player) {
    logger.info("initPlayerData");
    var that = this;
    var data = that.getBasicData(that.players[player].tableNumber);
    for (var i in data.players) {
        if (data.players[i].playerName != that.players[player].id)
            delete data.players[i].cards;
    }
    var message = {
        "eventName": "_join",
        "data": data
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
        for (var i = 0; i < desTable.players.length; i++) {
            var player = {};
            player['playerName'] = desTable.players[i]['playerName'];
            player['chips'] = desTable.players[i]['chips'];
            player['folded'] = desTable.players[i]['folded'];
            player['allIn'] = desTable.players[i]['allIn'];
            player['cards'] = desTable.players[i]['cards'];
            players.push(player);
        }
        table["tableNumber"] = desTable.tableNumber;
        table["roundName"] = desTable.roundName;
        table["board"] = desTable.game.board;
        data.players = players;
        data.table = table;
    }

    return data;
};

SkyRTC.prototype.notifyGuestAndPlayer = function () {
    var that = this;
    var tableAndPlayer = {};
    for (var playerName in that.players) {
        if (!tableAndPlayer[that.players[playerName].tableNumber])
            tableAndPlayer[that.players[playerName].tableNumber] = [];
        tableAndPlayer[that.players[playerName].tableNumber].push(playerName);
    }
    var message;
    for (var guest in that.guests) {
        message = {
            "eventName": "__new_peer",
            "data": tableAndPlayer[that.guests[guest].tableNumber]
        };
        that.guests[guest].send(JSON.stringify(message), errorCb);
    }
    for (var player in that.players) {
        message = {
            "eventName": "__new_peer",
            "data": tableAndPlayer[that.players[player].tableNumber]
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
        logger.info("table " + tableNumber + " start fail,  type is not correct");
        return;
    }

    that.table[tableNumber] = new poker.Table(50, 100, 3, 10, 100, 1000);
    that.table[tableNumber].tableNumber = tableNumber;

    for (var player in that.players) {
        if (that.players[player].tableNumber == tableNumber)
            that.table[tableNumber].AddPlayer(player);
    }
    that.initTable(tableNumber);

    if (that.table[tableNumber].playersToAdd.length < that.table[tableNumber].minPlayers) {
        logger.info(that.table);
        message = {
            "eventName": "startGame",
            "data": {
                "msg": "table " + tableNumber + " need at least " + that.table[tableNumber].minPlayers + " users to attend",
                "tableNumber": tableNumber
            }
        }
    } else {
        that.table[tableNumber].StartGame();
        message = {
            "eventName": "startGame",
            "data": {"msg": "table " + tableNumber + " start successfully", "tableNumber": tableNumber}
        }
    }

    that.broadcastInGuests(message);
};

SkyRTC.prototype.initTable = function (tableNumber) {
    var that = this;

    that.table[tableNumber].eventEmitter.on("__turn", function (data) {
        var message = {
            "eventName": "__action",
            "data": data
        };
        that.getPlayerAction(message);
    });

    that.table[tableNumber].eventEmitter.on("__bet", function (data) {
        var message = {
            "eventName": "__bet",
            "data": data
        };
        that.getPlayerAction(message);
        var data = that.getBasicData(data.tableNumber);
        var message2 = {
            "eventName": "__deal",
            "data": data
        };
        that.broadcastInGuests(message2);
        that.broadcastInPlayers(message2);
    });

    that.table[tableNumber].eventEmitter.on("__gameOver", function (data) {
        var message = {
            "eventName": "__gameOver",
            "data": data
        };
        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
        delete that.table[data.table.tableNumber];
    });

    that.table[tableNumber].eventEmitter.on("__new_round", function (data) {
        var message = {
            "eventName": "__new_round",
            "data": data
        };
        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
    });

    that.table[tableNumber].eventEmitter.on("__show_action", function (data) {
        var message = {
            "eventName": "__show_action",
            "data": data
        };

        that.broadcastInGuests(message);
        that.broadcastInPlayers(message);
    });

};

SkyRTC.prototype.getPlayerAction = function (message, isSecond) {
    var that = this;
    var player = message.data.self.playerName;
    if (that.players[player]) {
        var tableNumber = that.players[player].tableNumber;
        var currentTable = that.table[tableNumber];
        logger.info("服务端轮询动作：" + JSON.stringify(message));
        if (that.players[player]) {
            that.players[player].send(JSON.stringify(message), errorCb);
        }
        /*
         currentTable.timeout = setTimeout(function () {
         logger.info("用户" + currentTable.players[currentTable.currentPlayer].playerName + "超时，自动放弃");
         currentTable.players[currentTable.currentPlayer].Fold();
         }, 5000);
         */
    } else if (!isSecond) {
        setTimeout(function () {
            that.getPlayerAction(message, true);
        }, 10 * 1000);
    } else {
        var tableNumber = that.exitPlayers[player].tableNumber;
        var currentTable = that.table[tableNumber];
        currentTable.players[currentTable.currentPlayer].Fold();
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
        if (that.guests[guest].tableNumber == tableNumber)
            that.guests[guest].send(JSON.stringify(message), errorCb);
    }
};

SkyRTC.prototype.broadcastInPlayers = function (message) {
    var cards = {};
    var players = {};
    for (var i = 0; i < message.data.players.length; i++) {
        cards[message.data.players[i].playerName] = message.data.players[i].cards;
        players[message.data.players[i].playerName] = message.data.players[i];
        delete message.data.players[i].cards;
    }
    var tableNumber = message.data.table.tableNumber;
    for (var player in this.players) {
        if (this.players[player].tableNumber == tableNumber) {
            players[player].cards = cards[player];
            this.players[player].send(JSON.stringify(message), errorCb);
            players[player].cards = [];
        }
    }
};

SkyRTC.prototype.init = function (socket) {
    var that = this;
    socket.id = UUID.v4();

    socket.on('message', function (data) {
        logger.info('message received : ' + data);
        try {
            var json = JSON.parse(data);
            if (json.eventName) {
                that.emit(json.eventName, json.data, socket);
            } else {
                that.emit("socket_message", socket, data);
            }
        }catch (e){
            logger.error(e.message);
        }
    });

    socket.on('close', function () {
        that.emit('remove_peer', socket.id);
        if (that.playerAndTable[socket.id]) {
            that.exitPlayers[socket.id] = socket;
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
            logger.error("no players found");
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
