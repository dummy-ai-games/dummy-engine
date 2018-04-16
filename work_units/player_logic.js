/**
 * created by Dummy team
 * 2017-11-26
 */

require('../poem/configuration/constants');
var logger = require('../poem/logging/logger4js').helper;
var playerDao = require('../models/player_dao');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
var SmsSender = require('../poem/sms/sms_sender');

var PlayerAuth = require('../authentication/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);

var stringUtils = require('../poem/utils/string_utils.js');
var MD5 = require('../poem/crypto/md5');

exports.registerWorkUnit = function (player, callback) {
    var conditions = {
        phoneNumber: player.phoneNumber
    };
    playerDao.getPlayers(conditions, function (getPlayerErr, players) {
        if (getPlayerErr.code === errorCode.SUCCESS.code && players !== null && players.length > 0) {
            callback(errorCode.PLAYER_EXIST, null);
        } else {
            playerAuth.getAuthInfo(player.phoneNumber, function (getValueErr, verifyCode) {
                if (getValueErr.code === errorCode.SUCCESS.code &&
                    null !== verifyCode && verifyCode === player.smsCode) {
                    logger.info("verification code is right");
                    delete player.smsCode;
                    logger.info("player not exist, create a new one");
                    // completed player properties for multiple instance enhancement
                    player.status = 1;
                    player.instance = BASE_PORT + (stringUtils.getHashCode(player.phoneNumber, false) % MULTIPLE_INSTANCE);
                    playerDao.createPlayer(player, function (createPlayerErr, result) {
                        logger.info("create player result = " + JSON.stringify(createPlayerErr) + ", " + JSON.stringify(result));
                        if (errorCode.SUCCESS.code === createPlayerErr.code && null !== result.ops &&
                            result.ops.length > 0) {
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
                            playerAuth.setAuthInfo(key_token, value_phone, ttl, function (setPlayerAuthErr) {
                                if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                                    player.token = key_token;
                                    delete player.password;
                                    callback(setPlayerAuthErr, player);
                                } else {
                                    callback(setPlayerAuthErr, null);
                                }
                            });
                        } else {
                            callback(errorCode.FAILED, null);
                        }
                    });
                } else {
                    callback(errorCode.WRONG_VERIFICATION_CODE, null);
                }
            });
        }
    });
};

exports.getPlayerWorkUnit = function (phoneNumber, password, callback) {
    var conditions = {
        phoneNumber: phoneNumber,
        password: password
    };

    logger.info('getPlayer for communication : ' + JSON.stringify(conditions));

    playerDao.getPlayers(conditions, function (getPlayerErr, players) {
        if (errorCode.SUCCESS.code === getPlayerErr.code && null !== players && players.length > 0) {
            var player = players[0];
            callback(getPlayerErr, player);
        } else {
            callback(errorCode.FAILED, null);
        }
    });
};

exports.validatePlayerWorkUnit = function (phoneNumber, password, callback) {
    var conditions = {
        phoneNumber: phoneNumber,
        password: password
    };

    playerDao.getPlayers(conditions, function (getPlayerErr, players) {
        if (getPlayerErr.code === errorCode.SUCCESS.code && players !== null && players.length > 0) {
            var player = players[0];
            var token,
                ttl = 24 * 60 * 60 * 14,
                timeStamp;

            timeStamp = new Date().getTime();
            token = MD5.MD5(password + timeStamp);
            var keyToken = token;
            var valuePhoneNumber = player.phoneNumber;
            playerAuth.setAuthInfo(keyToken, valuePhoneNumber, ttl, function (setPlayerAuthErr) {
                if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                    player.token = keyToken;
                    delete player.password;
                    callback(errorCode.SUCCESS, player);
                } else {
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.info("player: " + phoneNumber + " not exist");
            callback(errorCode.PLAYER_NOT_EXIST, null);
        }
    });
};

exports.getPlayerByPhoneNumberWorkUnit = function (phoneNumber, callback) {
    var conditions = {
        phoneNumber: phoneNumber
    };
    playerDao.getPlayers(conditions, function (getPlayerErr, players) {
        if (getPlayerErr.code === errorCode.SUCCESS.code && players !== null && players.length > 0) {
            var player = players[0];
            callback(errorCode.SUCCESS, player);
        } else {
            logger.info("player : " + phoneNumber + " not exist");
            callback(errorCode.FAILED, null);
        }
    });
};

exports.verifyTokenWorkUnit = function (key, value, callback) {
    playerAuth.validateAuthInfo(key, value, function (validatePlayerAuthErr, result) {
        if (validatePlayerAuthErr.code !== errorCode.SUCCESS.code) {
            logger.info("token validation failed");
        }
        callback(validatePlayerAuthErr, result);
    });
};

exports.getPhoneNumberByTokenWorkUnit = function (token, callback) {
    playerAuth.getAuthInfo(token, function (getValueErr, value) {
        if (getValueErr.code !== errorCode.SUCCESS.code) {
            callback(getValueErr, null);
        } else {
            callback(getValueErr, value);
        }
    });
};

exports.sendSmsWorkUnit = function (phoneNumber, callback) {
    var verificationCode = stringUtils.genVerificationCode(0, 6);
    var ttl = 5 * 60;

    playerAuth.setAuthInfo(phoneNumber, verificationCode, ttl, function (setPlayerAuthErr) {
        if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
            var sender = new SmsSender(SMS_ACCESSKEY_ID, SMS_ACCESSKEY_SEC, SMS_SIGN_NAME, SMS_TEMP_NAME);
            sender.sendVerifyKey(phoneNumber, verificationCode, function (sendErr) {
                if (sendErr === errorCode.SUCCESS.code) {
                    logger.info("send verification code successfully");
                    callback(errorCode.SUCCESS);
                } else {
                    logger.info("send verification code failed");
                    callback(errorCode.FAILED);
                }
            });
        } else {
            callback(errorCode.FAILED);
        }
    });
};

exports.sendSmsForUpdateWorkUnit = function (phoneNumber, callback) {
    var conditions = {
        phoneNumber: phoneNumber
    };
    playerDao.getPlayers(conditions, function(getPlayerErr, players) {
        if (errorCode.SUCCESS.code === getPlayerErr.code && null != players && players.length > 0) {
            var verificationCode = stringUtils.genVerificationCode(0, 6);
            var ttl = 5 * 60;
            playerAuth.setAuthInfo(phoneNumber, verificationCode, ttl, function (setPlayerAuthErr) {
                if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                    var sender = new SmsSender(SMS_ACCESSKEY_ID, SMS_ACCESSKEY_SEC, SMS_SIGN_NAME, SMS_TEMP_NAME);
                    sender.sendVerifyKey(phoneNumber, verificationCode, function (sendErr) {
                        if (sendErr === errorCode.SUCCESS.code) {
                            logger.info("send verification code successfully");
                            callback(errorCode.SUCCESS);
                        } else {
                            logger.info("send verification code failed");
                            callback(errorCode.FAILED);
                        }
                    });
                } else {
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error("player: " + phoneNumber + " does not exist");
            callback(errorCode.PLAYER_NOT_EXIST);
        }
    });
};

exports.resetPasswordWorkUnit = function (phoneNumber, verificationCode, password, callback) {
    var conditions = {
        phoneNumber: phoneNumber
    };

    playerDao.getPlayers(conditions, function(getPlayerErr, players) {
        if (errorCode.SUCCESS.code === getPlayerErr.code && null != players && players.length > 0) {
            var player = players[0];
            playerAuth.getAuthInfo(player.phoneNumber, function (getValueErr, verifyCode) {
                if (getValueErr.code === errorCode.SUCCESS.code &&
                    null !== verifyCode && verifyCode === verificationCode) {
                    player.password = password;
                    playerDao.updatePlayer(conditions, player, function(updatePlayerErr) {
                        callback(updatePlayerErr);
                    });
                } else {
                    callback(errorCode.WRONG_VERIFICATION_CODE);
                }
            });

        } else {
            logger.error("player: " + phoneNumber + " not exist");
            callback(errorCode.PLAYER_NOT_EXIST);
        }
    });
};
