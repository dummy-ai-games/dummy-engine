/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var PlayerResponse = require('../responses/player_response');
var playerLogic = require('../work_units/player_logic');


exports.signup = function (req,res){
    var phoneNumber = req.body.phoneNumber;
    var pwd = req.body.password;
    var name = req.body.username;
    var avatar = req.body.avatar;
    var user = {
        name: name,
        phoneNumber: phoneNumber,
        password: pwd,
        avatar:avatar,
        role:0, // need to consider different roles
        status:0
    };
    logger.info(phoneNumber);
    var playerResponse = new PlayerResponse();
    playerLogic.registerWorkUnit(user, function(registerErr,user){
        playerResponse.status = registerErr;
        playerResponse.entity = user;
        res.send(playerResponse);
        res.end();
    });
};


exports.login = function(req, res){
    var phoneNumber = req.body.phoneNumber;
    var pwd = req.body.password;
    var user = {
        phoneNumber: phoneNumber,
        password: pwd
    };
    var playerResponse = new PlayerResponse();
    playerLogic.getUserWorkUnit(user, function(getUserErr, user){
        playerResponse.entity = user;
        playerResponse.status = getUserErr;
        res.send(playerResponse);
        res.end();
    });
};


