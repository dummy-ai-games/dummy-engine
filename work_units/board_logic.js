/**
 * Created by Elsie
 * 2017-12-01
 */

require('../poem/configuration/constants');
var logger = require('../poem/logging/logger4js').helper;
var boardDao = require('../models/board_dao');
var gameDao = require('../models/game_dao');
var playerDao = require('../models/player_dao');

var stringUtil = require('../poem/utils/string_utils');
var dateUtil = require('../poem/utils/date_utils');
var commonUtil = require('../poem/utils/common_utils');

var PlayerAuth = require('../authentication/player_auth.js');
var playerAuth = new PlayerAuth(REDIS_HOST, REDIS_PORT, null, REDIS_PASSWORD);

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

var Enums = require('../constants/enums.js');
var enums = new Enums();


exports.createBoardWorkUnit = function (creatorPhoneNumber, gameName, callback) {
    var currentTime = dateUtil.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss");
    var ticket = stringUtil.randomChar(30);

    // query create name from tb: players
    var playerCon = {
        phoneNumber: creatorPhoneNumber,
        status: 1
    };
    playerDao.getPlayer(playerCon, function (getPlayerErr, players) {

        if (getPlayerErr.code === errorCode.SUCCESS.code && null !== players && players.length > 0) {
            var port = players[0].instance;
            var creatorName = players[0].name;
            logger.info('creator phoneNumber = ' + creatorPhoneNumber);
            logger.info('creator name = ' + creatorName);
            gameDao.getGameInfo({name: gameName}, function (getGameErr, game) { // game != nulls
                if (getGameErr.code === errorCode.SUCCESS.code && game !== null && game.length > 0) {
                    var getBoardConditions = {
                        creator: creatorPhoneNumber,
                        gameName: gameName,
                        $or: [
                            {status: enums.GAME_STATUS_STANDBY},
                            {status: enums.GAME_STATUS_PREPARING},
                            {status: enums.GAME_STATUS_RUNNING}
                        ]
                    };
                    boardDao.getBoard(getBoardConditions, function (getBoardErr, boards) {
                        // get board info by {creator, gameName}
                        if (errorCode.SUCCESS.code === getBoardErr.code) { // get board succeed
                            if (boards === null || boards.length === 0) {
                                // create board
                                var board = {
                                    gameName: gameName,
                                    minPlayer: game[0].minPlayer,
                                    maxPlayer: game[0].maxPlayer,
                                    currentPlayer: [],
                                    status: 0,
                                    creator: creatorPhoneNumber,
                                    creatorName: creatorName,
                                    createTime: currentTime,
                                    updateTime: currentTime,
                                    ticket: ticket,
                                    type: 0,
                                    port: port
                                };
                                boardDao.createBoard(board, function (createBoardErr, result) {
                                    if (createBoardErr.code === errorCode.SUCCESS.code && null !== result.ops &&
                                        result.ops.length > 0) {
                                        logger.info("create board succeed.");
                                        callback(createBoardErr, board);
                                    } else {
                                        logger.info("create board failed.");
                                        callback(errorCode.FAILED, null);
                                    }
                                });
                            } else {
                                // creator cannot create multiple board that status is preparing(0) or active(1)
                                var board = boards[0];
                                logger.info("a creator can't create multiple active boards");
                                callback(errorCode.MULTI_ACTIVE_BOARD_CREATED, board);
                            }
                        } else { // get board failed
                            logger.info('get board failed.');
                            callback(errorCode.FAILED, null);
                        }
                    });
                } else { // get game failed
                    logger.info('get game failed');
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.info("get player failed, or an unregistered player is trying to create board");
            callback(errorCode.FAILED, null);
        }
    });
};

exports.updateBoardWorkUnit = function (ticket, gameName, newBoard, callback) {
    var date = dateUtil.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss");
    var condition = {
        ticket: ticket,
        gameName: gameName
    };
    var newBoard = {
        currentPlayer: newBoard.currentPlayer,
        status: parseInt(newBoard.status),
        updateTime: date,
        type: parseInt(newBoard.type)
    };

    logger.info("board currentPlayer:" + JSON.stringify(newBoard.currentPlayer));
    logger.info("board status:" + newBoard.status);
    logger.info("board update time:" + newBoard.updateTime);
    logger.info("board type:" + newBoard.type);

    boardDao.updateBoard(condition, newBoard, function (updateBoardErr, board) {
        if (updateBoardErr.code === errorCode.SUCCESS.code) {
            logger.info("update board by ticket:" + ticket + ",gameName:" + gameName + " succeed.");
            callback(updateBoardErr, newBoard);
        } else {
            logger.info("update board by ticket:" + ticket + ",gameName:" + gameName + " failed.");
            callback(errorCode.FAILED, null);
        }
    });
};

/**
 * get board instance by ticket, gameName
 * @param ticket: unique id for a board
 * @param callback: callback(errorCode.SUCCESS, board)
 *                  callback(errorCode.FAILED, null)
 */
exports.getBoardByTicketWorkUnit = function (ticket, gameName, port, callback) {
    var condition = {
        ticket: ticket,
        gameName: gameName,
        port: port
    };
    boardDao.getBoard(condition, function (getBoardErr, board) {
        if (getBoardErr.code === errorCode.SUCCESS.code && board !== null && board.length > 0) {
            logger.info("the board that ticket = " + ticket + " exist in db");
            callback(getBoardErr, board);
        } else {
            // board not exist
            logger.info("board that ticket = : " + ticket + " not exist in db.");
            callback(errorCode.FAILED, null);
        }
    });
};

/**
 * list boards by status, gameName
 * @param status: 0-准备中，1-进行中，2-结束
 * @param gameName: game name
 * @param callback: callback(errorCode.SUCCEED, board)
 *                  callback(errorCode.FAILED, null);
 */
exports.listBoardsWorkUnit = function (status, gameName, callback) {
    var condition = {
        status: parseInt(status),
        gameName: gameName
    };
    boardDao.getBoard(condition, function (getBoardErr, boards) {
        if (getBoardErr.code === errorCode.SUCCESS.code && boards !== null && boards.length > 0) {
            logger.info("query board list: " + JSON.stringify(condition) + " succeed");
            callback(getBoardErr, boards); //
        } else {
            // board not exist
            logger.error("query board list:" + JSON.stringify(condition) + " failed.");
            callback(errorCode.FAILED, null);
        }
    });
};

/**
 * list active boards by gameName
 * @param gameName: game name
 * @param callback: callback(errorCode.SUCCEED, board)
 *                  callback(errorCode.FAILED, null);
 */
exports.listActiveBoardsWorkUnit = function (gameName, from, count, searchName, callback) {
    var conditions = null;

    if (searchName) {
        conditions = {
            gameName: gameName,
            $or: [
                {status: enums.GAME_STATUS_STANDBY},
                {status: enums.GAME_STATUS_PREPARING},
                {status: enums.GAME_STATUS_RUNNING}
            ],
            $or: [
                {creator: searchName},
                {creatorName: searchName}
            ]
        };
    } else {
        conditions = {
            gameName: gameName,
            $or: [
                {status: enums.GAME_STATUS_STANDBY},
                {status: enums.GAME_STATUS_PREPARING},
                {status: enums.GAME_STATUS_RUNNING}
            ]
        };
    }

    boardDao.listBoards(conditions, from, count, function (getBoardErr, boards) {
        if (getBoardErr.code === errorCode.SUCCESS.code && boards !== null) {
            logger.info("query board list: " + JSON.stringify(conditions) + " succeed");
            callback(getBoardErr, boards);
        } else {
            // board not exist
            logger.error("query board list:" + JSON.stringify(conditions) + " failed.");
            callback(errorCode.FAILED, null);
        }
    });
};

exports.isCreatorBoardWorkUnit = function (token, ticket, callback) {
    playerAuth.getAuthInfo(token, function (getValueErr, value) {
        if (getValueErr.code !== errorCode.SUCCESS.code) {
            callback(getValueErr, null);
        } else {
            var conditions = {
                creator: value,
                ticket: ticket,
                $or: [
                    {status: enums.GAME_STATUS_STANDBY},
                    {status: enums.GAME_STATUS_PREPARING},
                    {status: enums.GAME_STATUS_RUNNING}
                ]
            };
            boardDao.getBoard(conditions, function (getBoardErr, boards) {
                logger.info("getBoardErr = " + JSON.stringify(getBoardErr) + ", boards = " + JSON.stringify(boards));
                if (errorCode.SUCCESS.code === getBoardErr.code && null !== boards && boards.length > 0) {
                    var board = boards[0];
                    callback(errorCode.SUCCESS, true);
                } else {
                    callback(errorCode.SUCCESS, false);
                }
            });
        }
    });
};
