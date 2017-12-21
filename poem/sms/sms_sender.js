/**
 * Created by strawmanbobi
 * 2017-12-21
 */

require('../configuration/constants');

const SMSClient = require('@alicloud/sms-sdk');

var logger = require('../logging/logger4js').helper;

var ErrorCode = require('../configuration/error_code');
var Enums = require('../configuration/enums');

var errorCode = new ErrorCode();
var enums = new Enums();

var accessKey;
var accessSecret;
var smsClient;

var SmsSender = function(_accessKey, _accessSecret, _signName, _tempName) {
    this.signName = _signName;
    this.tempName = _tempName;
    this.smsClient = new SMSClient({accessKeyId : _accessKey, secretAccessKey: _accessSecret});
};

SmsSender.prototype.sendVerifyKey = function(phoneNumber, verifyKey, callback) {
    this.smsClient.sendSMS({
        PhoneNumbers: phoneNumber,
        SignName: this.signName,
        TemplateCode: this.tempName,
        TemplateParam: '{"code": "' + verifyKey + '"}'
    }).then(function (res) {
        let {Code} = res;
        if (Code === 'OK') {
            callback(errorCode.SUCCESS);
        }
    }, function (err) {
        callback(errorCode.FAILED);
    });
};

module.exports = SmsSender;
