/**
 * Created by the-engine-team
 * 2017-08-21
 */

// model related
var STATUS_WAITING_FOR_PLAYERS = 0;
var STATUS_GAME_RUNNING = 1;
var STATUS_GAME_FINISHED = 2;

var gameStatus = STATUS_WAITING_FOR_PLAYERS;

var currentRound = 1;
var players = [];
var currentPlayers = 0;

var publicCards = [];

// visualization related

var GameLayer = cc.Layer.extend({

    defaultFont: 'Arial',
    // game model variables
    size: null,
    validWidth: 0,
    validHeight: 0,

    defaultMoneyInit: 1000,
    defaultBetInit: 0,
    playerMax: 10,
    publicCardMax: 5,
    privateCardMax: 2,
    currentPublicCard: 0,
    currentPrivateCard: 0,
    moneyInitiates: [],
    betInitiates: [],
    actionInitiates: [],

    // canvas scale
    scale: 1.0,
    playerScale: 0.8,
    bgScale: 1.2,
    privateCardScale: 1.0,
    publicCardScale: 1.0,
    avatarScale: 1.0,
    controlMenuScale: 1.0,
    cardWidth: 0.0,
    cardHeight: 0.0,

    // sub layers
    playerLayers: [],

    // sprites
    bgSprite: null,
    avatarSprites: [],
    privateCardSprites: [],
    publicCardSprites: [],

    // buttons
    startButton: null,


    // menus
    controlMenu: null,

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
        this.bgSprite.setScale(this.bgScale);
        this.bgSprite.setPosition(0, 0);
        this.addChild(this.bgSprite);

        // show round N text at the center | top
        this.roundText = new cc.LabelTTF("Round " + currentRound, this.defaultFont, 24,
            cc.size(this.validWidth / 8 * this.playerScale, this.validHeight / 4 * this.playerScale));
        this.roundText.setColor(cc.color(255, 255, 255, 255));

        this.roundText.setAnchorPoint(0, 0);
        this.roundText.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        this.roundText.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.roundText.boundingWidth = this.validWidth / 12 * this.playerScale;
        this.roundText.setPosition(this.validWidth / 16  * this.playerScale, this.validHeight - this.roundText.height);
        this.addChild(this.roundText, 6);

        // initialize N empty players
        for (i = 0; i < this.playerMax; i++) {

            this.nameTexts[i] = new cc.LabelTTF("Wait...", this.defaultFont, 24,
                cc.size(this.validWidth / 16 * this.playerScale, this.validHeight / 5 * this.playerScale));

            this.avatarSprites[i] = new cc.Sprite.create(s_a_avatar_none);

            this.moneyTexts[i] = new cc.LabelTTF("0", this.defaultFont, 24,
                cc.size(this.validWidth / 16 * this.playerScale, this.validHeight / 5 * this.playerScale));

            this.actionTexts[i] = new cc.LabelTTF("No Action", this.defaultFont, 24,
                cc.size(this.validWidth / 16 * this.playerScale, this.validHeight / 5 * this.playerScale));

            this.betTexts[i] = new cc.LabelTTF("0", this.defaultFont, 24,
                cc.size(this.validWidth / 16 * this.playerScale, this.validHeight / 5 * this.playerScale));

            this.nameTexts[i].setColor(cc.color(255, 255, 255, 255));
            this.moneyTexts[i].setColor(cc.color(255, 0, 0, 255));
            this.actionTexts[i].setColor(cc.color(255, 255, 255, 255));
            this.betTexts[i].setColor(cc.color(0, 255, 0, 255));

            this.nameTexts[i].setAnchorPoint(0, 0);
            this.moneyTexts[i].setAnchorPoint(0, 0);
            this.avatarSprites[i].setAnchorPoint(0, 0);
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

            this.nameTexts[i].boundingWidth = this.validWidth / 8 * this.playerScale;
            this.moneyTexts[i].boundingWidth = this.validWidth / 8 * this.playerScale;
            this.actionTexts[i].boundingWidth = this.validWidth / 8 * this.playerScale;
            this.betTexts[i].boundingWidth = this.validWidth / 8 * this.playerScale;

            this.avatarScale = this.validHeight / 12 / this.avatarSprites[i].height;
            this.avatarSprites[i].setScale(this.avatarScale);
            this.avatarSprites[i].setAnchorPoint(-0.5, -0.5);

            if (i < 5) {
                // put them in the left side
                this.avatarSprites[i].setPosition(this.validWidth / 16 * 0 + 20,
                    this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
                this.nameTexts[i].setPosition(this.validWidth / 16 * 1,
                    this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
                this.moneyTexts[i].setPosition(this.validWidth / 16 * 2,
                    this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
                this.actionTexts[i].setPosition(this.validWidth / 16 * 3,
                    this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
                this.betTexts[i].setPosition(this.validWidth / 16 * 4,
                    this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height);
            } else {
                // put them in the right side
                this.avatarSprites[i].setPosition(this.validWidth / 16 * 8 + 20,
                    this.validHeight - this.nameTexts[i].height * (i - 5 + 1) - this.roundText.height);
                this.nameTexts[i].setPosition(this.validWidth / 16 * 9,
                    this.validHeight - this.nameTexts[i].height * (i - 5 + 1) - this.roundText.height);
                this.moneyTexts[i].setPosition(this.validWidth / 16 * 10,
                    this.validHeight - this.nameTexts[i].height * (i - 5 + 1) - this.roundText.height);
                this.actionTexts[i].setPosition(this.validWidth / 16 * 11,
                    this.validHeight - this.nameTexts[i].height * (i - 5 + 1) - this.roundText.height);
                this.betTexts[i].setPosition(this.validWidth / 16 * 12,
                    this.validHeight - this.nameTexts[i].height * (i - 5 + 1) - this.roundText.height);
            }

            // set invisible after initialized
            this.avatarSprites[i].setVisible(false);
            this.nameTexts[i].setVisible(false);
            this.moneyTexts[i].setVisible(false);
            this.actionTexts[i].setVisible(false);
            this.betTexts[i].setVisible(false);

            this.addChild(this.avatarSprites[i], 6);
            this.addChild(this.nameTexts[i], 6);
            this.addChild(this.moneyTexts[i], 6);
            this.addChild(this.actionTexts[i], 6);
            this.addChild(this.betTexts[i], 6);

            // create private card sprite
            this.privateCardSprites[i] = [];
            this.privateCardSprites[i][0] = cc.Sprite.create(s_p_back);
            this.privateCardSprites[i][1] = cc.Sprite.create(s_p_back);

            this.privateCardSprites[i][0].setAnchorPoint(0, -0.25);
            this.privateCardSprites[i][1].setAnchorPoint(0, -0.25);

            if (i < 5) {
                this.privateCardSprites[i][0].setPosition(cc.p(this.validWidth / 16 * 6,
                    this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height));
                this.privateCardSprites[i][1].setPosition(cc.p(this.validWidth / 16 * 6 + 20,
                    this.validHeight - this.nameTexts[i].height * (i + 1) - this.roundText.height - 20));
            } else {
                this.privateCardSprites[i][0].setPosition(cc.p(this.validWidth / 16 * 14,
                    this.validHeight - this.nameTexts[i].height * (i - 5 + 1) - this.roundText.height));
                this.privateCardSprites[i][1].setPosition(cc.p(this.validWidth / 16 * 14 + 20,
                    this.validHeight - this.nameTexts[i].height * (i - 5 + 1) - this.roundText.height - 20));
            }

            // calculate card sprite scale for the screen
            this.privateCardScale = this.validHeight / 10 / this.privateCardSprites[i][0].height;
            this.privateCardSprites[i][0].setScale(this.privateCardScale);
            this.privateCardSprites[i][1].setScale(this.privateCardScale);

            this.privateCardSprites[i][0].setVisible(false);
            this.privateCardSprites[i][1].setVisible(false);

            this.addChild(this.privateCardSprites[i][0], 7);
            this.addChild(this.privateCardSprites[i][1], 6);
        }

        this.publicCardSprites = [];
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

        this.publicCardSprites[0].setPosition(cc.p(this.validWidth / 16 * 5, this.validHeight - this.roundText.height));
        this.publicCardSprites[1].setPosition(cc.p(this.validWidth / 16 * 6, this.validHeight - this.roundText.height));
        this.publicCardSprites[2].setPosition(cc.p(this.validWidth / 16 * 7, this.validHeight - this.roundText.height));
        this.publicCardSprites[3].setPosition(cc.p(this.validWidth / 16 * 8, this.validHeight - this.roundText.height));
        this.publicCardSprites[4].setPosition(cc.p(this.validWidth / 16 * 9, this.validHeight - this.roundText.height));

        // calculate card sprite scale for the screen
        this.publicCardScale = this.validHeight / 10 / this.publicCardSprites[0].height;
        this.publicCardSprites[0].setScale(this.publicCardScale);
        this.publicCardSprites[1].setScale(this.publicCardScale);
        this.publicCardSprites[2].setScale(this.publicCardScale);
        this.publicCardSprites[3].setScale(this.publicCardScale);
        this.publicCardSprites[4].setScale(this.publicCardScale);

        this.publicCardSprites[0].setVisible(false);
        this.publicCardSprites[1].setVisible(false);
        this.publicCardSprites[2].setVisible(false);
        this.publicCardSprites[3].setVisible(false);
        this.publicCardSprites[4].setVisible(false);

        this.addChild(this.publicCardSprites[0], 6);
        this.addChild(this.publicCardSprites[1], 6);
        this.addChild(this.publicCardSprites[2], 6);
        this.addChild(this.publicCardSprites[3], 6);
        this.addChild(this.publicCardSprites[4], 6);

        // add game start button
        this.startButton = cc.MenuItemImage.create(
            btn_start,
            btn_start_clicked,
            function () {
                console.log("game start");
                startGame();
            },this);
        this.controlMenuScale = this.validHeight / 16 / this.startButton.height;
        this.startButton.setScale(this.controlMenuScale);
        this.startButton.setAnchorPoint(0, 0.5);
        this.controlMenu = cc.Menu.create(this.startButton);
        this.controlMenu.setPosition(cc.p(this.validWidth / 16 * 2, this.validHeight - this.roundText.height / 2));
        this.addChild(this.controlMenu);

        // kick start the game
        // test public card change display frame
        publicCards = [];
        this.reset();
        this.scheduleUpdate();
    },

    // update callback function
    update: function (dt) {
        this.doUpdate();
    },

    /****** game model ******/
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
        switch(gameStatus) {
            case STATUS_WAITING_FOR_PLAYERS:
                this.updateRound();
                this.updatePlayers();
                this.updatePublicCards(false);
                break;
            case STATUS_GAME_RUNNING:
                this.updateRound();
                this.updatePlayers();
                this.updatePublicCards(true);
                break;
            case STATUS_GAME_FINISHED:
                this.updateRound();
                this.updatePlayers();
                this.updatePublicCards(true);
                break;

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
        // first, hide all players
        for (i = 0; i < this.maxPlayers; i++) {
            this.nameTexts.setVisible(false);
            this.avatarSprites[i].setVisible(false);
            this.nameTexts[i].setVisible(false);
            this.moneyTexts[i].setVisible(false);
            this.betTexts[i].setVisible(false);
            this.actionTexts[i].setVisible(false);
            this.privateCardSprites[i][0].setVisible(false);
            this.privateCardSprites[i][1].setVisible(false);
        }

        for (i = 0; i < currentPlayers; i++) {
            this.nameTexts[i].setString(players[i].id);
            this.nameTexts[i].setVisible(true);

            // update avatar
            var avatar = avartarSamples[i];
            var avatarFrame = cc.SpriteFrame.create(avatar, cc.rect(0, 0,
                this.avatarSprites[i].width, this.avatarSprites[i].height));
            this.avatarSprites[i].setSpriteFrame(avatarFrame);
            this.avatarSprites[i].setVisible(true);

            if (players[i].status === playerStatusAlive) {
                this.nameTexts[i].setColor(cc.color(0, 255, 255, 255));
            } else {
                this.nameTexts[i].setColor(cc.color(255, 0, 0, 255));
            }
            this.nameTexts[i].setVisible(true);

            this.moneyTexts[i].setString(players[i].gold);
            this.betTexts[i].setString(players[i].bet);
            this.actionTexts[i].setString(players[i].action);

            this.moneyTexts[i].setVisible(true);
            this.betTexts[i].setVisible(true);

            if (players[i].inTurn === 1) {
                this.actionTexts[i].setColor(cc.color(255, 0, 0, 255));
            } else {
                this.actionTexts[i].setColor(cc.color(255, 255, 255, 255));
            }
            this.actionTexts[i].setVisible(true);

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

            this.privateCardSprites[i][0].setVisible(true);
            this.privateCardSprites[i][1].setVisible(true);
        }
    },

    updatePublicCards: function(visible) {
        var i;
        // clear public cards
        var frame;
        for (i = 0; i < this.publicCardMax; i++) {
            frame = cc.SpriteFrame.create(s_p_back, cc.rect(0, 0,
                this.publicCardSprites[i].width, this.publicCardSprites[i].height));
            this.publicCardSprites[i].setSpriteFrame(frame);
        }

        for (i = 0; i < this.publicCardMax; i++) {
            if (publicCards[i]) {
                var cardName = pokerMap.get(publicCards[i]);
                frame = cc.SpriteFrame.create(cardName, cc.rect(0, 0,
                        this.publicCardSprites[i].width, this.publicCardSprites[i].height));
                this.publicCardSprites[i].setSpriteFrame(frame);
            }
            this.publicCardSprites[i].setVisible(visible);
        }
    },

    updateBg: function() {
        // do not update background in this game
    }
});
