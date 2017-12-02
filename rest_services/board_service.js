/**
 * created by Elsie
 * 2017-12-02
 */

var logger = require('../poem/logging/logger4js').helper;
var BoardResponse = require('../responses/board_response');
var boardLogic = require('../work_units/board_logic');

/**
 * create a new board instance by creator with phoneNumber, gameName
 * @param req
 * @param res
 */
exports.createBoard = function (req, res) {
    var creator = req.body.phoneNumber;
    var gameName = req.body.game_name;

    var boardResponse = new BoardResponse();
    boardLogic.createBoardWorkUnit(creator, gameName, function (createBoardErr, board) {
        boardResponse.status = createBoardErr;
        boardResponse.entity = board;
        res.send(boardResponse);
        res.end();
    });
};


/**
 * update a board by ticket and new board value
 * @param req
 * @param res
 */
exports.updateBoard = function (req, res) {
    var ticket = res.body.ticket;
    var newBoard = res.body.new_board;

    var boardResponse = new BoardResponse();
    boardLogic.updateBoardWorkUnit(ticket, newBoard, function (updateBoardErr, board) {
        boardResponse.status = updateBoardErr;
        boardResponse.entity = board;
        res.send(boardResponse);
        res.end();
    });
};


/**
 * list boards by status, gameName
 * @param req
 * @param res
 */
exports.listBoards = function (req, res) {
    var status = req.body.status;
    var gameName = req.body.game_name;

    var boardResponse = new BoardResponse();
    boardLogic.listBoardsWorkUnit(status, gameName, function (listBoardsErr, boards) {
        boardResponse.status = listBoardsErr;
        boardResponse.entity = boards;
        res.send(boardResponse);
        res.end();
    });
};


// for testing
/*
exports.getBoardByTicket = function (req,res){
    var ticket = req.body.ticket;
    var gameName = req.body.game_name;

    var boardResponse = new BoardResponse();
    boardLogic.getBoardByTicketWorkUnit(ticket,gameName, function (getBoardErr, board) {
        boardResponse.status = getBoardErr;
        boardResponse.entity = board;
        res.send(boardResponse);
        res.end();
    });
};
*/


