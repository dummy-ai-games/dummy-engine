/**
 * Created by Elsie
 * 2017-12-01
 */

var logger = require('../poem/logging/logger4js').helper;
var boardDao = require('../models/board_dao');
var gameDao = require('../models/game_dao');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();
var stringUtil = require('../poem/utils/string_utils');
var dateUtil = require('../poem/utils/date_utils');


exports.createBoardWorkUnit = function (creator, gameName, callback) {
    var currentTime = dateUtil.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss");
    var ticket = stringUtil.randomChar(30);

    // 该游戏存在于 tb_game 时, create一个board实例
    gameDao.getGameInfo({name: gameName}, function (getGameErr, game) {
        logger.info(getGameErr.code);
        logger.info(game);
        if (getGameErr.code == errorCode.SUCCESS.code && game != null && game.length > 0) {
            var board = {
                gameName: gameName,
                minPlayer: game[0].minPlayer,
                maxPlayer: game[0].maxPlayer,
                currentPlayer: [creator],
                status: 0,
                creator: creator,
                createTime: currentTime,
                updateTime: currentTime,
                ticket: ticket,
                type: 0
            };
            boardDao.createBoard(board, function (createBoardErr, board) {
                if (createBoardErr.code == errorCode.SUCCESS.code) {
                    logger.info("create board succeed.")
                    callback(createBoardErr, board);
                } else {
                    logger.info("create board failed.")
                    callback(errorCode.FAILED, null);
                }
            });
        } else {
            logger.info('get game info failed.');
            callback(errorCode.FAILED, null);
        }
    });
};


exports.updateBoardWorkUnit = function (ticket, gameName, newBoard, callback) {
    var condition = {
        ticket: ticket,
        gameName: gameName
    };
    var newBoard = {
        currentPlayer: newBoard.currentPlayer,
        status: parseInt(newBoard.status),
        updateTime: newBoard.updateTime,
        type: parseInt(newBoard.type)
    };
    logger.info(newBoard.currentPlayer);
    logger.info(newBoard.status);
    logger.info(newBoard.updateTime);
    logger.info(newBoard.type);

    boardDao.updateBoard(condition, newBoard, function(updateBoardErr, board){
        if(updateBoardErr.code == errorCode.SUCCESS.code){
            logger.info("update board by ticket:"+ticket+",gameName:"+gameName+" succeed.");
            callback(updateBoardErr, board);
        }else{
            logger.info("update board by ticket:"+ticket+",gameName:"+gameName+" failed.");
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
exports.getBoardByTicketWorkUnit = function (ticket, gameName, callback) {
    var condition = {
        ticket: ticket,
        gameName: gameName
    };
    boardDao.getBoard(condition, function (getBoardErr, board) {
        if (getBoardErr.code === errorCode.SUCCESS.code && board != null && board.length > 0) {
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
        if (getBoardErr.code === errorCode.SUCCESS.code && boards != null && boards.length > 0) {
            logger.info("query board list: " + condition + " succeed");
            callback(getBoardErr, boards); //
        } else {
            // board not exist
            logger.error("query board list:" + condition + " failed.");
            callback(errorCode.FAILED, null);
        }
    });
};
