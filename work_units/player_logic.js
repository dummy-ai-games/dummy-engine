/**
 * created by Dummy team
 * 2017-11-26
 */

require('../poem/configuration/constants');
var logger = require('../poem/logging/logger4js').helper;
var playerDao = require('../models/player_dao');
var boardDao = require('../models/board_dao');
var tableDao = require('../models/table_dao');
var contestantDao = require('../models/contestant_dao');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

var Enums = require('../constants/enums.js');
var enums = new Enums();

var SmsSender = require('../poem/sms/sms_sender');

var PlayerAuth = require('../authentication/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);

var stringUtils = require('../poem/utils/string_utils.js');
var dateUtil = require('../poem/utils/date_utils');
var MD5 = require('../poem/crypto/md5');

var async = require('async');

// match related constants
var CONTESTANTS_MIN_ACTIVE = 1;
var PLAYER_PER_BOARD = 10;
var SHUFFLE_PLAYER_TIMES = 1000;
var PASSCODE_FETCH_TIME_MAX = 3;

var RETRY_SMS_MAX_TIMES = 5;

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

exports.getRandomDummyWorkUnit = function (callback) {
    var conditions = {
        role: 2
    };
    playerDao.getPlayers(conditions, function(getPlayersErr, players) {
        if (errorCode.SUCCESS.code === getPlayersErr.code && null != players && players.length > 0) {
            var randIndex = Math.floor((Math.random() * players.length));
            var player = players[randIndex];
            callback(errorCode.SUCCESS, player);
        } else {
            callback(errorCode.FAILED, null);
        }
    });
};

exports.tagPlayersWorkUnit = function(callback) {
    var playerStats = [];
    var taggedPlayers = 0;
    playerDao.getPlayers({ role : 0 }, function(getPlayersErr, players) {
        if (errorCode.SUCCESS.code === getPlayersErr.code && null !== players) {
            for (var i = 0; i < players.length; i++) {
                playerStats[i] = new Object();
                playerStats[i].player = players[i];
                playerStats[i].stats = 0;
                logger.info("constructed player stats for " + playerStats[i].player.name);
            }

            var conditions = {
                /*
                $or: [
                    {status: enums.GAME_STATUS_RUNNING},
                    {status: enums.GAME_STATUS_FINISHED},
                    {status: enums.GAME_STATUS_ENDED}
                ]
                */
            };
            boardDao.getBoards(conditions, function(getBoardsErr, boards) {
                if (errorCode.SUCCESS.code === getBoardsErr.code && null !== boards) {
                    // make stats according to board history
                    for (var i = 0; i < boards.length; i++) {
                        var board = boards[i];
                        var boardPlayers = board.currentPlayer;
                        findAndStatByCreator(playerStats, board.creator);
                        if (null !== boardPlayers) {
                            for (var j = 0; j < boardPlayers.length; j++) {
                                findAndStatByPlayerList(playerStats, boardPlayers[j]);
                            }
                        }
                    }
                    contestantDao.deleteContestant({role: 0}, function(clearContestantsErr) {
                        if (errorCode.SUCCESS.code === clearContestantsErr.code) {
                            async.eachSeries(playerStats, function (playerStat, innerCallback) {
                                var innerConditions = {
                                    role: 0,
                                    status: 1,
                                    phoneNumber: playerStat.player.phoneNumber
                                };
                                playerDao.getPlayers(innerConditions, function(getPlayersErr, players) {
                                    if (errorCode.SUCCESS.code === getPlayersErr.code &&
                                        null !== players && players.length > 0) {
                                        var contestant = players[0];
                                        var passwordPlain = stringUtils.genVerificationCode(0, 6);
                                        var passwordHash = MD5.MD5(passwordPlain);
                                        contestant.passwordPlain = passwordPlain;
                                        contestant.password = passwordHash;
                                        contestant.playerName = contestant.name;
                                        contestant.displayName = contestant.name;
                                        contestant.activeStats = playerStat.stats;
                                        contestantDao.createContestant(contestant, function(createContestantErr) {
                                            if (errorCode.SUCCESS.code === createContestantErr.code) {
                                                logger.info("player : " + contestant.phoneNumber +
                                                    " is tagged to contestant");
                                                taggedPlayers++;
                                                innerCallback();
                                            } else {
                                                logger.info("tag player : " + contestant.phoneNumber + " failed");
                                                innerCallback();
                                            }
                                        });
                                    } else {
                                        logger.info("search player : " + playerStat.player.phoneNumber + " failed");
                                        innerCallback();
                                    }
                                });
                            }, function (err) {
                                callback(errorCode.SUCCESS, taggedPlayers);
                            });
                        } else {
                            logger.error("clear contestants failed in tag players");
                            callback(errorCode.FAILED, 0);
                        }
                    });
                } else {
                    logger.error("get boards failed in tag players");
                    callback(errorCode.FAILED, 0);
                }
            });
        } else {
            logger.error("get players failed in tag players");
            callback(errorCode.FAILED, 0);
        }
    });
};

exports.groupingWorkUnit = function(callback) {
    /* IMPORTANT: this function must be called ONCE after contestants are tagged,
       and DO make sure only AI players are contained in collection contestant */

    // step 0: prepare data
    var playersInTable = [];
    var dummyAdded = 0;
    var contestantAdded = 0;
    var contestants = [];
    var allContestants = [];

    // step 1: get all AI contestants
    var conditions = {
        role: 0,
        status: 1,
        activeStats: { $gte: CONTESTANTS_MIN_ACTIVE }
    };
    contestantDao.getContestants(conditions, function(countContestantsErr, findContestants) {
        if (errorCode.SUCCESS.code === countContestantsErr.code) {
            contestants = findContestants;
            var contestantCount = contestants.length;
            logger.info("available constants contestantCount : " + contestantCount);

            // step 2: calculate how many tables would be hosted, how many dummies should be added
            var playerCount = PLAYER_PER_BOARD - (contestantCount % PLAYER_PER_BOARD) + contestantCount;
            var tableCount = playerCount / PLAYER_PER_BOARD;
            var robotCount = playerCount - contestantCount;

            // initialize added players contestantCount for each table slot
            for (var i = 0; i < tableCount; i++) {
                playersInTable[i] = 0;
            }

            // step3 : generate dummy players
            var dummies = [];
            for (var i = 0; i < robotCount; i++) {
                var passwordPlain = stringUtils.genVerificationCode(0, 6);
                var passwordHash = MD5.MD5(passwordPlain);
                var dummy = {
                    displayName: "Dummy" + i,
                    playerName: "Dummy" + i,
                    studentName: "Dummy" + i,
                    name: "Dummy" + i,
                    phoneNumber: "" + stringUtils.paddingNumber(i, 11),
                    passwordPlain: passwordPlain,
                    password: passwordHash,
                    role: 2,
                    status: 1,
                    university: 'Trend University',
                    activeStats: 0,
                };
                dummies.push(dummy);
            }
            contestantDao.deleteContestant({ role: 2 }, function(deleteContestantErr) {
                if (errorCode.SUCCESS.code === deleteContestantErr.code) {
                    logger.info("clear dummies successfully, re-create dummies");
                    var createDummySuccess = true;
                    async.eachSeries(dummies, function (dummy, innerCallback) {
                        contestantDao.createContestant(dummy, function(createContestantErr) {
                            if (errorCode.SUCCESS.code === createContestantErr.code) {
                                innerCallback();
                            } else {
                                createDummySuccess = false;
                                innerCallback();
                            }
                        });
                    }, function (err) {
                        if (createDummySuccess) {
                            logger.info("create dummies successfully, continue grouping");

                            // step 4: scatter dummies into different tables
                            var currentTable = 0;
                            while (dummyAdded < robotCount) {
                                if (playersInTable[currentTable] < PLAYER_PER_BOARD) {
                                    dummies[dummyAdded].tableNumber = currentTable + 1;
                                    allContestants.push(dummies[dummyAdded]);
                                    playersInTable[currentTable]++;
                                    dummyAdded++;
                                }
                                currentTable++;
                                if (currentTable >= tableCount) {
                                    currentTable = 0;
                                }
                            }

                            // step 5: shuffle contestants
                            shufflePlayers(contestants, SHUFFLE_PLAYER_TIMES);

                            // step 6: add contestants into each table
                            currentTable = 0;
                            while (contestantAdded < contestantCount) {
                                if (playersInTable[currentTable] < PLAYER_PER_BOARD) {
                                    contestants[contestantAdded].tableNumber = currentTable + 1;
                                    allContestants.push(contestants[contestantAdded]);
                                    playersInTable[currentTable]++;
                                    contestantAdded++;
                                }
                                currentTable++;
                                if (currentTable >= tableCount) {
                                    currentTable = 0;
                                }
                            }

                            // step 7: re-create tables
                            tableDao.clearTables(function(clearTablesErr) {
                                if (errorCode.SUCCESS.code === clearTablesErr.code) {
                                    logger.info("clear tables done, re-create tables");
                                    var newTables = [];
                                    for (var i = 0; i < tableCount; i++) {
                                        var date =
                                        newTables[i] = {
                                            tableNumber : (i + 1),
                                            gameName: "texas_holdem",
                                            minPlayer: 3,
                                            maxPlayer: 10,
                                            status: enums.GAME_STATUS_STANDBY,
                                            creator: 'dummy-engine',
                                            creatorName: 'dummy-engine',
                                            creatorRealName: 'dummy-engine',
                                            createTime: dateUtil.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss"),
                                            updateTime: dateUtil.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss"),
                                            ticket: stringUtils.randomChar(30),
                                            type: 0,
                                            port: MATCH_SERVER_PORT
                                        }
                                    }
                                    var createTablesSuccess = true;
                                    async.eachSeries(newTables, function (table, innerCallback) {
                                        tableDao.createTable(table, function(createTableError) {
                                            if (errorCode.SUCCESS.code === createTableError.code) {
                                                innerCallback();
                                            } else {
                                                createTablesSuccess = false;
                                                innerCallback();
                                            }
                                        });
                                    }, function (err) {
                                        if (createTablesSuccess) {
                                            // step 8: update contestants with table number
                                            logger.info("re-create tables successfully, " +
                                                "update contestants with tableNumber");
                                            var updateContestantsSuccess = true;
                                            async.eachSeries(allContestants, function (contestant, innerCallback) {
                                                contestantDao.updateContestant({phoneNumber: contestant.phoneNumber}, contestant, function(updateContestantErr) {
                                                    if (errorCode.SUCCESS.code === updateContestantErr.code) {
                                                        logger.info("contestant : " + contestant.phoneNumber + " has been grouped to table " + contestant.tableNumber);
                                                        innerCallback();
                                                    } else {
                                                        logger.error("contestant : " + contestant.phoneNumber + " failed to group");
                                                        updateContestantsSuccess = false;
                                                        innerCallback();
                                                    }
                                                });
                                            }, function (err) {
                                                if (updateContestantsSuccess) {
                                                    logger.info("grouping contestants all done!");
                                                    callback(errorCode.SUCCESS);
                                                } else {
                                                    logger.error("grouping contestants failed");
                                                    callback(errorCode.FAILED);
                                                }
                                            });
                                        } else {
                                            logger.error("create tables failed, abort grouping");
                                            callback(errorCode.FAILED);
                                        }
                                    });
                                } else {
                                    logger.error("clear tables failed, abort grouping");
                                    callback(errorCode.FAILED);
                                }
                            });
                        } else {
                            logger.error("create dummies failed, abort grouping");
                            callback(errorCode.FAILED);
                        }
                    });
                } else {
                    logger.error("clear dummies failed, abort grouping");
                    callback(errorCode.FAILED);
                }
            });
        } else {
            logger.error("get contestants failed, abort grouping");
            callback(errorCode.FAILED);
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

exports.getPlayerActiveStatsWorkUnit = function(callback) {
    var playerStats = [];
    playerDao.getPlayers({ role : 0 }, function(getPlayersErr, players) {
        if (errorCode.SUCCESS.code === getPlayersErr.code && null !== players) {
            for (var i = 0; i < players.length; i++) {
                playerStats[i] = new Object();
                playerStats[i].player = players[i];
                playerStats[i].stats = 0;
                logger.info("constructed player stats for " + playerStats[i].player.name);
            }

            var conditions = {
                /*
                $or: [
                    {status: enums.GAME_STATUS_RUNNING},
                    {status: enums.GAME_STATUS_FINISHED},
                    {status: enums.GAME_STATUS_ENDED}
                ]
                */
            };
            boardDao.getBoards(conditions, function(getBoardsErr, boards) {
                if (errorCode.SUCCESS.code === getBoardsErr.code && null !== boards) {
                    // make stats according to board history
                    for (var i = 0; i < boards.length; i++) {
                        var board = boards[i];
                        var boardPlayers = board.currentPlayer;
                        findAndStatByCreator(playerStats, board.creator);
                        if (null !== boardPlayers) {
                            for (var j = 0; j < boardPlayers.length; j++) {
                                findAndStatByPlayerList(playerStats, boardPlayers[j]);
                            }
                        }
                    }
                    callback(errorCode.SUCCESS, playerStats);
                } else {
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            callback(errorCode.FAILED, null);
        }
    });
};

exports.getContestantsWorkUnit = function(callback) {
    var conditions = {
        role: 0,
        status: 1,
        activeStats: { $gte: CONTESTANTS_MIN_ACTIVE }
    };
    contestantDao.getContestants(conditions, function(getContestantsErr, contestants) {
        if (null != contestants && contestants.length > 0) {
            for (var i = 0; i < contestants.length; i++) {
                contestants.password = '';
            }
        }
        callback(getContestantsErr, contestants);
    });
};

exports.getKanbanContestantsWorkUnit = function(tableNumber, callback) {
    var conditions = {
        status: 1,
        tableNumber: parseInt(tableNumber)
    };
    contestantDao.getContestants(conditions, function(getContestantsErr, contestants) {
        if (null != contestants && contestants.length > 0) {
            for (var i = 0; i < contestants.length; i++) {
                contestants.password = '';
            }
        }
        callback(getContestantsErr, contestants);
    });
};

exports.sendSmsWorkUnit = function (ip, phoneNumber, callback) {
    var verificationCode = stringUtils.genVerificationCode(0, 6);
    var ttl = 60;

    playerAuth.setAuthInfo(phoneNumber, verificationCode, ttl, function (setPlayerAuthErr) {
        if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
            var sender = new SmsSender(SMS_ACCESSKEY_ID, SMS_ACCESSKEY_SEC, SMS_SIGN_NAME);
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

exports.sendSmsForUpdateWorkUnit = function (ip, phoneNumber, callback) {
    var conditions = {
        phoneNumber: phoneNumber
    };
    playerDao.getPlayers(conditions, function(getPlayerErr, players) {
        if (errorCode.SUCCESS.code === getPlayerErr.code && null != players && players.length > 0) {
            var verificationCode = stringUtils.genVerificationCode(0, 6);
            var ttl = 60;
            playerAuth.setAuthInfo(phoneNumber, verificationCode, ttl, function (setPlayerAuthErr) {
                if (setPlayerAuthErr.code === errorCode.SUCCESS.code) {
                    var sender = new SmsSender(SMS_ACCESSKEY_ID, SMS_ACCESSKEY_SEC, SMS_SIGN_NAME);
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

exports.sendMatchSmsWorkUnit = function(callback) {
    var conditions = {
        role: 0,
        status: 1,
        activeStats: { $gte: CONTESTANTS_MIN_ACTIVE }
    };
    contestantDao.getContestants(conditions, function(getContestantsErr, contestants) {
        if (errorCode.SUCCESS.code === getContestantsErr.code && null !== contestants && contestants.length > 0) {
            var phoneNumbers = [];
            var sendCodes = [];
            var signNames = [];
            for (var i = 0; i < contestants.length; i++) {
                var contestant = contestants[i];
                phoneNumbers.push(contestant.phoneNumber);
                signNames.push(SMS_SIGN_NAME);
                sendCodes.push({
                    code: contestant.passwordPlain
                });
            }

            var sender = new SmsSender(SMS_ACCESSKEY_ID, SMS_ACCESSKEY_SEC, SMS_SIGN_NAME);
            sender.sendMatchNotices(JSON.stringify(phoneNumbers), JSON.stringify(signNames),
                JSON.stringify(sendCodes), function(sendMatchNoticeErr) {
                if (errorCode.SUCCESS.code === sendMatchNoticeErr) {
                    logger.info("send sms successfully");
                } else {
                    logger.info("send sms failed");
                }
            });
            callback(errorCode.SUCCESS);
        } else {
            logger.info("get contestants failed, do not send match notification sms");
            callback(errorCode.FAILED);
        }
    });
};

exports.fetchPasscodeWorkUnit = function(phoneNumber, callback) {
    var conditions = {
        phoneNumber: phoneNumber,
        role: 0,
        status: 1
    };
    contestantDao.getContestants(conditions, function(getContestantsErr, contestants) {
        if (errorCode.SUCCESS.code === getContestantsErr.code && null !== contestants && contestants.length > 0) {
            var contestant = contestants[0];
            if (contestant.activeStats >= CONTESTANTS_MIN_ACTIVE) {
                if (!contestant.passcodeFetched || contestant.passcodeFetched < PASSCODE_FETCH_TIME_MAX) {
                    var sender = new SmsSender(SMS_ACCESSKEY_ID, SMS_ACCESSKEY_SEC, SMS_SIGN_NAME);
                    sender.sendMatchNotice(phoneNumber, contestant.passwordPlain, function (sendErr) {
                        if (sendErr === errorCode.SUCCESS.code) {
                            logger.info("send passcode successfully for : " + phoneNumber);
                            if (undefined === contestant.passcodeFetched || null === contestant.passcodeFetched) {
                                contestant.passcodeFetched = 1;
                            } else {
                                contestant.passcodeFetched++;
                            }

                            contestantDao.updateContestant(conditions, contestant, function(updateContestantErr) {
                                logger.info("contestant passcode fetched updated to " + contestant.passcodeFetched +
                                    " : " + updateContestantErr.code);
                                callback(errorCode.SUCCESS);
                            });

                        } else {
                            logger.info("send passcode failed for : " + phoneNumber);
                            callback(errorCode.FAILED);
                        }
                    });
                } else {
                    logger.info("contestant : " + phoneNumber + " has been fetched passcode more than 3 times");
                    callback(errorCode.FETCH_PASSCODE_EXCEEDED_LIMIT);
                }
            } else {
                logger.info("contestant : " + phoneNumber + " is not active, do not fetch passcode for him");
                callback(errorCode.USER_NOT_ACTIVE);
            }
        } else {
            logger.info("contestant : " + phoneNumber + " does not exist");
            callback(errorCode.FAILED);
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

// helper function
function findAndStatByPlayerList(playerStats, player) {
    if (null !== playerStats) {
        for (var i = 0; i < playerStats.length; i++) {
            if (null !== playerStats[i].player &&
                playerStats[i].player.name === player.playerName) {
                if (undefined === playerStats[i].stats || null === playerStats[i].stats) {
                    playerStats[i].stats = 1;
                } else {
                    playerStats[i].stats++;
                }
                return playerStats;
            }
        }
    }
    return playerStats;
}

function findAndStatByCreator(playerStats, creator) {
    if (null !== playerStats) {
        for (var i = 0; i < playerStats.length; i++) {
            if (null !== playerStats[i].player &&
                playerStats[i].player.phoneNumber === creator) {
                if (undefined === playerStats[i].stats || null === playerStats[i].stats) {
                    playerStats[i].stats = 1;
                } else {
                    playerStats[i].stats++;
                }
                return playerStats;
            }
        }
    }
    return playerStats;
}

function shufflePlayers(players, shuffleTimes) {
    var playersCount = players.length;
    for (var times = 0; times < shuffleTimes; times++) {
        var rand1 = stringUtils.randomDigital(playersCount);
        var rand2 = stringUtils.randomDigital(playersCount);
        var tempPlayer = players[rand1];
        players[rand1] = players[rand2];
        players[rand2] = tempPlayer;
    }
}
