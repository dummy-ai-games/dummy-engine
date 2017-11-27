/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var UserResponse = require('../responses/user_response');
var userLogic = require('../work_units/user_logic');


exports.register = function (req,res){
    var phoneNumber = req.body.phoneNumber;
    var pwd = req.body.password; //need to consider encrypt password
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

    var userResponse = new UserResponse();
    userLogic.registerWorkUnit(user, function(registerErr){
        userResponse.status = registerErr;
        //userResponse.entity = null;
        res.send(userResponse);
        res.end();
    });
};


exports.login = function(req, res){
    var phoneNumber = req.body.phoneNumber;
    var pwd = req.body.password; //need to consider encrypt password
    var user = {
        phoneNumber: phoneNumber,
        password: pwd
    };
    var userResponse = new UserResponse();
    userLogic.getUserWorkUit(user, function(getUserErr, user){
        userResponse.entity = user;
        userResponse.status = getUserErr;
        res.send(userResponse);
        res.end();
    });
};


