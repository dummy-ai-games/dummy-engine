/**
 * Created by the-engine team
 * 2017-09-08
 */

var constants = require('./poem/configuration/constants');
// initialize RUNTIME env
var systemConfig = require('./configuration/system_configs');
systemConfig.setupEnvironment();

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');
var MongoStore = require('connect-mongodb');
var db = require('./database/msession');
var flash = require('connect-flash');
var app = module.exports = express();

var port = normalizePort(process.env.PORT || LISTEN_PORT || '443');
app.set('port', port);

var httpServer = require('http').createServer(app);
var httpPort = normalizePort(process.env.PORT || LISTEN_PORT);
httpServer.listen(httpPort);

var SkyRTC = require('./game/communication').listen(httpServer);

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

db.open(function (err, db) {
    db.authenticate(MONGO_DB_USER, MONGO_DB_PASSWORD, function () {
    });
});


app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cookieParser());
app.use(session({
    cookie: { maxAge: 600000 },
    secret: "the-engine",
    store: new MongoStore({
        username: MONGO_DB_USER,
        password: MONGO_DB_PASSWORD,
        url: MONGO_DB_URI,
        db: db
    })
}));

app.use(function (req, res, next) {
    if (req.session.user)
        res.locals.user = req.session.user;
    else
        res.locals.user = {};
    var err = req.session.err;
    delete req.session.err;
    next();
});

app.use("/", express.static(__dirname + '/web/'));
require('./routes');

SkyRTC.rtc.on('new_connect', function (socket) {
    console.log('创建新连接');
});

SkyRTC.rtc.on('remove_peer', function (socketId) {
    console.log(socketId + "用户离开");
});

SkyRTC.rtc.on('new_peer', function (user) {
    console.log("新用户" + user + "加入");
});

SkyRTC.rtc.on('_receiveAction', function (data) {
    if (data.action == 'Bet') {
        console.log("用户" + data.playerName + "采取动作" + data.action + " ，下注:" + data.amount);
    } else {
        console.log("用户" + data.playerName + "采取动作" + data.action);
    }
});

SkyRTC.rtc.on('socket_message', function (socket, msg) {
    console.log("接收到来自" + socket.id + "的新消息：" + msg);
});

SkyRTC.rtc.on('error', function (error) {
    console.log("发生错误：" + error.message);
});