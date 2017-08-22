/**
 * Created by Strawmanbobi
 * 2017-08-21
 */

// logic related

// visualization related

var GameLayer = cc.Layer.extend({

    FONT_TYPE: 'Arial',
    // game logic variables
    size: null,
    validWidth: 0,
    validHeight: 0,
    gameStatus: 0,

    defaultMoneyInit: 3000,
    defaultBetInit: 0,
    playerMax: 4,
    theRound: 1,
    playerNames: ["Tom", "Mary", "Jerry", "Alex"],
    moneyInitiates: [],
    betInitiates: [],
    actionInitiates: [],

    // canvas scale
    // sprites
    bgSprite: null,
    avatarSprites: [],
    privateCardSprites: [],

    // buttons

    // texts
    roundText: this.theRound + "",
    nameTexts: [],
    moneyTexts: [],
    actionTexts: [],
    betTexts: [],

    // menus

    // layers

    // constructor
    ctor: function (requireScore, score) {
        this._super();
    },

    // game initializer
    init: function () {
        this._super();

        // initiates game variables
        // initiate money for players
        var i;
        for (i = 0; i < this.playerMax; i++) {
            this.moneyInitiates[i] = "left: " + this.defaultMoneyInit;
            this.actionInitiates[i] = "No Action";
            this.betInitiates[i] = "bet: " + this.defaultBetInit;
        }

        this.validWidth = document.documentElement.clientWidth;
        this.validHeight = document.documentElement.clientHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // show round N text at the center | top
        this.roundText = new cc.LabelTTF("Round " + this.theRound, this.FONT_TYPE, 32,
            cc.size(this.validWidth * this.scale, this.validHeight / 6 * this.scale));
        this.roundText.setColor(cc.color(255, 255, 255, 255));

        this.roundText.setAnchorPoint(0, 0);
        this.roundText.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.roundText.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.roundText.boundingWidth = this.validWidth;
        this.roundText.setPosition(0, this.validHeight - this.roundText.height);
        this.addChild(this.roundText, 6);

        // initialize N empty players
        for (i = 0; i < this.playerMax; i++) {
            this.nameTexts[i] = new cc.LabelTTF(this.playerNames[i], this.FONT_TYPE, 24,
                cc.size(this.validWidth / 8 * this.scale, this.validHeight / 6 * this.scale));

            this.moneyTexts[i] = new cc.LabelTTF(this.moneyInitiates[i], this.FONT_TYPE, 24,
                cc.size(this.validWidth / 8 * this.scale, this.validHeight / 6 * this.scale));

            this.actionTexts[i] = new cc.LabelTTF(this.actionInitiates[i], this.FONT_TYPE, 24,
                cc.size(this.validWidth / 8 * this.scale, this.validHeight / 6 * this.scale));

            this.betTexts[i] = new cc.LabelTTF(this.betInitiates[i], this.FONT_TYPE, 24,
                cc.size(this.validWidth / 8 * this.scale, this.validHeight / 6 * this.scale));

            this.nameTexts[i].setColor(cc.color(255, 255, 255, 255));
            this.moneyTexts[i].setColor(cc.color(255, 0, 0, 255));
            this.actionTexts[i].setColor(cc.color(255, 255, 255, 255));
            this.betTexts[i].setColor(cc.color(0, 255, 0, 255));

            this.nameTexts[i].setAnchorPoint(0, 0);
            this.moneyTexts[i].setAnchorPoint(0, 0);
            this.actionTexts[i].setAnchorPoint(0, 0);
            this.betTexts[i].setAnchorPoint(0, 0);

            this.nameTexts[i].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.moneyTexts[i].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.actionTexts[i].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.betTexts[i].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);

            this.nameTexts[i].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.moneyTexts[i].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.actionTexts[i].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.betTexts[i].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);

            this.nameTexts[i].boundingWidth = this.validWidth / 6 * this.scale;
            this.moneyTexts[i].boundingWidth = this.validWidth / 6 * this.scale;
            this.actionTexts[i].boundingWidth = this.validWidth / 6 * this.scale;
            this.betTexts[i].boundingWidth = this.validWidth / 6 * this.scale;

            this.nameTexts[i].setPosition(0,
                this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
            this.moneyTexts[i].setPosition(this.validWidth / 8,
                this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
            this.actionTexts[i].setPosition(this.validWidth / 8 * 2,
                this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
            this.betTexts[i].setPosition(this.validWidth / 8 * 3,
                this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);

            this.addChild(this.nameTexts[i], 6);
            this.addChild(this.moneyTexts[i], 6);
            this.addChild(this.actionTexts[i], 6);
            this.addChild(this.betTexts[i], 6);
        }

        // draw background image
        /*
        var bgScale = 1;
        this.bgSprite = cc.Sprite.create(s_backgournd);
        // this.bgSprite.setScaleY(bgScale);
        this.bgSprite.setAnchorPoint(0, 0);
        this.bgSprite.setPosition(cc.p(100, 100));
        this.addChild(this.bgSprite, 0);
        */

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
        switch(this.gameStatus) {
            default:
            {
                break;
            }
        }
    },

    updateBg: function(dt) {
    }
});