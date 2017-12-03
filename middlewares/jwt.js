var logger = require('../poem/logging/logger4js').helper;
var StringResponse = require('../responses/string_response');
var ErrorCode = require('../constants/error_code.js');
var errorCode = new ErrorCode();

module.exports = function(req, res, next) {
  if(req.path === '/players/login' || req.path === '/players/signup') return next();
  const token = (req.cookies && req.cookies.token) || req.get('Token');
  var strResponse = new StringResponse(errorCode.SESSION_TIMEOUT.code, '用户认证信息不合法，请重新登录');
  if (!token) return res.send(strResponse);
  try {
    const payload = app.jwt.verify(token, 'dummy_ymmub');
    if (!payload.hasOwnProperty('phoneNumber')) {
      return res.send(strResponse);
    }
    req.user = payload;
  } catch (err) {
    logger.error(err);
    return res.send(strResponse);
  }
  next();
};