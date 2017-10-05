/**
 * Created by the-engine-team
 * 2017-10-05
 */

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
    gameScale: 1.0,
    controlMenuScale: 1.0,

    // sprites

    // labels

    // buttons
    startButton: null,

    // menus
    controlMenu: null,

    // layers

    // design specs

    // constructor
    ctor: function (gameScale) {
        this._super();
        this.gameScale = gameScale;
    },

    // game initializer
    init: function () {
        this._super(cc.color(0, 0, 0, 225));

        // initialize layout on DealerLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // initialize start button
        this.startButton = cc.MenuItemImage.create(
            s_start_button,
            s_start_button_pressed,
            function () {
                console.log("game start");
            }, this);

        this.controlMenuScale = this.gameScale;
        this.startButton.setAnchorPoint(0, 0);
        this.controlMenu = cc.Menu.create(this.startButton);

        this.controlMenu.setScale(this.controlMenuScale);
        var menuPositionX = (this.validWidth - this.startButton.getContentSize().width) / 2 * this.gameScale;
        var menuPositionY = (this.validHeight - this.startButton.getContentSize().height) / 2 * this.gameScale;
        this.controlMenu.setPosition(menuPositionX, menuPositionY);
        this.addChild(this.controlMenu, 1);
    },

    // game operations
    update: function (dt) {
        this.doUpdate();
    },

    reset: function() {
    },

    removeAll: function() {
        this.reset();
    },

    doUpdate: function() {

    }
});
