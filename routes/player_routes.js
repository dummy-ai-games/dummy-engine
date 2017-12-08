/**
 * Created by Elsie
 * 2017-11-26
 */

var app = require('../dummy.js');
var playerService = require('../rest_services/player_service.js');


app.post("/players/signup", playerService.signup);
app.post("/players/login", playerService.login);
app.post("/players/login1", playerService.validateUserToken);
