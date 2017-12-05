/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var PlayerResponse = require('../responses/player_response');
var playerLogic = require('../work_units/player_logic');
var encrypt = require('../poem/crypto/encrypt');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();


exports.signup = function (req, res) {
    var player = req.body;

    var playerResponse = new PlayerResponse();
    playerLogic.registerWorkUnit(player, function (registerErr, player) {
        playerResponse.status = registerErr;
        if (registerErr.code === errorCode.SUCCESS.code && null != player) {
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
};


exports.login = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var password = req.body.password;

    var playerResponse = new PlayerResponse();
    playerLogic.getPlayerWorkUnit(phoneNumber, password, function (getUserErr, player) {
        if (getUserErr.code === errorCode.SUCCESS.code && null != player) {
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
};
