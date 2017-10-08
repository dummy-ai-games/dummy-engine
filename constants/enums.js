/**
 * Created by the-engine team
 * 2017-09-08
 */


function Enums() {
    this.APP_PRODUCTION_MODE = "production";
    this.APP_DEVELOPMENT_MODE = "development";
    this.APP_USERDEBUG_MODE = "userdebug";

    this.GAME_STATUS_STANDBY = 0;
    this.GAME_STATUS_RUNNING = 1;
    this.GAME_STATUS_FINISHED = 2;
}

module.exports = Enums;