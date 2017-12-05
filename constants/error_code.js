/**
 * Created by dummy team
 * 2017-09-08
 */

function ErrorCode() {
    this.SUCCESS = {
        code: 0,
        cause: "Success"
    };
    this.SESSION_TIMEOUT = {
        code: 2,
        cause: 'Session timeout or token illegal'
    };

    this.FAILED = {
        code: -1,
        cause: "Generic error"
    };
    this.WRONG_ENV = {
        code: -2,
        cause: "Wrong environment"
    };
    this.AUTHENTICATION_FAILURE = {
        code: -3,
        cause: "Player validation failure"
    };

    this.PLAYER_EXIST = {
        code: 1,
        cause: "Player existed"
    };
}

module.exports = ErrorCode;