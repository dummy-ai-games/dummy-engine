/**
 * Created by Strawmanbobi
 * 2017-08-21
 */

// logic related
var STATUS_WAITING_FOR_PLAYERS = 0;
var STATUS_GAME_RUNNING = 1;
var STATUS_GAME_FINISHED = 2;

var gameStatus = STATUS_WAITING_FOR_PLAYERS;

var currentRound = 1;
var players = [];
var currentPlayers = 0;
var playerNames = ["Tom", "Mary", "Jerry", "Alex"];

var publicCards = [];

// visualization related

var GameLayer = cc.Layer.extend({

    defaultFont: 'Arial',
    // game logic variables
    size: null,
    validWidth: 0,
    validHeight: 0,

    defaultMoneyInit: 3000,
    defaultBetInit: 0,
    playerMax: 3,
    publicCardMax: 5,
    privateCardMax: 2,
    currentPublicCard: 0,
    currentPrivateCard: 0,
    moneyInitiates: [],
    betInitiates: [],
    actionInitiates: [],

    // canvas scale
    bgScale: 1.0,
    cardScale: 1.0,
    cardWidth: 0.0,
    cardHeight: 0.0,

    // sprites
    bgSprite: null,
    playerLayer: [],
    avatarSprites: [],
    privateCardSprites: [],
    publicCardSprites: [],

    // buttons

    // texts
    roundText: null,
    nameTexts: [],
    moneyTexts: [],
    actionTexts: [],
    betTexts: [],

    // menus

    // layers

    // constructor
    ctor: function () {
        this._super();
    },

    // game initializer
    init: function () {
        this._super();

        // initiate sprite layout on gameCanvas
        var i;
        for (i = 0; i < this.playerMax; i++) {
            this.moneyInitiates[i] = "left: " + this.defaultMoneyInit;
            this.actionInitiates[i] = "No Action";
            this.betInitiates[i] = "bet: " + this.defaultBetInit;
        }

        this.validWidth = document.documentElement.clientWidth;
        this.validHeight = document.documentElement.clientHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        //  initiate background
        this.bgSprite = new cc.Sprite.create(bg, cc.rect(0, 0,
            this.validWidth, this.validHeight));
        this.bgSprite.setAnchorPoint(0, 0);
        this.addChild(this.bgSprite);

        // show round N text at the center | top
        this.roundText = new cc.LabelTTF("Round " + currentRound, this.defaultFont, 32,
            cc.size(this.validWidth / 8 * this.scale, this.validHeight / 4 * this.scale));
        this.roundText.setColor(cc.color(255, 255, 255, 255));

        this.roundText.setAnchorPoint(0, 0);
        this.roundText.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        this.roundText.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.roundText.boundingWidth = this.validWidth / 8 * this.scale;
        this.roundText.setPosition(this.validWidth / 8  * this.scale, this.validHeight - this.roundText.height);
        this.addChild(this.roundText, 6);

        // initialize N empty players
        for (i = 0; i < this.playerMax; i++) {
            this.nameTexts[i] = new cc.LabelTTF("Wait...", this.defaultFont, 24,
                cc.size(this.validWidth / 8 * this.scale, this.validHeight / 6 * this.scale));

            this.moneyTexts[i] = new cc.LabelTTF("0", this.defaultFont, 24,
                cc.size(this.validWidth / 8 * this.scale, this.validHeight / 6 * this.scale));

            this.actionTexts[i] = new cc.LabelTTF("No Action", this.defaultFont, 24,
                cc.size(this.validWidth / 8 * this.scale, this.validHeight / 6 * this.scale));

            this.betTexts[i] = new cc.LabelTTF("0", this.defaultFont, 24,
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

            this.nameTexts[i].boundingWidth = this.validWidth / 8 * this.scale;
            this.moneyTexts[i].boundingWidth = this.validWidth / 8 * this.scale;
            this.actionTexts[i].boundingWidth = this.validWidth / 8 * this.scale;
            this.betTexts[i].boundingWidth = this.validWidth / 8 * this.scale;

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

            // create private card sprite
            this.privateCardSprites[i] = new Array();
            this.privateCardSprites[i][0] = cc.Sprite.create(s_p_empty);
            this.privateCardSprites[i][1] = cc.Sprite.create(s_p_empty);

            this.privateCardSprites[i][0].setAnchorPoint(0, 0);
            this.privateCardSprites[i][1].setAnchorPoint(0, 0);

            this.privateCardSprites[i][0].setPosition(cc.p(this.validWidth / 8 * 4,
                this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height));
            this.privateCardSprites[i][1].setPosition(cc.p(this.validWidth / 8 * 5,
                this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height));

            // calculate card sprite scale for the screen
            this.cardScale = this.validHeight / 8 / this.privateCardSprites[i][0].height;
            this.privateCardSprites[i][0].setScale(this.cardScale);
            this.privateCardSprites[i][1].setScale(this.cardScale);

            this.addChild(this.privateCardSprites[i][0], 6);
            this.addChild(this.privateCardSprites[i][1], 6);
        }

        this.publicCardSprites = new Array();
        this.publicCardSprites[0] = cc.Sprite.create(s_p_empty);
        this.publicCardSprites[1] = cc.Sprite.create(s_p_empty);
        this.publicCardSprites[2] = cc.Sprite.create(s_p_empty);
        this.publicCardSprites[3] = cc.Sprite.create(s_p_empty);
        this.publicCardSprites[4] = cc.Sprite.create(s_p_empty);

        this.publicCardSprites[0].setAnchorPoint(0, -0.5);
        this.publicCardSprites[1].setAnchorPoint(0, -0.5);
        this.publicCardSprites[2].setAnchorPoint(0, -0.5);
        this.publicCardSprites[3].setAnchorPoint(0, -0.5);
        this.publicCardSprites[4].setAnchorPoint(0, -0.5);

        this.publicCardSprites[0].setPosition(cc.p(this.validWidth / 8 * 2, this.validHeight - this.roundText.height));
        this.publicCardSprites[1].setPosition(cc.p(this.validWidth / 8 * 3, this.validHeight - this.roundText.height));
        this.publicCardSprites[2].setPosition(cc.p(this.validWidth / 8 * 4, this.validHeight - this.roundText.height));
        this.publicCardSprites[3].setPosition(cc.p(this.validWidth / 8 * 5, this.validHeight - this.roundText.height));
        this.publicCardSprites[4].setPosition(cc.p(this.validWidth / 8 * 6, this.validHeight - this.roundText.height));

        // calculate card sprite scale for the screen
        this.cardScale = this.validHeight / 8 / this.publicCardSprites[0].height;
        this.publicCardSprites[0].setScale(this.cardScale);
        this.publicCardSprites[1].setScale(this.cardScale);
        this.publicCardSprites[2].setScale(this.cardScale);
        this.publicCardSprites[3].setScale(this.cardScale);
        this.publicCardSprites[4].setScale(this.cardScale);

        this.addChild(this.publicCardSprites[0], 6);
        this.addChild(this.publicCardSprites[1], 6);
        this.addChild(this.publicCardSprites[2], 6);
        this.addChild(this.publicCardSprites[3], 6);
        this.addChild(this.publicCardSprites[4], 6);

        // kick start the game
        // test public card change display frame
        publicCards = new Array();
        this.reset();
        this.scheduleUpdate();
    },

    // update callback function
    update: function (dt) {
        this.doUpdate();
    },

    /****** game logic ******/
    reset: function() {
        // initiate players
        players = new Array();
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
        switch(gameStatus) {
            case STATUS_WAITING_FOR_PLAYERS:
            {
                this.updateRound();
                this.updatePlayers();
                this.updatePublicCards();
                break;
            }

            case STATUS_GAME_RUNNING:
            {
                this.updateRound();
                this.updatePlayers();
                this.updatePublicCards();
                break;
            }

            case STATUS_GAME_FINISHED:
            {
                this.updateRound();
                this.updatePlayers();
                this.updatePublicCards();
                break;
            }

            default:
            {
                break;
            }
        }
    },

    updateRound: function() {
        this.roundText.setString("Round " + currentRound);
    },

    updatePlayers: function() {
        var i;
        for (i = 0; i < currentPlayers; i++) {
            this.nameTexts[i].setString(players[i].name);

            if (players[i].status == playerStatusAlive) {
                this.nameTexts[i].setColor(cc.color(0, 255, 255, 255));
            } else {
                this.nameTexts[i].setColor(cc.color(255, 0, 0, 255));
            }

            this.moneyTexts[i].setString(players[i].gold);
            this.betTexts[i].setString(players[i].bet);
            this.actionTexts[i].setString(players[i].action);

            if (players[i].inTurn == 1) {
                this.actionTexts[i].setColor(cc.color(255, 0, 0, 255));
            } else {
                this.actionTexts[i].setColor(cc.color(255, 255, 255, 255));
            }

            // draw private cards
            var privateCard0 = players[i].privateCards[0];
            if (privateCard0) {
                var cardName1 = pokerMap.get(privateCard0);
                var frame1 = cc.SpriteFrame.create(cardName1, cc.rect(0, 0,
                    this.privateCardSprites[i][0].width, this.privateCardSprites[i][0].height));
                this.privateCardSprites[i][0].setSpriteFrame(frame1);
            }
            var privateCard1 = players[i].privateCards[1];
            if (privateCard1) {
                var cardName2 = pokerMap.get(privateCard1);
                var frame2 = cc.SpriteFrame.create(cardName2, cc.rect(0, 0,
                    this.privateCardSprites[i][1].width, this.privateCardSprites[i][1].height));
                this.privateCardSprites[i][1].setSpriteFrame(frame2);
            }
        }
    },

    updatePublicCards: function() {
        var i = 0;

        // clear public cards
        for (i = 0; i < this.publicCardMax; i++) {
            var frame = cc.SpriteFrame.create(s_p_back, cc.rect(0, 0,
                this.publicCardSprites[i].width, this.publicCardSprites[i].height));
            this.publicCardSprites[i].setSpriteFrame(frame);
        }

        for (i = 0; i < this.publicCardMax; i++) {
            if (publicCards[i] != null) {
                var cardName = pokerMap.get(publicCards[i]);
                var frame = cc.SpriteFrame.create(cardName, cc.rect(0, 0,
                        this.publicCardSprites[i].width, this.publicCardSprites[i].height));
                this.publicCardSprites[i].setSpriteFrame(frame);
            }
        }
    },

    updateBg: function() {
        // do not update background in this game
    }
});