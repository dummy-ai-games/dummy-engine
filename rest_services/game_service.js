/**
 * Created by the-engine team
 * 2017-10-19
 */

var PlayersResponse = require('../responses/players_response.js');

var gameLogic = require('../work_units/game_logic.js');

/**
 * function :   List ranked players
 * parameter :
 * return :     PlayersResponse
 */
exports.listRankedPlayers = function (req, res) {
    var playersResponse = new PlayersResponse();
    gameLogic.getRankedPlayersWorkUnit(function (getPlayersErr, players) {
        playersResponse.status = getPlayersErr;
        playersResponse.entity = players;
        res.send(playersResponse);
        res.end();
    });
};
