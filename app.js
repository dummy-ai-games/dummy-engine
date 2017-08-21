var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');
var Settings = require('./database/settings');
var MongoStore = require('connect-mongodb');
var db = require('./database/msession');
var routes = require('./routes/index');
var flash = require('connect-flash');
var fs = require("fs");
var app = express();

var port = normalizePort(process.env.PORT || '3000' || '443');
app.set('port', port);

/*var options = {
 key: fs.readFileSync('./cer/privatekey.pem'),
 cert: fs.readFileSync('./cer/certificate.pem')
 };
 var httpsServer = require('https').createServer(options,app);
 var httpsPort = normalizePort('443');
 httpsServer.listen(httpsPort);*/

var httpServer = require('http').createServer(app);
var httpPort = normalizePort(process.env.PORT || '3000');
httpServer.listen(httpPort);

var SkyRTC = require('./routes/communication').listen(httpServer);

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
    db.authenticate("admin", "123456", function () {
    });
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(flash());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(cookieParser());
app.use(session({
    cookie: {maxAge: 600000},
    secret: Settings.COOKIE_SECRET,
    store: new MongoStore({
        username: Settings.USERNAME,
        password: Settings.PASSWORD,
        url: Settings.URL,
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

app.use("/", express.static(__dirname + '/views/'));

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
    if (data.action == 'Bet')
        console.log("用户" + data.playerName + "采取动作" + data.action + " ，下注:" + data.amount);
    else
        console.log("用户" + data.playerName + "采取动作" + data.action);
});


SkyRTC.rtc.on('socket_message', function (socket, msg) {
    console.log("接收到来自" + socket.id + "的新消息：" + msg);
});


SkyRTC.rtc.on('error', function (error) {
    console.log("发生错误：" + error.message);
});







