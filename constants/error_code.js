/**
 * Created by the-engine team
 * 2017-09-08
 */

function ErrorCode() {
    this.SUCCESS = {
        code: 0,
        cause: "成功"
    };
    this.FAILED = {
        code: -1,
        cause: "网络故障，请稍后再试"
    };
    this.WRONG_ENV = {
        code: -2,
        cause: "错误的运行环境配置"
    };

    this.PLAYER_EXIST = {
        code: 1,
        cause: "玩家已存在"
    };
}

module.exports = ErrorCode;