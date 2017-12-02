/**
 * created by Elsie on 2017-11-26
 */

var logger = require('../poem/logging/logger4js').helper;
var PlayerResponse = require('../responses/player_response');
var playerLogic = require('../work_units/player_logic');
var jwt = require('jsonwebtoken');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

const JWT_SECRET = 'dummy_ymmub';

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

    var playerResponse = new PlayerResponse();
    playerLogic.registerWorkUnit(user, function(registerErr){
        playerResponse.status = registerErr;
        if(registerErr !== errorCode.SUCCESS.code){
            // 注册失败
            res.send(userResponse);
            return res.end();
        }
        // 注册成功即登录
        // jwt session
        delete user.password;
        var token = jwt.sign(user, JWT_SECRET);
        playerResponse.entity = { token, user };
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
    playerLogic.getUserWorkUnit(user, function(getUserErr, users){
        playerResponse.status = getUserErr;
        if(getUserErr !== errorCode.SUCCESS.code){
            // 登录失败
            res.send(playerResponse);
            return res.end();
        }
        user = users[0];
        delete user.password;
        var token = jwt.sign(user, JWT_SECRET);
        playerResponse.entity = { token, user };
        res.send(playerResponse);
        res.end();
    });
};
