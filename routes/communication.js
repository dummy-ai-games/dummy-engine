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
    this.table = [];
    this.admin = null;
    this.kanban = null;
    this.players = {};
    this.exitPlayers = {};
    this.tablePlayerNumber = 10;
    this.playerNumber = 0;
    this.playerAndTable = {};
    this.on('__join', function (data, socket) {
        var that = this;
        var playerName = data.playerName;
        var table = data.tableNumber || 0;
        if (playerName)
            socket.id = playerName;

        if (playerName == 'admin') {
            that.admin = socket;
            that.admin.tableNumber = table;
            that.initAdminData();
        } else if (playerName == "kanban") {
            that.kanban = socket;
            if (that.isStart)
                that.initKanbanData();
        } else {
            that.playerNumber++;
            var exitPlayer = that.exitPlayers[socket.id];
            if (exitPlayer) {
                socket.tableNumber = exitPlayer.tableNumber;
                socket.index = exitPlayer.index;
                delete that.exitPlayers[socket.id];
            } else {
                socket.tableNumber = that.playerAndTable[socket.id];
            }
            that.players[socket.id] = socket;
            this.emit('new_peer', socket.id);
            that.notificationAdmin();
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
                    case "Bet":
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
                    case "Call":
                        if (currentTable.isBet)
                            currentTable.players[playerIndex].Bet(currentTable.smallBlind);
                        else
                            currentTable.players[playerIndex].Call();
                        break;
                    case "Check":
                        currentTable.players[playerIndex].Check();
                        break;
                    case "Raise":
                        if (currentTable.isBet)
                            currentTable.players[playerIndex].Bet(currentTable.smallBlind);
                        else
                            currentTable.players[playerIndex].Raise();
                        break;
                    case "All-in":
                        if (currentTable.isBet)
                            currentTable.isBet = false;
                        currentTable.players[playerIndex].AllIn();
                        break;
                    case "Fold":
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

SkyRTC.prototype.initKanbanData = function () {
    var result = [];
    var chips = {};
    var that = this;
    if (that.kanban) {
        for (var i = 0; i < that.table.length; i++) {
            for (var j in that.table[i].players) {
                var player = that.table[i].players[j];
                chips[player.playerName] = player.chips;
            }
        }
        for (var player in that.players) {
            var data = {playerName: player};
            var id = that.players[player].index;
            var chip = 0;
            chip = chips[player] || 0;
            data["chips"] = chip;
            data["id"] = id;
            result.push(data);
        }
        var message = {
            "eventName": "_join",
            "data": result
        }
        that.kanban.send(JSON.stringify(message), errorCb);
    }
}

SkyRTC.prototype.updateKanban = function (playerName, tableNumber, chips) {
    var that = this;
    if (that.kanban && that.players[playerName]) {
        var data = {};
        data["playerName"] = playerName;
        data["chips"] = chips;
        data["id"] = that.players[playerName].index;
        var message = {
            "eventName": "_showAction",
            "data": data
        }
        that.kanban.send(JSON.stringify(message), errorCb);
    }
}

SkyRTC.prototype.notifyKanban = function (playerName, index) {
    var that = this;
    if (that.kanban) {
        var message = {
            "eventName": "_playerExit",
            "data": {playerName: playerName, id: index}
        }
        that.kanban.send(JSON.stringify(message), errorCb);
    }
}

SkyRTC.prototype.initAdminData = function () {
    var that = this;
    if (that.admin) {
        var data = that.getBasicData();
        var message = {
            "eventName": "_join",
            "data": data
        }
        that.admin.send(JSON.stringify(message), errorCb);
    }
}
SkyRTC.prototype.getBasicData = function () {
    var that = this;
    var players = [];
    var table = {};
    var data = {};
    var desTable = that.table[that.admin.tableNumber];
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

SkyRTC.prototype.startGame = function () {
    var that = this;
    var message;
    var playerNum = parseInt(that.playerNumber);
    var tablePlayerNum = parseInt(that.tablePlayerNumber);
    var tableNum = playerNum % tablePlayerNum == 0 ? parseInt(playerNum / tablePlayerNum) : parseInt(playerNum / tablePlayerNum) + 1;
    that.table.splice(0, that.table.length);
    that.isStart = true;
    for (var i = 0; i < tableNum; i++)
        that.table.push(new poker.Table(50, 100, 3, 10, 100, 1000));
    that.initTable();
    var index = 0;
    for (var player in this.players) {
        var belongTable = that.players[player].tableNumber;
        if (!belongTable) {
            belongTable = parseInt(index / tablePlayerNum);
            that.players[player].tableNumber = belongTable;
        }
        that.table[belongTable].AddPlayer(player);
        that.players[player].index = index;
        index++;
    }
    for (var i = 0; i < that.table.length; i++) {
        if (that.table[i].playersToAdd.length < that.table[i].minPlayers) {
            console.log(that.table);
            message = {
                "eventName": "startGame",
                "data": {"msg": "table " + i + " need at least " + that.table.minPlayers + " users to attend"}
            }
        } else {
            that.table[i].StartGame();
            message = {
                "eventName": "startGame",
                "data": {"msg": "table " + i + " start successfully"}
            }
        }
        if (that.admin)
            that.admin.send(JSON.stringify(message), errorCb);
    }

}

SkyRTC.prototype.initTable = function () {
    var that = this;
    for (var i = 0; i < that.table.length; i++) {
        that.table[i].tableNumber = i;
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
            if (that.admin) {
                var data = that.getBasicData();
                var message2 = {
                    "eventName": "__deal",
                    "data": data
                }
                that.admin.send(JSON.stringify(message2), errorCb);
            }
        });

        that.table[i].eventEmitter.on("__gameOver", function (data) {
            var message = {
                "eventName": "__gameOver",
                "data": data
            }
            that.admin.send(JSON.stringify(message), errorCb);
            that.initKanbanData();
            that.isStart = false;
        });

        that.table[i].eventEmitter.on("__newRound", function (data) {
            var message = {
                "eventName": "__newRound",
                "data": data
            }
            that.admin.send(JSON.stringify(message), errorCb);
        });

        that.table[i].eventEmitter.on("__showAction", function (data) {
            var message = {
                "eventName": "__showAction",
                "data": data
            }
            that.admin.send(JSON.stringify(message), errorCb);
            that.updateKanban(data.action.playerName, data.table.tableNumber, data.action.chips);
            that.broadcastInPlayers(message);
        });
    }
}

SkyRTC.prototype.getPlayerAction = function (message, isSecond) {
    var that = this;
    var player = message.data.player.playerName;
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
};

SkyRTC.prototype.broadcastInPlayers = function (message) {
    for (var i = 0; i < message.data.players.length; i++) {
        delete message.data.players[i].cards;
    }
    var tableNumber = message.data.table.tableNumber;
    for (var player in this.players) {
        var currentPlayer = message.data.action.playerName;
        if (player != currentPlayer && this.players[player].tableNumber == tableNumber)
            this.players[player].send(JSON.stringify(message), errorCb);
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
        if (socket.id != "admin" && socket.id != "kanban" && that.players[socket.id].tableNumber != undefined) {
            that.exitPlayers[socket.id] = socket;
            that.notifyKanban(socket.id, socket.index);
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
