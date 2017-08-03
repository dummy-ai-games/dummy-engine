/**
 * Created by jieping on 2017/7/22.
 */
var WebSocketServer = require('ws').Server;
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var poker = require('./node-poker');


var errorCb = function (rtc) {
    return function (error) {
        if (error) {
            rtc.emit("error", error);
        }
    };
};

function SkyRTC() {
    this.table = null;
    this.admin = null;
    this.round = {};
    this.timeout = null;
    this.on('__join', function (data, socket) {
        var that = this;
        var playerName = data.playerName;
        if (playerName)
            socket.id = playerName;
        if (playerName == 'admin')
            that.admin = socket;
        else
            that.round[socket.id] = socket;
        this.emit('new_peer', socket.id);
        that.notificationAdmin();
    });

    this.on('_startGame', function () {
        this.startGame();
    });

    this.on('_action', function (data) {
        var that = this;
        //clearTimeout(that.timeout);
        var action = data.action;
        var playerName = data.playerName;
        var playerIndex = parseInt(getPlayerIndex(playerName, that.table.players));
        if (playerIndex != that.table.currentPlayer)
            that.table.players[playerIndex].Fold();
        else if (playerIndex != -1 && that.table.checkPlayer(playerIndex)) {
            switch (action) {
                case "Bet":
                    if (that.table.isBet) {
                        try {
                            var amount = parseInt(data.amount.replace(/(^\s*)|(\s*$)/g, ""));
                            that.table.players[playerIndex].Bet(amount);
                        } catch (e) {
                            console.log(e.message);
                            that.table.players[playerIndex].Fold();
                        }
                    } else
                        that.table.players[playerIndex].Call();
                    break;
                case "Call":
                    if (that.table.isBet)
                        that.table.players[playerIndex].Bet(that.table.smallBlind);
                    else
                        that.table.players[playerIndex].Call();
                    break;
                case "Check":
                    that.table.players[playerIndex].Check();
                    break;
                case "Raise":
                    if (that.table.isBet)
                        that.table.players[playerIndex].Bet(that.table.smallBlind);
                    else
                        that.table.players[playerIndex].Raise();
                    break;
                case "All-in":
                    if (that.table.isBet)
                        that.table.isBet = false;
                    that.table.players[playerIndex].AllIn();
                    break;
                case "Fold":
                    that.table.players[playerIndex].Fold();
                    break;
                default:
                    that.table.players[playerIndex].Fold();
                    break;
            }

            this.emit('_receiveAction', data);
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

SkyRTC.prototype.notificationAdmin = function () {
    var that = this;
    if (that.admin) {
        var players = [];
        for (var playerName in that.round)
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
    that.table = new poker.Table(50, 100, 3, 10, 100, 1000);
    that.initTable();
    for (var player in this.round)
        that.table.AddPlayer(player);
    if (that.table.playersToAdd.length < that.table.minPlayers) {
        console.log(that.table);
        message = {
            "eventName": "startGameFail",
            "data": {"msg": "need at least " + that.table.minPlayers + " users to attend"}
        }
    } else {
        that.table.StartGame();
        message = {
            "eventName": "startGame"
        }
    }
    if (that.admin)
        that.admin.send(JSON.stringify(message), errorCb);

}

SkyRTC.prototype.initTable = function () {
    var that = this;
    that.table.eventEmitter.on("__turn", function (data) {
        var message = {
            "eventName": "__action",
            "data": data
        }
        that.getPlayerAction(message);
    });

    that.table.eventEmitter.on("__bet", function (data) {
        var message = {
            "eventName": "__bet",
            "data": data
        }
        that.getPlayerAction(message);
    });

    that.table.eventEmitter.on("__gameOver", function (data) {
        var message = {
            "eventName": "__gameOver",
            "data": data
        }
        that.admin.send(JSON.stringify(message), errorCb);
    });
}

SkyRTC.prototype.getPlayerAction = function (message) {
    var player = message.data.player.playerName;
    var that = this;
    console.log(JSON.stringify(message));
    if (player)
        that.round[player].send(JSON.stringify(message), errorCb);
    /*that.timeout = setTimeout(function () {
     console.log("用户" + that.table.players[that.table.currentPlayer].playerName + "超时，自动放弃");
     that.table.players[that.table.currentPlayer].Fold();
     }, 5000);*/
};

SkyRTC.prototype.removeSocket = function (socket) {
    var id = socket.id;
    var that = this;
    delete that.round[id];
};

SkyRTC.prototype.broadcastInPlayers = function (data) {
    for (var player in this.round) {
        this.round[player].send(JSON.stringify(data), errorCb);
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
        that.removeSocket(socket);

    });
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