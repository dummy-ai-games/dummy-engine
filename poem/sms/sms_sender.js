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

var VERIFICATION_CODE_TEMP = "SMS_132395300";
var MATCH_NOTICE_TEMP = "SMS_135041865";

var SmsSender = function(_accessKey, _accessSecret, _signName, _tempName) {
    this.signName = _signName;
    this.smsClient = new SMSClient({accessKeyId : _accessKey, secretAccessKey: _accessSecret});
};

SmsSender.prototype.sendVerifyKey = function(phoneNumber, verifyKey, callback) {
    this.smsClient.sendSMS({
        PhoneNumbers: phoneNumber,
        SignName: this.signName,
        TemplateCode: VERIFICATION_CODE_TEMP,
        TemplateParam: '{"code": "' + verifyKey + '"}'
    }).then(function (res) {
        let {Code} = res;
        console.log(Code);
        if (Code === 'OK') {
            callback(errorCode.SUCCESS);
        }
    }, function (err) {
        console.log(err);
        callback(errorCode.FAILED);
    });
};

// TODO: Decouple sms sender from sms business
SmsSender.prototype.sendMatchNotice = function(phoneNumber, passcode, callback) {
    this.smsClient.sendSMS({
        PhoneNumbers: phoneNumber,
        SignName: this.signName,
        TemplateCode: MATCH_NOTICE_TEMP,
        TemplateParam: '{"code": "' + passcode + '"}'
    }).then(function (res) {
        let {Code} = res;
        console.log(Code);
        if (Code === 'OK') {
            callback(errorCode.SUCCESS);
        }
    }, function (err) {
        console.log(err);
        callback(errorCode.FAILED);
    });
};

module.exports = SmsSender;
