/**
 * created by Dummy team
 * 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var PlayerResponse = require('../responses/player_response');
var playerLogic = require('../work_units/player_logic');
var encrypt = require('../poem/crypto/encrypt');
var stringUtils = require('../poem/utils/string_utils');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
var StringResponse = require('../responses/string_response');
var ServiceResponse = require('../responses/service_response');
var PlayerAuth = require('../authentication/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);

var MD5 = require('../poem/crypto/md5.js');

/**
 * player sign up
 * @param req
 * @param res
 */
exports.signup = function (req, res) {
    var player = req.body;

    var playerResponse = new PlayerResponse();

    // check if verificationCode is right
    playerAuth.getAuthInfo(player.phoneNumber, function (getValueErr, verifyCode) {
        if (getValueErr.code === errorCode.SUCCESS.code && null !== verifyCode && verifyCode === player.smsCode) {
            //验证码正确，允许注册
            logger.info("verification code is right");
            delete player.smsCode; //删除player的smsCode属性
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
                }else if(registerErr.code === errorCode.PLAYER_EXIST.code){
                    playerResponse.status = errorCode.PLAYER_EXIST;
                    playerResponse.entity = null;
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
            //验证码不对
            playerResponse.status = errorCode.WRONG_VERIFICATION_CODE;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        }
    });
};


/**
 * player login
 * @param req
 * @param res
 */
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
            playerResponse.status = errorCode.LOGIN_FAILURE;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        }
    });
};


/**
 * validate user token
 * @param req
 * @param res
 */
exports.validateUserToken = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var key_token = req.body.token;

    logger.info('check if user logged in : ' + phoneNumber + ', ' + key_token);
    var playerResponse = new PlayerResponse();
    playerLogic.verifyTokenWorkUnit(key_token, phoneNumber, function (validateTokenErr, result) {
        if (errorCode.SUCCESS.code !== validateTokenErr.code) {
            logger.info("invalid id and token.");
            playerResponse.status = validateTokenErr;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        } else { //存在该id, token, 返回用户信息
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
 * get player by token
 * @param req
 * @param res
 */
exports.getPlayerByToken = function (req, res) {
    var token = req.body.token;

    var playerResponse = new PlayerResponse();
    playerLogic.getPhoneNumberByTokenWorkUnit(token, function (getPhoneNumberErr, phoneNumber) {
        if (getPhoneNumberErr.code !== errorCode.SUCCESS.code) {
            logger.info("get phoneNumber by token err" + getPhoneNumberErr);
            playerResponse.status = errorCode.FAILED;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        } else {
            playerLogic.getPlayerByPhoneNumberWorkUnit(phoneNumber, function(getPlayerErr, players) {
                if (getPlayerErr.code === errorCode.SUCCESS.code && null != players && players.length > 0) {
                    playerResponse.status = errorCode.SUCCESS;
                    playerResponse.entity = players[0];
                } else {
                    playerResponse.status = errorCode.FAILED;
                    playerResponse.entity = null;
                }

                res.send(playerResponse);
                res.end();
            });
        }
    });
};

/**
 * send SMS
 * @param req
 * @param res
 */
exports.sendSms = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var verificationCode = stringUtils.genVerificationCode(0, 6);
    var ttl = 5 * 60;
    var serviceResponse = new ServiceResponse();
    playerAuth.setAuthInfo(phoneNumber, verificationCode, ttl, function (setPlayerAuthErr) {
        if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
            logger.info("save verificationCode to redis succeed.");
            // begin send message
            playerLogic.sendVerifyKeyWorkUnit(phoneNumber, verificationCode, function (sendErr) {
                serviceResponse.status = sendErr;
                res.send(serviceResponse);
                res.end();
            });
        } else {
            logger.info("save verificationCode to redis fail.");
            serviceResponse.status = setPlayerAuthErr;
            res.send(serviceResponse);
            res.end();
        }
    });
};

/**
 * sign player out
 * @param req
 * @param res
 */
exports.signOut = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var token = req.body.token;

    logger.info("sign out for " + phoneNumber + ", " + token);
    var serviceResponse = new ServiceResponse();
    playerAuth.deleteAuthInfo(phoneNumber, function (deletePhoneNumberErr) {
        if (deletePhoneNumberErr.code === errorCode.SUCCESS.code) {
            logger.info("phone Number " + phoneNumber + " as key deleted");
            playerAuth.deleteAuthInfo(token, function (deleteTokenErr) {
                if (deleteTokenErr.code === errorCode.SUCCESS.code) {
                    logger.info("token " + token + " as key deleted");
                } else {
                    logger.warn("token " + token + " as key delete failed");
                }
                serviceResponse.status = errorCode.SUCCESS;
                res.send(serviceResponse);
                res.end();
            });
        } else {
            logger.error("phone Number " + phoneNumber + " as key delete failed");
            serviceResponse.status = errorCode.FAILED;
            res.send(serviceResponse);
            res.end();
        }
    });
};
