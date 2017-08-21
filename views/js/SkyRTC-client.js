var SkyRTC = function () {

    /**********************************************************/
    /*                                                        */
    /*                       事件处理器                       */
    /*                                                        */
    /**********************************************************/
    function EventEmitter() {
        this.events = {};
    }

    //绑定事件函数
    EventEmitter.prototype.on = function (eventName, callback) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(callback);
    };
    //触发事件函数
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


    /**********************************************************/
    /*                                                        */
    /*                   流及信道建立部分                     */
    /*                                                        */
    /**********************************************************/


    /*******************基础部分*********************/
    function skyrtc() {
        //本地WebSocket连接
        this.socket = null;
    }

    //继承自事件处理器，提供绑定事件和触发事件的功能
    skyrtc.prototype = new EventEmitter();


    /*************************服务器连接部分***************************/


        //本地连接信道，信道为websocket，创建socket连接
    skyrtc.prototype.connect = function (server, player) {
        var socket,
            that = this;

        socket = this.socket = new WebSocket(server);
        socket.onopen = function () {
            socket.send(JSON.stringify({
                "eventName": "__join",
                "data": {
                    "playerName": player
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
            //获取所有服务器上的

            that.emit('connected', socket);
        });

        this.on('_new_peer', function (data) {//

            that.emit('new_peer', data.socketId);
        });

        this.on('_remove_peer', function (data) {

            that.emit("remove_peer", data.socketId);
        });
        this.on('__action', function (data) {
            that.emit("_action", data);
        });
        this.on('__bet', function (data) {
            that.emit("_bet", data);
        });
        this.on('__gameOver', function (data) {
            that.emit("_gameOver", data);
        });


    };
    skyrtc.prototype.Bet = function (playerName, amount) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_action",
            "data": {
                "action": "Bet",
                "playerName": playerName,
                "amount": amount
            }
        }));
    };
    skyrtc.prototype.Call = function (playerName) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_action",
            "data": {
                "action": "Call",
                "playerName": playerName
            }
        }));
    };
    skyrtc.prototype.Check = function (playerName) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_action",
            "data": {
                "action": "Check",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.Raise = function (playerName) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_action",
            "data": {
                "action": "Raise",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.AllIn = function (playerName) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_action",
            "data": {
                "action": "All-in",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.Fold = function (playerName) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_action",
            "data": {
                "action": "Fold",
                "playerName": playerName
            }
        }));
    };

    skyrtc.prototype.startGame = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_startGame",
            "data": {
            }
        }));
    };


    return new skyrtc();
};