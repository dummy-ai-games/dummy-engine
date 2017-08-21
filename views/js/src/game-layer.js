/**
 * Created by Strawmanbobi
 * 2017-08-21
 */

// logic related

// visualization related

var GameLayer = cc.Layer.extend({
    FONT_TYPE: '微软雅黑',
    // generic var
    size: null,
    validHeight: 0,
    gameStatus: 0,

    // sprites
    /* for game */
    bgSprite: null,

    // buttons

    // texts

    // menus

    // layers

    // constructor
    ctor: function (requireScore, score) {
        this._super();
    },

    // game initializer
    init: function () {
        this._super();

        var width = document.documentElement.clientWidth;
        if (document.documentElement.clientWidth >= 800) {
            width = 800;
        }
        this.size = cc.size(width, document.documentElement.clientHeight);

        // draw background image
        var bgScale = 1;
        this.bgSprite = cc.Sprite.create(s_backgournd);
        // this.bgSprite.setScaleY(bgScale);
        this.bgSprite.setAnchorPoint(0, 0);
        this.bgSprite.setPosition(cc.p(0, 0));
        this.addChild(this.bgSprite, 0);

        this.scheduleUpdate();
    },

    // update callback function
    update: function (dt) {
        this.doUpdate(dt);
    },

    /****** game logic ******/
    reset: function(gender) {
    },

    removeAll: function() {
    },

    gameFinished: function() {
    },

    gameOver: function(oppoObject, failureType) {
    },

    moveSprite: function (sprite, toPos, callback) {
    },

    cbSpriteMovingFinished: function(nodeExecutingAction, data) {
    },

    doUpdate: function(dt) {
        var oppoCollision = 0;
        var failureType = "";
        switch(gameStatus) {
            default:
            {
                break;
            }
        }
    },

    updateBg: function(dt) {
    }
});