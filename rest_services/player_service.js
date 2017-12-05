/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var PlayerResponse = require('../responses/player_response');
var playerLogic = require('../work_units/player_logic');
var encrypt = require('../poem/crypto/encrypt');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

var PlayerAuth = require('../authority/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);

var MD5 = require('../poem/crypto/md5.js');


exports.signup = function (req, res) {
    var player = req.body;

    var playerResponse = new PlayerResponse();
    playerLogic.registerWorkUnit(player, function (registerErr, result) {
        playerResponse.status = registerErr;
        if (registerErr.code === errorCode.SUCCESS.code && null !== result && result.ops.length > 0) {
            // generate token and save to cache
            var token,
                key,
                ttl = 24 * 60 * 60 * 14,
                timeStamp,
                player;

            player = result.ops[0];
            timeStamp = new Date().getTime();
            token = MD5.MD5(player.password + timeStamp);
            key = "player_" + player.phoneNumber;
            playerAuth.setAuthInfo(key, token, ttl, function (setPlayerAuthErr) {
                if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                    player.token = token;
                    delete player.password;
                    playerResponse.status = errorCode.SUCCESS;
                    playerResponse.entity = player;
                    res.send(playerResponse);
                    res.end();
                } else {
                    playerResponse.status = errorCode.FAILED;
                    playerResponse.entity = null;
                    res.send(playerResponse);
                    res.end();
                }
            });
        } else {
            playerResponse.status = errorCode.FAILED;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        }

    });
};


exports.login = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var password = req.body.password;

    var playerResponse = new PlayerResponse();
    playerLogic.getPlayerWorkUnit(phoneNumber, password, function (getUserErr, players) {
        if (getUserErr.code === errorCode.SUCCESS.code && null !== players) {
            // generate token and save to cache
            var token,
                key,
                ttl = 24 * 60 * 60 * 14,
                timeStamp,
                player;

            player = players[0];
            timeStamp = new Date().getTime();
            token = MD5.MD5(password + timeStamp);
            key = "player_" + player.phoneNumber;
            playerAuth.setAuthInfo(key, token, ttl, function (setPlayerAuthErr) {
                if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                    player.token = token;
                    delete player.password;
                    playerResponse.status = errorCode.SUCCESS;
                    playerResponse.entity = player;
                    res.send(playerResponse);
                    res.end();
                } else {
                    playerResponse.status = errorCode.FAILED;
                    playerResponse.entity = null;
                    res.send(playerResponse);
                    res.end();
                }
            });
        } else {
            playerResponse.status = errorCode.FAILED;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        }
    });
};

exports.validateUserToken = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var token = req.body.token;

    var playerResponse = new PlayerResponse();
    playerLogic.verifyTokenWorkUnit(phoneNumber, token, function (validateTokenErr, token) {
        if (errorCode.SUCCESS.code !== validateTokenErr.code) { //不存在该token，
            logger.info("invalid id and token.");
            playerResponse.status = validateTokenErr;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        } else { //存在该id,token, 返回用户信息
            playerLogic.getPlayerByPhoneNumberWorkUnit(phoneNumber, function (getPlayerErr, players) {
                if (errorCode.SUCCESS.code === getPlayerErr.code && null !== players) {
                    var player = players[0];
                    player.token = token;
                    delete player.password;
                    playerResponse.status = errorCode.SUCCESS;
                    playerResponse.entity = player;
                    res.send(playerResponse);
                    res.end();
                } else {
                    playerResponse.status = errorCode.FAILED;
                    playerResponse.entity = null;
                    res.send(playerResponse);
                    res.end();
                }
            });
        }
    });
};
