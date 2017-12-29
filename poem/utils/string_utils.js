/*
 * Created by Strawmanbobi
 * 2015-03-02
 */

exports.randomChar = function (l) {
    var x = "0123456789qwertyuioplkjhgfdsazxcvbnm";
    var tmp = "";
    for (var i = 0; i < l; i++) {
        tmp += x.charAt(Math.ceil(Math.random() * 100000000) % x.length);
    }
    return tmp;
};

exports.randomNumber = function (l) {
    var x = "0123456789";
    var tmp = "";
    for (var i = 0; i < l; i++) {
        tmp += x.charAt(Math.ceil(Math.random() * 100000000) % x.length);
    }
    return tmp;
};

exports.validateEmail = function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

/**
 * 生成数字验证码(end-start位随机数字)
 * @param start: a number
 * @param end: a number
 * @returns {string}: verification code
 * eg: genVerificationCode(0,6), then returns XXXXXX  (X:0~9)
 */
exports.genVerificationCode = function (start, end) {
    var array = [];
    for (var i = start; i < end; ++i) array.push(i);
    return array.map(function (x) {
        return Math.floor(Math.random() * 10);
    }).join('')
};


function rnd() {
    var today = new Date();
    var seed = today.getTime();
    seed = (seed * 9301 + 49297) % 233280;
    return seed / (233280.0);
}

function cr(number) {
    return Math.ceil(rnd() * number);
}

function isNumber() {
    var r = /^[0-9]*[1-9][0-9]*$/;
    return r.test(str);
}

