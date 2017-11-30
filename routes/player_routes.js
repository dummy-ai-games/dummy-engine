/**
 * Created by Elsie
 * 2017-11-26
 */

var app = require('../dummy.js');
var userService = require('../rest_services/player_service.js');

app.post("/users/register", userService.register);
app.post("/users/login", userService.login);
