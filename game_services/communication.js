/**
 * Created by the-engine team
 * 2017-07-22
 */

var WebSocketServer = require('ws').Server;
var logger = require('../poem/logging/logger4js').helper;
var PokerGame = require("./texasholdem/communicate.js");
var FlyChess = require("./fly_chess/communicate.js");
var games = {};

/**
 * Exported functions
 */

function init(socket) {
    socket.on('message', function (data) {
            try {
                var json = JSON.parse(data);
                if (json.eventName === "__join") {
                    var gameType = json.data.gameType;
                    switch (gameType) {
                        case "texasholdem":
                            var pokerGame = games[gameType];
                            if (!pokerGame)
                                pokerGame = games[gameType] = new PokerGame.SkyRTC();
                            pokerGame.socketJoin(socket);
                            pokerGame.emit(json.eventName, json.data, socket);
                            break;
                        case "fly_chess":
                            var flyChess = games[gameType];
                            if (!flyChess)
                                flyChess = games[gameType] = new FlyChess.SkyRTC();
                            flyChess.socketJoin(socket);
                            flyChess.emit(json.eventName, json.data, socket);
                            break;
                        default:
                            break;

                    }
                } else {
                    logger.info("parameter is null, ignore it");
                }
            } catch (e) {
                logger.error(e.message);
            }
        }
    );
};
exports.listen = function (server, tableNumber, tablePort) {
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

    SkyRTCServer.on('connection', function (socket, req) {
        var ip = req.connection.remoteAddress || req.socket.remoteAddress || socket._socket.remoteAddress;
        socket.ip = ip;
        init(socket);
        logger.info("receive connection request from -> " + ip);
    });

    return SkyRTCServer;
};
