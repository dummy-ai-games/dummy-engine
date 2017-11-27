/**
 * Created by dummy team
 * 2017-10-19
 */

var app = require('../dummy.js');
var gameService = require('../rest_services/game_service.js');

app.post("/game/list_ranked_players", gameService.listRankedPlayers);
