/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var UserResponse = require('../responses/user_response');
var userLogic = require('../work_units/player_logic');
var jwt = require('jsonwebtoken');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

const JWT_SECRET = 'dummy_ymmub';

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
        if(registerErr !== errorCode.SUCCESS.code){
            // 注册失败
            res.send(userResponse);
            return res.end();
        }
        // 注册成功即登录
        // jwt session
        delete user.password;
        var token = jwt.sign(user, JWT_SECRET);
        userResponse.entity = { token, user };
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
    userLogic.getUserWorkUnit(user, function(getUserErr, users){
        userResponse.status = getUserErr;
        if(getUserErr !== errorCode.SUCCESS.code){
            // 登录失败
            res.send(userResponse);
            return res.end();
        }
        user = users[0];
        delete user.password;
        var token = jwt.sign(user, JWT_SECRET);
        userResponse.entity = { token, user };
        res.send(userResponse);
        res.end();
    });
};
