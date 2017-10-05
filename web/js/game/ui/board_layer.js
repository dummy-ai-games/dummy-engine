/**
 * Created by the-engine-team
 * 2017-10-03
 */

var GameLayer = cc.Layer.extend({

    // constants
    defaultFont: '微软雅黑',
    roundTextFont: 'IMPACT',
    roundTextSize: '50',
    authorTextFont: this.defaultFont,
    authorTextSize: '12',
    debug: true,
    maxPlayerCount: 10,
    maxPublicCardCount: 5,

    // visualization variables
    size: null,
    validWidth: 0,
    validHeight: 0,

    // scales
    gameScale: 1.0,
    bgScale: 1.0,
    decoScale: 1.0,
    boardScale: 1.0,
    mmScale: 1.0,
    playerScale: 1.0,
    cardScale: 1.0,
    controlMenuScale: 1.0,

    // sprites
    bgSprite: null,
    decoBottom: null,
    bgBoard: null,
    bgMM: null,
    publicCards: [],
    tmLogo: null,

    // labels
    roundText: null,
    authorText: null,

    // buttons
    startButton: null,
    stopButton: null,

    // menus
    controlMenu: null,

    // layers
    playerLayers: [],
    dealerLayer: null,
    winnerLayer: null,

    // design specs
    refWidth: 1024,
    refHeight: 768,
    boardMarginLeft: 28,
    boardMarginRight: 28,
    boardMarginBottom: 180,
    mmMarginTop: 20,
    playerPosition: [
        // players at right side
        { x: 640, y: 560 },
        { x: 840, y: 500 },
        { x: 870, y: 340 },
        { x: 840, y: 180 },
        { x: 600, y: 120 },
        // players at left side
        { x: 280, y: 120 },
        { x:  40, y: 180 },
        { x:  10, y: 340 },
        { x:  40, y: 500 },
        { x: 240, y: 560 }
    ],
    cardVisualHeight: 100,
    cardVisualWidth: 72,
    cardMarginBottom: 280,
    cardMarginLeft: [320, 400, 480, 560, 640],
    roundTextWidth: 274,
    roundTextHeight: 64,
    roundTextMarginBottom: 460,
    authorTextWidth: 320,
    authorTextHeight: 32,
    authorTextMarginBottom: 10,
    logoMarginTop: 18,
    logoMarginRight: 36,
    controlMenuMarginLeft: 36,
    controlMenuMarginBottom: 680,

    // constructor
    ctor: function () {
        this._super();
    },

    // game initializer
    init: function () {
        this._super();

        // initialize sprite layout on BoardLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // initialize background
        this.bgSprite = cc.Sprite.create(s_bg);
        this.bgSprite.setAnchorPoint(0, 0);
        this.gameScale = this.bgScale = Math.max(this.validHeight / this.bgSprite.getContentSize().height,
                                    this.validWidth / this.bgSprite.getContentSize().width);
        this.bgSprite.setScale(this.bgScale);
        this.bgSprite.setPosition(0, 0);
        this.addChild(this.bgSprite, 0);

        // initialize bottom decoration
        this.decoBottom = cc.Sprite.create(s_dec_bottom);
        this.decoBottom.setAnchorPoint(0, 0);
        this.decoScale = this.validWidth / this.decoBottom.getContentSize().width;
        this.decoBottom.setScale(this.decoScale);
        this.decoBottom.setPosition(0, 0);
        this.addChild(this.decoBottom, 1);

        // initialize dealer mm
        this.bgMM = cc.Sprite.create(s_bg_mm_2);
        this.bgMM.setAnchorPoint(0, 0);
        this.mmScale = this.gameScale * 0.75;
        this.bgMM.setScale(this.mmScale);
        this.bgMM.setPosition((this.validWidth - this.bgMM.getContentSize().width * this.mmScale) / 2,
            (this.bgSprite.getContentSize().height * this.gameScale -
                (this.mmMarginTop + this.bgMM.getContentSize().height) * this.mmScale));
        this.addChild(this.bgMM, 1);

        // initialize poker board
        this.bgBoard = cc.Sprite.create(s_bg_board);
        this.bgBoard.setAnchorPoint(0, 0);
        this.boardScale = this.gameScale;
        var boardRealMarginLeft = (this.bgSprite.getContentSize().width - this.bgBoard.getContentSize().width) / 2
                * this.gameScale;
        var boardRealMarginBottom = (this.bgSprite.getContentSize().height - this.bgBoard.getContentSize().height) / 2
            * this.gameScale;
        this.bgBoard.setScale(this.boardScale);
        this.bgBoard.setPosition(boardRealMarginLeft, boardRealMarginBottom);
        this.addChild(this.bgBoard, 2);

        // initialize players
        var playerIndex;
        this.playerScale = this.gameScale * 0.8;
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            if (playerIndex < 5) {
                this.playerLayers[playerIndex] = new PlayerLayer(PLAYER_AT_RIGHT);
            } else {
                this.playerLayers[playerIndex] = new PlayerLayer(PLAYER_AT_LEFT);
            }
            this.playerLayers[playerIndex].init();
            this.playerLayers[playerIndex].setAnchorPoint(0, 0);
            this.playerLayers[playerIndex].setScale(this.playerScale);
            this.playerLayers[playerIndex].setPosition(this.playerPosition[playerIndex].x * this.gameScale,
                                                       this.playerPosition[playerIndex].y * this.gameScale);
            this.addChild(this.playerLayers[playerIndex], 5);
        }

        // initialize public cards
        var publicCardIndex;
        for (publicCardIndex = 0; publicCardIndex < this.maxPublicCardCount; publicCardIndex++) {
            this.publicCards[publicCardIndex] = cc.Sprite.create(s_p_back);
            this.publicCards[publicCardIndex].setAnchorPoint(0, 0);
            this.cardScale =
                Math.max(this.cardVisualHeight / this.publicCards[publicCardIndex].getContentSize().height,
                    this.cardVisualWidth / this.publicCards[publicCardIndex].getContentSize().width) * this.gameScale;
            this.publicCards[publicCardIndex].setScale(this.cardScale);
            this.publicCards[publicCardIndex].setPosition(this.cardMarginLeft[publicCardIndex] * this.gameScale,
                    this.cardMarginBottom * this.gameScale);
            this.addChild(this.publicCards[publicCardIndex], 2);
        }

        // initialize round text
        this.roundText = new cc.LabelTTF('ROUND 1', this.roundTextFont, this.roundTextSize);
        this.roundText.setColor(cc.color(255, 255, 255, 255));
        this.roundText.setAnchorPoint(0, 0);
        this.roundText.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.roundText.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.roundText.boundingWidth = this.roundTextWidth;
        this.roundText.boundingHeight = this.roundTextHeight;
        this.roundText.setScale(this.gameScale);
        this.roundText
            .setPosition((this.bgSprite.getContentSize().width - this.roundText.getContentSize().width) / 2
                    * this.gameScale,
                        this.roundTextMarginBottom * this.gameScale);
        this.addChild(this.roundText, 2);

        // initialize author text
        this.authorText = new cc.LabelTTF('开发者: Bobi.Zhou, JP.Yang, Teresa.Wu \r\n Engineering Camp 2017 Task Force',
                this.authorTextFont, this.authorTextSize);
        this.authorText.setColor(cc.color(255, 255, 255, 255));
        this.authorText.setAnchorPoint(0, 0);
        this.authorText.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.authorText.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.authorText.boundingWidth = this.authorTextWidth;
        this.authorText.boundingHeight = this.authorTextHeight;
        this.authorText.setScale(this.gameScale);
        this.authorText
            .setPosition((this.bgSprite.getContentSize().width - this.authorText.getContentSize().width) / 2
                * this.gameScale,
                this.authorTextMarginBottom * this.gameScale);
        this.addChild(this.authorText, 2);

        // initialize TrendMicro logo
        this.tmLogo = cc.Sprite.create(s_tm_logo);
        this.tmLogo.setAnchorPoint(0, 0);
        this.tmLogo.setScale(this.gameScale);
        this.tmLogo.setPosition((this.bgSprite.getContentSize().width -
            this.tmLogo.getContentSize().width - this.logoMarginRight) * this.gameScale,
                (this.bgSprite.getContentSize().height -
                this.tmLogo.getContentSize().height - this.logoMarginTop) * this.gameScale);
        this.addChild(this.tmLogo, 2);

        // add stop button
        this.startButton = ccui.Button.create(s_start_button, s_start_button_pressed, s_start_button);

        // add dealer layer on the top
        this.dealerLayer = new DealerLayer(this.gameScale);
        this.dealerLayer.init();
        this.dealerLayer.setAnchorPoint(0, 0);
        this.dealerLayer.setPosition(0, 0);
        // this.addChild(this.dealerLayer, 100);

        // add winner layer on the top
        this.winnerLayer = new WinnerLayer(this.gameScale);
        this.winnerLayer.init();
        this.winnerLayer.setAnchorPoint(0, 0);
        this.winnerLayer.setPosition(0, 0);
        // this.addChild(this.winnerLayer, 100);

        this.reset();
        this.scheduleUpdate();
    },

    // game operations
    update: function (dt) {
        this.doUpdate();
    },

    reset: function() {
        // initialize players
        players = [];
        currentPlayers = 0;
        gameStatus = STATUS_WAITING_FOR_PLAYERS;
    },

    removeAll: function() {
        this.reset();
    },

    gameFinished: function() {
        console.log('game finished');
    },

    gameOver: function() {
    },

    // generic sprite animations
    moveSprite: function (sprite, toPos, callback) {
    },

    cbSpriteMovingFinished: function(nodeExecutingAction, data) {
    },

    doUpdate: function() {
        switch(gameStatus) {
            case STATUS_WAITING_FOR_PLAYERS:
                // this.dealerLayer.setVisible(true);
                // this.winnerLayer.setVisible(false);
                this.updateRound();
                this.updatePlayers();
                this.updateTable(false);
                break;
            case STATUS_GAME_RUNNING:
                // this.dealerLayer.setVisible(false);
                // this.winnerLayer.setVisible(false);
                this.updateRound();
                this.updatePlayers();
                this.updateTable(true);
                break;
            case STATUS_GAME_FINISHED:
                // this.dealerLayer.setVisible(false);
                // this.winnerLayer.setVisible(true);
                this.updateRound();
                this.updatePlayers();
                this.updateTable(true);
                break;

            default:
            {
                break;
            }
        }
    },

    updateRound: function() {

    },

    updatePlayers: function() {

    },

    updateTable: function(visible) {

    },

    updateBg: function() {
        // do not update background in this game
    },

    showPlayer: function(i, show) {
    }
});
