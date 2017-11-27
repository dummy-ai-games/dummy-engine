/**
 * Created by dummy team
 * 2017-09-08
 */

function ErrorCode() {
    this.SUCCESS = {
        code: 0,
        cause: "Success"
    };
    this.FAILED = {
        code: -1,
        cause: "Generic error"
    };
    this.WRONG_ENV = {
        code: -2,
        cause: "Wrong environment"
    };

    this.PLAYER_EXIST = {
        code: 1,
        cause: "Player existed"
    };
    this.USER_EXIST = {
        code: 1,
        cause: "User existed"
    };
}

module.exports = ErrorCode;