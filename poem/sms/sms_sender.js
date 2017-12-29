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
        PhoneNumbers: phoneNumber, //短信接收号码
        SignName: this.signName, //短信签名
        TemplateCode: this.tempName, //短信模板ID
        TemplateParam: '{"code": "' + verifyKey + '"}' //短信模板变量替换
    }).then(function (res) {
        let {Code} = res;
        // res = {"Message":"OK","RequestId":"216DD330-950B-4661-8CFE-C1EA23E5B013","BizId":"661522914297787872^0","Code":"OK"}
        console.log(Code);
        if (Code === 'OK') {
            // 处理返回参数
            callback(errorCode.SUCCESS);
        }
    }, function (err) {
        callback(errorCode.FAILED);
    });
};

module.exports = SmsSender;
