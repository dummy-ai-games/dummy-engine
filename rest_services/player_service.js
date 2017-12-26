/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var PlayerResponse = require('../responses/player_response');
var playerLogic = require('../work_units/player_logic');
var encrypt = require('../poem/crypto/encrypt');
var string_utils = require('../poem/utils/string_utils');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
var StringResponse = require('../responses/string_response');
var ServiceResponse = require('../responses/service_response');
var PlayerAuth = require('../authority/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);

var MD5 = require('../poem/crypto/md5.js');


exports.signup = function (req, res) {
    var player = req.body;

    var playerResponse = new PlayerResponse();

    // check if verificationCode is right
    playerAuth.getAuthInfo(player.phoneNumber,function(getValueErr, verifyCode){
        if (getValueErr.code === errorCode.SUCCESS.code && null !== verifyCode && verifyCode === player.smsCode){
            //验证码正确，允许注册
            logger.info("verification code is right");
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
                    key = player.phoneNumber;

                    var key_token = token;
                    var value_phone = key;
                    // 将(token, phoneNumber)作为键值对
                    playerAuth.setAuthInfo(key_token, value_phone, ttl, function (setPlayerAuthErr) {
                        if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                            player.token = key_token;
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
        }else{
            //验证码不对
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
            key = player.phoneNumber;

            var key_token = token;
            var value_phone = key;
            //将(token, phoneNumber) 作为键值对，存入redis
            playerAuth.setAuthInfo(key_token, value_phone, ttl, function (setPlayerAuthErr) {
                if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                    player.token = key_token;
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
    var key_token = req.body.token;


    var playerResponse = new PlayerResponse();
    playerLogic.verifyTokenWorkUnit(key_token, phoneNumber, function (validateTokenErr, result) {
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
                    player.token = key_token;
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

/**
 * get phoneNumber by token
 * @param req
 * @param res
 */
exports.getPhoneNumberByToken = function (req, res) {
    var token = req.body.token;

    var stringResponse = new StringResponse();
    playerLogic.getPhoneNumberByTokenWorkUnit(token, function (getPhoneErr, phone) {
        stringResponse.status = getPhoneErr;
        if (getPhoneErr.code !== errorCode.SUCCESS.code) {
            logger.info("get phoneNumber by token err" + getPhoneErr);
            stringResponse.entity = null;
        } else {
            logger.info("get phoneNumber by token succeed: " + phone);
            stringResponse.entity = phone;
        }
        res.send(stringResponse);
        res.end();
    });
};


exports.sendSms = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var verificationCode = string_utils.genVerificationCode(0,6) //生成6位数字验证码
    var ttl = 5 * 60;
    var serviceResponse = new ServiceResponse();
    // 将(phoneNumber, verificationCode)作为键值对,存入redis，有效期5min
    playerAuth.setAuthInfo(phoneNumber, verificationCode, ttl, function (setPlayerAuthErr) {
        if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
            logger.info("save verificationCode to redis succeed.");
            // begin send message
            playerLogic.sendVerifyKeyWorkUnit(phoneNumber,verificationCode, function (sendErr) {
                console.log(JSON.stringify(sendErr));
                if (sendErr === errorCode.SUCCESS.code) {
                    logger.info("send message succeed in player_service");
                    serviceResponse.cause = "send message succeed";
                } else {
                    logger.info("send message fail in player_service.");
                    serviceResponse.cause = "send message fail";
                }
                serviceResponse.status = sendErr;
                res.send(serviceResponse);
                res.end();
            });
        } else {
            logger.info("save verificationCode to redis fail.");
            serviceResponse.status = setPlayerAuthErr;
            serviceResponse.cause = "send message fail";
            res.send(serviceResponse);
            res.end();
        }
     });
};

