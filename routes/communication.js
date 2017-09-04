/**
 * Created by jieping on 2017/7/22.
 */
var WebSocketServer = require('ws').Server;
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var poker = require('./node_poker');
var winnerDao = require("../model/winner_dao");
var playerDao = require("../model/player_dao");

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
        var param = data.param;
        if (that.playerAndTable[param])
            socket.id = param;
        else
            socket.tableNumber = param;

       if (that.playerAndTable[socket.id]) {
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
            that.notificationGuest();
        } else {
            that.guests[socket.id] = socket;
            that.initGuestData(socket.id);
        }

    });

    this.on('_startGame', function () {
        winnerDao.clearTable();
        this.startGame();
    });

    this.on('_action', function (data) {
        console.log("用户" + data.playerName + "采取动作" + data.action);
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
                switch (action) {
                    case "bet":
                        if (currentTable.isBet) {
                            var amount;
                            try {
                                amount = parseInt(data.amount.replace(/(^\s*)|(\s*$)/g, ""));
                            } catch (e) {
                                console.log(e.message);
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

            }
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
    var that = this;
    if (that.admin) {
        var data = that.getBasicData(that.admin.tableNumber);
        var message = {
            "eventName": "_join",
            "data": data
        }
        that.admin.send(JSON.stringify(message), errorCb);
    }
}
SkyRTC.prototype.initGuestData = function (guest) {
    var that = this;
    var data = that.getBasicData(that.guests[guest].tableNumber);
    var message = {
        "eventName": "_join",
        "data": data
    };
    that.guests[guest].send(JSON.stringify(message), errorCb);

}
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
}
SkyRTC.prototype.notificationAdmin = function () {
    var that = this;
    if (that.admin) {
        var players = [];
        for (var playerName in that.players)
            players.push(playerName);
        var message = {
            "eventName": "_new_peer",
            "data": players
        }
        that.admin.send(JSON.stringify(message), errorCb);
    }
}

SkyRTC.prototype.notificationGuest = function () {
    var that = this;
    var tableAndPlayer = {};
    for (var playerName in that.players) {
        if (!tableAndPlayer[that.players[playerName].tableNumber])
            tableAndPlayer[that.players[playerName].tableNumber] = [];
        tableAndPlayer[that.players[playerName].tableNumber].push(playerName);
    }

    for (var guest in that.guests) {
        var message = {
            "eventName": "_new_peer",
            "data": tableAndPlayer[that.guests[guest].tableNumber]
        }
        that.guests[guest].send(JSON.stringify(message), errorCb);
    }
}

SkyRTC.prototype.startGame = function () {
    var that = this;
    var message;
    that.table = {};

    for (var player in this.players) {
        var belongTable = that.players[player].tableNumber;
        if (!that.table[belongTable]) {
            that.table[belongTable] = new poker.Table(50, 100, 3, 10, 100, 1000);
            that.table[belongTable].tableNumber = belongTable;
        }
        that.table[belongTable].AddPlayer(player);
    }
    that.initTable();
    for (var i in that.table) {
        if (that.table[i].playersToAdd.length < that.table[i].minPlayers) {
            console.log(that.table);
            message = {
                "eventName": "startGame",
                "data": {
                    "msg": "table " + i + " need at least " + that.table.minPlayers + " users to attend",
                    "tableNumber": i
                }
            }
        } else {
            that.table[i].StartGame();
            message = {
                "eventName": "startGame",
                "data": {"msg": "table " + i + " start successfully", "tableNumber": i}
            }
        }

        that.broadcastInGuests(message);
    }

}

SkyRTC.prototype.initTable = function () {
    var that = this;
    for (var i in that.table) {
        that.table[i].eventEmitter.on("__turn", function (data) {
            var message = {
                "eventName": "__action",
                "data": data
            }
            that.getPlayerAction(message);
        });

        that.table[i].eventEmitter.on("__bet", function (data) {
            var message = {
                "eventName": "__bet",
                "data": data
            }
            that.getPlayerAction(message);
            var data = that.getBasicData(data.tableNumber);
            var message2 = {
                "eventName": "__deal",
                "data": data
            }
            that.broadcastInGuests(message2);
        });

        that.table[i].eventEmitter.on("__gameOver", function (data) {
            var message = {
                "eventName": "__gameOver",
                "data": data
            }
            that.broadcastInGuests(message);
        });

        that.table[i].eventEmitter.on("__newRound", function (data) {
            var message = {
                "eventName": "__newRound",
                "data": data
            }
            that.broadcastInGuests(message);
            that.broadcastInPlayers(message);
        });

        that.table[i].eventEmitter.on("__showAction", function (data) {
            var message = {
                "eventName": "__showAction",
                "data": data
            }

            that.broadcastInGuests(message);
            that.broadcastInPlayers(message);
        });
    }
}

SkyRTC.prototype.getPlayerAction = function (message, isSecond) {
    var that = this;
    var player = message.data.self.playerName;
    if (that.players[player]) {
        var tableNumber = that.players[player].tableNumber;
        var currentTable = that.table[tableNumber];
        console.log("服务端轮询动作：" + JSON.stringify(message));
        if (that.players[player]) {
            that.players[player].send(JSON.stringify(message), errorCb);
        }
        /* currentTable.timeout = setTimeout(function () {
         console.log("用户" + currentTable.players[currentTable.currentPlayer].playerName + "超时，自动放弃");
         currentTable.players[currentTable.currentPlayer].Fold();
         }, 5000);*/
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
}
SkyRTC.prototype.broadcastInPlayers = function (message) {
    for (var i = 0; i < message.data.players.length; i++) {
        delete message.data.players[i].cards;
        if (!message.data.players[i].isSurvive) {
            message.data.players.splice(i, 1);
            i--;
            continue;
        }
        delete message.data.players[i].isSurvive;
    }
    var tableNumber = message.data.table.tableNumber;
    for (var player in this.players) {
        if (message.eventName == '__newRound')
            this.players[player].send(JSON.stringify(message), errorCb);
        else {
            var currentPlayer = message.data.action.playerName;
            if (player != currentPlayer && this.players[player].tableNumber == tableNumber)
                this.players[player].send(JSON.stringify(message), errorCb);
        }
    }
};


SkyRTC.prototype.init = function (socket) {
    var that = this;
    socket.id = UUID.v4();

    //为新连接绑定事件处理器
    socket.on('message', function (data) {
        var json = JSON.parse(data);
        if (json.eventName) {
            that.emit(json.eventName, json.data, socket);
        } else {
            that.emit("socket_message", socket, data);
        }
    });

    //连接关闭后从SkyRTC实例中移除连接，并通知其他连接
    socket.on('close', function () {
        that.emit('remove_peer', socket.id);
        if (that.playerAndTable[socket.id]) {
            that.exitPlayers[socket.id] = socket;
        }
        that.removeSocket(socket);
    });

    playerDao.getAllPlayer(that.playerAndTable);
    that.emit('new_connect', socket);
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
