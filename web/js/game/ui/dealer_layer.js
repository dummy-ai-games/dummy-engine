/**
 * Created by the-engine-team
 * 2017-10-05
 */

// visualization related
var DealerLayer = cc.LayerColor.extend({

    // constants
    defaultFont: '微软雅黑',
    nameSize: 24,
    debug: true,

    // visualization variables
    size: null,
    validWidth: 0,
    validHeight: 0,

    // scales
    bgScale: 1.0,
    controlMenuScale: 1.0,

    // sprites

    // labels

    // buttons
    startButton: null,
    stopButton: null,

    // menus
    controlMenu: null,

    // layers

    // design specs

    // constructor
    ctor: function (bgScale) {
        this._super();
        this.bgScale = bgScale;
    },

    // game initializer
    init: function () {
        this._super();
        this._super(cc.color(0, 0, 0, 225));

        // initiate sprite layout on DealerLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // add start button
        this.startButton = cc.MenuItemImage.create(
            s_start_button,
            s_start_button_pressed,
            function () {
                console.log("game start");
            },this);

        this.controlMenuScale = this.bgScale;
        this.startButton.setAnchorPoint(0, 0);
        this.controlMenu = cc.Menu.create(this.startButton);
        this.controlMenu.setScale(this.controlMenuScale);
        var menuPositionX = (this.validWidth - this.startButton.getContentSize().width * this.bgScale) / 2;
        var menuPositionY = (this.validHeight - this.startButton.getContentSize().height * this.bgScale) / 2;
        this.controlMenu.setPosition(menuPositionX, menuPositionY);
        this.addChild(this.controlMenu, 1);
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
