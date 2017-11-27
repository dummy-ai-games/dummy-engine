/**
 * Created by dummy team
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

var httpServer = require('http').createServer(app);
var httpPort = normalizePort(process.argv[2] || LISTEN_PORT);
httpServer.listen(httpPort);

var tableNumber;
if (process.argv.length > 3) {
    tableNumber = process.argv[3] + "";
}

var SkyRTC = require('./game_services/communication.js').listen(httpServer, tableNumber);

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
app.use(bodyParser.urlencoded(
    {
        extended: true
    }));

app.use(cookieParser());
app.use(session({
    cookie: {maxAge: 600000},
    secret: 'the-engine',
    store: new MongoStore({
        username: MONGO_DB_USER,
        password: MONGO_DB_PASSWORD,
        url: MONGO_DB_URI,
        db: db
    })
}));

app.use('/', express.static(__dirname + '/web/'));
require('./routes');

app.use(function (req, res, next) {
    if (req.session.user)
        res.locals.user = req.session.user;
    else
        res.locals.user = {};
    var err = req.session.err;
    delete req.session.err;
    next();
});

console.log('dummy engine is running, listening on port ' + httpPort);
