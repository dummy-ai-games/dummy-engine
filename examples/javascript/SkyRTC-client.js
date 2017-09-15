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
    skyrtc.prototype.connect = function (server, param) {
        var socket,
            that = this;

        socket = this.socket = new WebSocket(server);
        socket.onopen = function () {
            socket.send(JSON.stringify({
                "eventName": "__join",
                "data": {
                    "playerName": param
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
    skyrtc.prototype.Bet = function (amount) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "bet",
                "amount": amount

            }
        }));
    };
    skyrtc.prototype.Call = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "call"


            }
        }));
    };
    skyrtc.prototype.Check = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "check"

            }
        }));
    };

    skyrtc.prototype.Raise = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "raise"

            }
        }));
    };

    skyrtc.prototype.AllIn = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "allin"


            }
        }));
    };

    skyrtc.prototype.Fold = function () {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "__action",
            "data": {
                "action": "fold"

            }
        }));
    };

    skyrtc.prototype.startGame = function (tableNumber) {
        var that = this;
        that.socket.send(JSON.stringify({
            "eventName": "_startGame",
            "data": {
                "tableNumber": tableNumber
            }
        }));
    };


    return new skyrtc();
};