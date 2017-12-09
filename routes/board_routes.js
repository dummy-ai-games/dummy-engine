/**
 * Created by Elsie
 * 2017-12-02
 */

var app = require('../dummy.js');
var boardService = require('../rest_services/board_service');


app.post("/api/board/create_board", boardService.createBoard);
app.post("/api/board/update_board", boardService.updateBoard);
app.post("/api/board/list_boards", boardService.listBoards);

//app.post("/board/get_board_by_ticket",boardService.getBoardByTicket); //for testing