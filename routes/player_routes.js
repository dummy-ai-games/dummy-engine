/**
 * Created by the-engine team
 * 2017-09-08
 */

var app = require('../the-engine.js');
var playerService = require('../rest_services/player_service.js');

app.get("/player/get_players", playerService.getPlayers);
app.get("/player/get_tables", playerService.getTables);
app.get("/player/dump_log", playerService.dumpLog);

app.post("/player/list_players", playerService.listPlayers);
app.post("/player/update_player", playerService.updatePlayer);
app.post("/player/delete_player", playerService.deletePlayer);
app.post("/player/get_table_by_player", playerService.getTableByPlayer);
