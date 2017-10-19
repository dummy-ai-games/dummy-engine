/**
 * Created by the-engine team
 * 2017-10-19
 */

// global inclusion
var logger = require('../poem/logging/logger4js').helper;

// local inclusion
var winnersDao = require('../models/winners_dao.js');

var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

exports.updateWinnersWorkUnit = function(tableNumber, newWinners, callback) {
    var conditions = {
        tableNumber: tableNumber
    };

    winnersDao.getWinners(conditions, function(getWinnersErr, winners) {
        if (getWinnersErr.code === errorCode.SUCCESS.code &&
            null !== winners && winners.length > 0) {
            logger.info('winners existed, update it');
            winnersDao.updateWinners(conditions, newWinners, function(updateWinnersErr) {
                callback(updateWinnersErr);
            });
        } else {
            logger.info('get winners failed, create a new one');
            winnersDao.createWinners(newWinners, function(createWinnersErr) {
                callback(createWinnersErr);
            });
        }
    });
};
