/**
 * Created by the-engine team
 * 2017-11-11
 */

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.send('something');
});

// danmu server
var DANMU_SERVER = 'ws://playerbot.cn:3000';

try {
    var danmuRelayWs = new WebSocket(DANMU_SERVER, {
        perMessageDeflate: false
    });
} catch(error) {
    logger.error('danmu server connecting error : ' + error);
}

var wsStatus = enums.DANMU_RELAY_CLOSED;

danmuRelayWs.on('open', function open() {
    wsStatus = enums.DANMU_RELAY_OPENED;
    danmuRelayWs.send(JSON.stringify({
        "eventName": "__join",
        "data": {
            "isGame": true
        }
    }));
});

danmuRelayWs.on('close', function() {
    logger.error('remote socket closed');
});

danmuRelayWs.on('error', function(error) {
    logger.error('socket error : ' + error);
});

danmuRelayWs.on('message', function incoming(message) {
    skyRTC.broadcastInDanmuGuest(JSON.parse(message));
});


SkyRTC.prototype.relayDanmu = function (message) {
    var that = this;
    that.broadcastInGuests(message);
};

SkyRTC.prototype.broadcastInDanmuGuest = function (message) {
    var that = this;
    if (message && message.data) {
        console.log('relay danmu : ' + JSON.stringify(message));
        var tableNumber = message.data.tableNumber;
        for (var guest in that.guests) {
            if (that.guests[guest].tableNumber === tableNumber &&
                1 === parseInt(that.guests[guest].danmu)) {
                that.sendMessage(that.guests[guest], message);
            }
        }
    }
};
