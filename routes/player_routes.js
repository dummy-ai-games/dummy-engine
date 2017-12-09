/**
 * Created by Elsie
 * 2017-11-26
 */

var app = require('../dummy.js');
var playerService = require('../rest_services/player_service.js');


app.post("/api/players/signup", playerService.signup);
app.post("/api/players/login", playerService.login);
app.post("/api/players/isLogin", playerService.validateUserToken);
