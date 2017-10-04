/**
 * Created by the-engine-team
 * 2017-10-03
 */

// model related
var STATUS_WAITING_FOR_PLAYERS = 0;
var STATUS_GAME_RUNNING = 1;
var STATUS_GAME_FINISHED = 2;

var currentRound = 1;
var players = [];
var currentPlayers = 0;

var publicCards = [];

var currentSmallBlind = 0;
var currentBigBlind = 0;

// visualization related
var GameLayer = cc.Layer.extend({

    // constants
    defaultFont: '微软雅黑',
    roundTextFont: 'IMPACT',
    roundTextSize: '50',
    gameStatus: STATUS_WAITING_FOR_PLAYERS,
    debug: true,
    maxPlayerCount: 10,
    maxPublicCardCount: 5,

    // game model variables
    currentPlayerCount: 0,
    currentPublicCardCount: 0,

    // visualization variables
    size: null,
    validWidth: 0,
    validHeight: 0,

    // scales
    bgScale: 1.0,
    decoScale: 1.0,
    boardScale: 1.0,
    mmScale: 1.0,
    playerScale: 1.0,
    cardScale: 1.0,

    // sprites
    bgSprite: null,
    decoBottom: null,
    bgBoard: null,
    bgMM: null,
    publicCards: [],
    tmLogo: null,

    // labels
    roundText: null,

    // menus

    // layers
    playerLayers: [],
    dealerLayer: null,

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
    cardMarginBottom: 380,
    cardMarginLeft: [320, 400, 480, 560, 640],
    roundTextWidth: 274,
    roundTextHeight: 64,
    roundTextMarginBottom: 280,
    logoMarginTop: 18,
    logoMarginRight: 36,

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
        this.bgScale = Math.max(this.validHeight / this.bgSprite.getContentSize().height,
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
        this.mmScale = this.bgScale * 0.75;
        this.bgMM.setScale(this.mmScale);
        this.bgMM.setPosition((this.validWidth - this.bgMM.getContentSize().width * this.mmScale) / 2,
            (this.bgSprite.getContentSize().height * this.bgScale -
                (this.mmMarginTop + this.bgMM.getContentSize().height) * this.mmScale));
        this.addChild(this.bgMM, 1);

        // initialize poker board
        this.bgBoard = cc.Sprite.create(s_bg_board);
        this.bgBoard.setAnchorPoint(0, 0);
        this.boardScale = this.bgScale;
        var boardRealMarginLeft = (this.bgSprite.getContentSize().width - this.bgBoard.getContentSize().width) / 2
                * this.bgScale;
        var boardRealMarginBottom = (this.bgSprite.getContentSize().height - this.bgBoard.getContentSize().height) / 2
            * this.bgScale;
        this.bgBoard.setScale(this.boardScale);
        this.bgBoard.setPosition(boardRealMarginLeft, boardRealMarginBottom);
        this.addChild(this.bgBoard, 2);

        // initialize players
        var playerIndex;
        this.playerScale = this.bgScale * 0.8;
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            if (playerIndex < 5) {
                this.playerLayers[playerIndex] = new PlayerLayer(PLAYER_AT_RIGHT);
            } else {
                this.playerLayers[playerIndex] = new PlayerLayer(PLAYER_AT_LEFT);
            }
            this.playerLayers[playerIndex].init();
            this.playerLayers[playerIndex].setAnchorPoint(0, 0);
            this.playerLayers[playerIndex].setScale(this.playerScale);
            this.playerLayers[playerIndex].setPosition(this.playerPosition[playerIndex].x * this.bgScale,
                                                       this.playerPosition[playerIndex].y * this.bgScale);
            this.addChild(this.playerLayers[playerIndex], 5);
        }

        // initialize public cards
        var publicCardIndex;
        for (publicCardIndex = 0; publicCardIndex < this.maxPublicCardCount; publicCardIndex++) {
            this.publicCards[publicCardIndex] = cc.Sprite.create(s_p_back);
            this.publicCards[publicCardIndex].setAnchorPoint(0, 0);
            this.cardScale =
                Math.max(this.cardVisualHeight / this.publicCards[publicCardIndex].getContentSize().height,
                    this.cardVisualWidth / this.publicCards[publicCardIndex].getContentSize().width) * this.bgScale;
            this.publicCards[publicCardIndex].setScale(this.cardScale);
            this.publicCards[publicCardIndex].setPosition(this.cardMarginLeft[publicCardIndex] * this.bgScale,
                    this.cardMarginBottom * this.bgScale);
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
        this.roundText.setScale(this.bgScale);
        this.roundText
            .setPosition((this.bgSprite.getContentSize().width - this.roundText.getContentSize().width) / 2
                    * this.bgScale,
                        this.roundTextMarginBottom * this.bgScale);
        this.addChild(this.roundText, 2);

        // initialize TrendMicro logo
        this.tmLogo = cc.Sprite.create(s_tm_logo);
        this.tmLogo.setAnchorPoint(0, 0);
        this.tmLogo.setScale(this.bgScale);
        this.tmLogo.setPosition((this.bgSprite.getContentSize().width -
            this.tmLogo.getContentSize().width - this.logoMarginRight) * this.bgScale,
                (this.bgSprite.getContentSize().height -
                this.tmLogo.getContentSize().height - this.logoMarginTop) * this.bgScale);
        this.addChild(this.tmLogo, 2);

        // add dealer layer on the top
        this.dealerLayer = new DealerLayer(this.bgScale);
        this.dealerLayer.init();
        this.dealerLayer.setAnchorPoint(0, 0);
        this.dealerLayer.setScale(this.bgScale);
        this.dealerLayer.setPosition(0, 0);
        this.addChild(this.dealerLayer, 100);

        this.reset();
        this.scheduleUpdate();
    },

    // game operations
    update: function (dt) {
        this.doUpdate();
    },

    reset: function() {
        // initiate players
        players = [];
        currentPlayers = 0;
        this.gameStatus = STATUS_WAITING_FOR_PLAYERS;
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
        switch(this.gameStatus) {
            case STATUS_WAITING_FOR_PLAYERS:
                this.updateRound();
                this.updatePlayers();
                this.updateTable(false);
                break;
            case STATUS_GAME_RUNNING:
                this.updateRound();
                this.updatePlayers();
                this.updateTable(true);
                break;
            case STATUS_GAME_FINISHED:
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
