/**
 * Created by donna
 * 2014-08-30
 */

var constants = require('../configuration/constants');
var Enums = require('../configuration/enums');
var log4js = require('log4js');
var dateUtils = require('../utils/date_utils');
var enums = new Enums();

var helper = helper || {};
exports.helper = helper;

var logRoot = "./logs/";
var userDebugLogFolder = "user_debug/";
var devLogFolder = "dev/";
var productionLogFolder = "production/";
var gameLogFolder = "game/";

var logFile = "common.log";
var gameID = "";
var gameLogFile = "game.log";

log4js.configure({
    appenders: {
        default: {
            type: "dateFile",
            filename: logRoot + productionLogFolder + logFile,
            pattern: "-yyyy-MM-dd",
            alwaysIncludePattern: false,
            maxLogSize: 1024
        },
        userProductionLog: {
            type: "dateFile",
            filename: logRoot + productionLogFolder + logFile,
            pattern: "-yyyy-MM-dd",
            alwaysIncludePattern: false,
            maxLogSize: 1024
        },
        userDebugLog: {
            type: "dateFile",
            filename: logRoot + userDebugLogFolder + logFile,
            pattern: "-yyyy-MM-dd",
            alwaysIncludePattern: false,
            maxLogSize: 1024
        },
        userDevelopmentLog: {
            type: "dateFile",
            filename: logRoot + devLogFolder + logFile,
            pattern: "-yyyy-MM-dd",
            alwaysIncludePattern: false,
            maxLogSize: 1024
        },
        gameLog: {
            type: "dateFile",
            filename: logRoot + gameLogFolder + gameID + gameLogFile,
            pattern: "-yyyy-MM-dd",
            alwaysIncludePattern: false,
            maxLogSize: 1024
        }
    },
    categories: {
        default: {appenders: ['userProductionLog', 'default'], level: 'info'},
        userProductionLog: {appenders: ['userProductionLog'], level: 'info'},
        userDebugLog: {appenders: ['userDebugLog'], level: 'info'},
        userDevelopmentLog: {appenders: ['userDevelopmentLog'], level: 'info'},
        gameLog: {appenders: ['gameLog'], level: 'info'}
    },
    replaceConsole: true
});

var userProductionLog = log4js.getLogger('userProductionLog');
var userDebugLog = log4js.getLogger('userDebugLog');
var userDevelopmentLog = log4js.getLogger('userDevelopmentLog');
var gameLog = log4js.getLogger('gameLog');

helper.info = function (msg) {
    if (enums.APP_DEVELOPMENT_MODE == ENV) {
        var date = dateUtils.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss.S");
        console.log(date + " " + msg);
    } else if (enums.APP_PRODUCTION_MODE == ENV) {
        userProductionLog.info(msg);
    } else {
        userDebugLog.info(msg);
    }
};

helper.error = function (msg) {
    if (enums.APP_DEVELOPMENT_MODE == ENV) {
        console.log(msg);
    } else if (enums.APP_PRODUCTION_MODE == ENV) {
        userProductionLog.error(msg);
    } else {
        userDebugLog.error(msg);
    }
};

helper.warn = function (msg) {
    if (enums.APP_DEVELOPMENT_MODE == ENV) {
        console.log(msg);
    } else if (enums.APP_PRODUCTION_MODE == ENV) {
        userProductionLog.warn(msg);
    } else {
        userDebugLog.warn(msg);
    }
};

helper.debug = function (msg) {
    if (enums.APP_DEVELOPMENT_MODE == ENV) {
        console.log(msg);
    } else if (enums.APP_PRODUCTION_MODE == ENV) {
        userProductionLog.debug(msg);
    } else {
        userDebugLog.debug(msg);
    }
};

helper.trace = function (msg) {
    if (enums.APP_DEVELOPMENT_MODE == ENV) {
        console.log(msg);
    } else if (enums.APP_PRODUCTION_MODE == ENV) {
        userProductionLog.trace(msg);
    } else {
        userDebugLog.trace(msg);
    }
};

helper.fatal = function (msg) {
    if (enums.APP_DEVELOPMENT_MODE == ENV) {
        console.log(msg);
    } else if (enums.APP_PRODUCTION_MODE == ENV) {
        userProductionLog.fatal(msg);
    } else {
        userDebugLog.fatal(msg);
    }
};

helper.game = function (id, msg) {
    gameID = id;
    gameLog.info(msg);
};
