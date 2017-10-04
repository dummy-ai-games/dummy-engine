/**
 * Created by the-engine-team
 * 2017-10-05
 */

// visualization related
var DealerLayer = cc.ColorLayer.extend({

    // constants
    defaultFont: '微软雅黑',
    nameSize: 24,
    debug: true,

    // scales
    buttonScale: 1.0,
    bgScale: 1.0,

    // sprites
    bgSprite: null,

    // labels

    // menus

    // layers

    // design specs

    // constructor
    ctor: function (playerType) {
        this._super();
        this.playerType = playerType;
    },

    // game initializer
    init: function () {
        this._super();

        // initiate sprite layout on DealerLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // add start button

    },

    // game operations
    update: function (dt) {
        this.doUpdate();
    },

    // reset function
    reset: function() {
        // initiate players
        players = [];
        currentPlayers = 0;
        gameStatus = STATUS_WAITING_FOR_PLAYERS;
    },

    removeAll: function() {
        this.reset();
    },

    gameFinished: function() {
        console.log("game finished");
    },

    gameOver: function() {
    },

    // generic sprite animations
    moveSprite: function (sprite, toPos, callback) {
    },

    cbSpriteMovingFinished: function(nodeExecutingAction, data) {
    },

    doUpdate: function() {

    },

    // UI helpers
    showPlayer: function(i, show) {
    }
});
