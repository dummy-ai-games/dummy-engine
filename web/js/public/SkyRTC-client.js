/**
 * Created by the-engine team
 * 2017-07-22
 */

var SkyRTC = function () {

    function EventEmitter() {
        this.events = {};
    }

    EventEmitter.prototype.on = function (eventName, callback) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(callback);
    };

    EventEmitter.prototype.emit = function (eventName, _) {
        var events = this.events[eventName],
            args = Array.prototype.slice.call(arguments, 1),
            i, m;

        if (!events) {
            return;
        }
        for (i = 0, m = events.length; i < m; i++) {
            events[i].apply(null, args);
        }
    };

    function skyrtc() {
        this.socket = null;
        this.socket_danmu = null;
    }

    skyrtc.prototype = new EventEmitter();

    skyrtc.prototype.connect = function (server, playerName, tableNumber, isHuman, danmu) {
        var socket,
            that = this;

        socket = this.socket = new WebSocket(server);
        socket.onopen = function () {
            socket.send(JSON.stringify({
                "eventName": "__join",
                "data": {
                    "playerName": playerName,
                    "tableNumber": tableNumber,
                    "isHuman": isHuman,
                    "danmu": danmu,
                    "gameType":"texasholdem"
                }
            }));
            that.emit("socket_opened", socket);
        };

        socket.onmessage = function (message) {
            var json = JSON.parse(message.data);
            if (json.eventName) {
                that.emit(json.eventName, json.data);
            } else {
                that.emit("socket_receive_message", socket, json);
            }
        };

        socket.onerror = function (error) {
            that.emit("socket_error", error, socket);
        };

        socket.onclose = function (data) {

            that.emit('socket_closed', socket);
        };

        this.on('_peers', function (data) {
            that.emit('connected', socket);
        });

        this.on('_remove_peer', function (data) {

            that.emit("remove_peer", data.socketId);
        });
    };

    /*
    // use danmu replay instead
    skyrtc.prototype.connectDanmu = function (server, tableNumber) {
        var socket,
            that = this;

        socket = this.socket_danmu = new WebSocket(server);
        socket.onopen = function () {
            socket.send(JSON.stringify({
                "eventName": "__join",
                "data": {
                    "tableNumber": tableNumber,
                    "isGame": true
                }
            }));
            that.emit("socket_opened", socket);
        };

        socket.onmessage = function (message) {
            var json = JSON.parse(message.data);
            if (json.eventName) {
                that.emit(json.eventName, json.data);
            } else {
                that.emit("socket_receive_message", socket, json);
            }
        };

        socket.onerror = function (error) {
            that.emit("socket_error", error, socket);
        };

        socket.onclose = function (data) {
            that.emit('socket_closed', socket);
        };
    };
    */

    skyrtc.prototype.Bet = function (amount) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "bet",
                "playerName": playerName,
                "amount": amount
            }
        }));
    };
    skyrtc.prototype.Call = function (playerName) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "call",
                "playerName": playerName
            }
        }));
    };
    skyrtc.prototype.Check = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "check",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.Raise = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "raise",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.AllIn = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "allin",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.Fold = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "fold",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.startGame = function(tableNumber,
                                          commandInterval, roundInterval,
                                          defaultSb, defaultChips, reloadChance,
                                          commandTimeout, lostTimeout) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__prepare_game",
            "data": {
                "tableNumber": tableNumber,
                "commandInterval": commandInterval,
                "roundInterval": roundInterval,
                "defaultSb": defaultSb,
                "defaultChips": defaultChips,
                "reloadChance": reloadChance,
                "commandTimeout": commandTimeout,
                "lostTimeout": lostTimeout
            }
        }));
    };

    skyrtc.prototype.stopGame = function(tableNumber) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__stop_game",
            "data": {
                "tableNumber": tableNumber
            }
        }));
    };

    skyrtc.prototype.endGame = function(tableNumber) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__end_game",
            "data": {
                "tableNumber": tableNumber
            }
        }));
    };

    skyrtc.prototype.Reload = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__reload",
            "data": {}
        }));
    };

    return new skyrtc();
};