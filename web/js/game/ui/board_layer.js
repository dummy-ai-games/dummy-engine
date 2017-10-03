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

    defaultFont: '微软雅黑',

    // game model variables
    gameStatus: STATUS_WAITING_FOR_PLAYERS,

    // global visualization variables
    size: null,
    validWidth: 0,
    validHeight: 0,
    DEBUG: true,

    // scales
    bgScale: 1.0,
    decoScale: 1.0,
    boardScale: 1.0,
    mmScale: 1.0,

    // sprites
    bgSprite: null,
    decoBottom: null,
    bgBoard: null,
    bgMM: null,

    // menus

    // layers
    playerLayer: null,

    // design specs
    refWidth: 1024,
    refHeight: 768,
    boardMarginLeft: 28,
    boardMarginRight: 28,
    boardMarginBottom: 160,
    mmMarginTop: 0,

    // constructor
    ctor: function () {
        this._super();
    },

    // game initializer
    init: function () {
        this._super();

        // initiate sprite layout on gameCanvasS
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // add background
        this.bgSprite = cc.Sprite.create(s_bg);
        this.bgSprite.setAnchorPoint(0, 0);
        this.bgScale = Math.max(this.validHeight / this.bgSprite.getContentSize().height,
                                    this.validWidth / this.bgSprite.getContentSize().width);
        this.bgSprite.setScale(this.bgScale);
        this.bgSprite.setPosition(0, 0);
        this.addChild(this.bgSprite, 0);

        // add bottom decoration
        this.decoBottom = cc.Sprite.create(s_dec_bottom);
        this.decoBottom.setAnchorPoint(0, 0);
        this.decoScale = this.validWidth / this.decoBottom.getContentSize().width;
        this.decoBottom.setScale(this.decoScale);
        this.decoBottom.setPosition(0, 0);
        this.addChild(this.decoBottom, 1);

        // add dealer mm
        this.bgMM = cc.Sprite.create(s_bg_mm_2);
        this.bgMM.setAnchorPoint(0, 0);
        this.mmScale = this.bgScale;
        this.bgMM.setScale(this.mmScale);
        this.bgMM.setPosition((this.validWidth - this.bgMM.getContentSize().width * this.mmScale) / 2,
            this.validHeight - ((this.mmMarginTop + this.bgMM.getContentSize().height) * this.mmScale));
        this.addChild(this.bgMM, 1);

        // add poker board
        this.bgBoard = cc.Sprite.create(s_bg_board);
        this.bgBoard.setAnchorPoint(0, 0);
        var boardRealMarginLeft = this.boardMarginLeft * this.boardScale;
        var boardRealMarginBottom = this.boardMarginBottom * this.boardScale;
        this.boardScale = (this.validWidth - this.boardMarginLeft * 2) / (this.bgBoard.getContentSize().width);
        this.bgBoard.setScale(this.boardScale);
        this.bgBoard.setPosition(boardRealMarginLeft, boardRealMarginBottom);
        this.addChild(this.bgBoard, 2);

        // add player layer
        this.playerLayer = new PlayerLayer(PLAYER_AT_RIGHT);
        this.playerLayer.init();
        this.playerLayer.setAnchorPoint(0, 0);
        // this.playerLayer.setScale(this.bgScale);
        this.playerLayer.setPosition(100, 200);
        this.addChild(this.playerLayer, 5);

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
