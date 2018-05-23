/**
 * created by Dummy team
 * 2017-11-26
 */

var PlayerResponse = require('../responses/player_response');
var PlayersResponse = require('../responses/players_response');
var ActiveStatsResponse = require('../responses/active_stats_response');

var playerLogic = require('../work_units/player_logic');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
var ServiceResponse = require('../responses/service_response');
var IntegerResponse = require('../responses/integer_response');
var PlayerAuth = require('../authentication/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);

var logger = require('../poem/logging/logger4js').helper;

exports.signUp = function (req, res) {
    var player = req.body;
    var playerResponse = new PlayerResponse();

    playerLogic.registerWorkUnit(player, function (registerErr, player) {
        playerResponse.status = registerErr;
        playerResponse.entity = player;
        res.send(playerResponse);
        res.end();
    });
};

exports.signIn = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var password = req.body.password;

    var playerResponse = new PlayerResponse();
    playerLogic.validatePlayerWorkUnit(phoneNumber, password, function (getPlayerErr, player) {
        playerResponse.status = getPlayerErr;
        playerResponse.entity = player;
        res.send(playerResponse);
        res.end();
    });
};

exports.validateSignIn = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var token = req.body.token;

    var playerResponse = new PlayerResponse();
    playerLogic.verifyTokenWorkUnit(token, phoneNumber, function (validateTokenErr, result) {
        if (errorCode.SUCCESS.code !== validateTokenErr.code) {
            playerResponse.status = validateTokenErr;
            playerResponse.entity = null;
            res.send(playerResponse);
            res.end();
        } else {
            playerLogic.getPlayerByPhoneNumberWorkUnit(phoneNumber, function (getPlayerErr, player) {
                if (errorCode.SUCCESS.code === getPlayerErr.code && null !== player) {
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

exports.getPlayerByToken = function (req, res) {
    var token = req.body.token;

    var playerResponse = new PlayerResponse();
    playerLogic.getPhoneNumberByTokenWorkUnit(token, function (getPhoneNumberErr, phoneNumber) {
        if (getPhoneNumberErr.code !== errorCode.SUCCESS.code) {
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

exports.getRandomDummy = function (req, res) {
    var playerResponse = new PlayerResponse();
    playerLogic.getRandomDummyWorkUnit(function (getRandomDummyErr, dummy) {
        playerResponse.status = getRandomDummyErr;
        playerResponse.entity = dummy;
        res.send(playerResponse);
        res.end();
    });
};

exports.tagPlayersToMatch = function (req, res) {
    var adminPassword = req.query.password;

    var integerResponse = new IntegerResponse();

    if (adminPassword !== 'ghostcicy') {
        integerResponse.status = errorCode.FAILED;
        integerResponse.entity = 0;
        res.send(integerResponse);
        res.end();
    } else {
        playerLogic.tagPlayersWorkUnit(function (tagPlayersErr, tagedPlayersCount) {
            integerResponse.status = tagPlayersErr;
            integerResponse.entity = tagedPlayersCount;
            res.send(integerResponse);
            res.end();
        });
    }
};

exports.grouping = function (req, res) {
    var adminPassword = req.query.password;
    var serviceResponse = new ServiceResponse();

    if (adminPassword !== 'ghostcicy') {
        serviceResponse.status = errorCode.FAILED;
        res.send(serviceResponse);
        res.end();
    } else {
        playerLogic.groupingWorkUnit(function (groupingErr) {
            serviceResponse.status = groupingErr;
            res.send(serviceResponse);
            res.end();
        });
    }
};

exports.playerActiveStats = function (req, res) {
    var activeStatsResponse = new ActiveStatsResponse();
    playerLogic.getPlayerActiveStatsWorkUnit(function (getPlayerActiveStatsErr, playerActiveStats) {
        activeStatsResponse.status = getPlayerActiveStatsErr;
        activeStatsResponse.entity = playerActiveStats;
        res.send(activeStatsResponse);
        res.end();
    });
};

exports.getContestants = function (req, res) {
    var adminPassword = req.query.password;
    var playersResponse = new PlayersResponse();

    if (adminPassword !== 'ghostcicy') {
        playersResponse.status = errorCode.FAILED;
        playersResponse.entity = null;
        res.send(playersResponse);
        res.end();
    } else {
        playerLogic.getContestantsWorkUnit(function (getContestantsErr, contestants) {
            playersResponse.status = getContestantsErr;
            playersResponse.entity = contestants;
            res.send(playersResponse);
            res.end();
        });
    }

};

exports.getKanbanContestants = function (req, res) {
    var tableNumber = req.query.table_number;

    var playersResponse = new PlayersResponse();
    playerLogic.getKanbanContestantsWorkUnit(tableNumber, function (getContestantsErr, contestants) {
        playersResponse.status = getContestantsErr;
        // a little tweak on response data
        playersResponse.entity = {
            tableNumber: tableNumber,
            contestants: contestants
        };
        res.send(playersResponse);
        res.end();
    });
};

exports.sendSms = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var serviceResponse = new ServiceResponse();
    playerLogic.sendSmsWorkUnit(ip, phoneNumber, function(sendSmsErr) {
        serviceResponse.status = sendSmsErr;
        res.send(serviceResponse);
        res.end();
    });
};

exports.sendSmsForUpdate = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var serviceResponse = new ServiceResponse();

    logger.info('send sms for update request');
    playerLogic.sendSmsForUpdateWorkUnit(ip, phoneNumber, function(sendSmsErr) {
        serviceResponse.status = sendSmsErr;
        res.send(serviceResponse);
        res.end();
    });
};

exports.sendMatchSms = function (req, res) {
    var serviceResponse = new ServiceResponse();
    playerLogic.sendMatchSmsWorkUnit(function (sendMatchSmsErr) {
        serviceResponse.status = sendMatchSmsErr;
        res.send(serviceResponse);
        res.end();
    });
};

exports.fetchPasscode = function (req, res) {
    var phoneNumber = req.headers["phone-number"] || req.body.phoneNumber;
    var token = req.headers["token"] || req.body.token;

    var serviceResponse = new ServiceResponse();
    playerLogic.fetchPasscodeWorkUnit(phoneNumber, function (fetchPasscodeErr) {
        serviceResponse.status = fetchPasscodeErr;
        res.send(serviceResponse);
        res.end();
    });
};

exports.signOut = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var token = req.body.token;

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
            serviceResponse.status = errorCode.FAILED;
            res.send(serviceResponse);
            res.end();
        }
    });
};

exports.resetPassword = function (req, res) {
    var phoneNumber = req.body.phoneNumber;
    var verificationCode = req.body.verificationCode;
    var password = req.body.password;

    var serviceResponse = new ServiceResponse();
    playerLogic.resetPasswordWorkUnit(phoneNumber, verificationCode, password, function(resetPasswordErr) {
        serviceResponse.status = resetPasswordErr;
        res.send(serviceResponse);
        res.end();
    });
};
