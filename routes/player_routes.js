/**
 * Created by Dummy team
 * 2017-11-26
 */

var app = require('../dummy.js');
var playerService = require('../rest_services/player_service.js');


app.post("/players/signup", playerService.signup);
app.post("/players/login", playerService.login);
app.post("/players/is_login", playerService.validateUserToken);
app.post("/players/get_player_by_token", playerService.getPlayerByToken);
app.post("/players/send_sms", playerService.sendSms);
