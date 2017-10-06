/**
 * Created by the-engine-team
 * 2017-10-03
 */

var BoardLayer = cc.Layer.extend({

    // constants
    defaultFont: 'Tw Cen MT',
    roundTextFont: 'IMPACT',
    roundTextSize: '50',
    authorTextFont: this.defaultFont,
    authorTextSize: '12',
    debug: true,
    maxPlayerCount: 10,
    maxPublicCardCount: 5,

    // game model variables
    size: null,
    validWidth: 0,
    validHeight: 0,
    publicCardsModel: [],

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
    roundLabel: null,
    authorLabel: null,

    // buttons
    startButton: null,
    stopButton: null,

    // menus

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
        { x: 860, y: 340 },
        { x: 840, y: 180 },
        { x: 600, y: 100 },
        // players at left side
        { x: 280, y: 100 },
        { x:  40, y: 180 },
        { x:   0, y: 340 },
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
    authorTextHeight: 48,
    authorTextMarginBottom: 20,
    logoMarginTop: 18,
    logoMarginRight: 36,
    controlMenuMarginLeft: 18,
    controlMenuMarginBottom: 680,

    // pre-loaded frames
    pokerFrames: null,
    pokerBackFrame: null,
    pokerEmptyFrame: null,

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
        this.playerScale = this.gameScale * 0.9;
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
            this.playerLayers[playerIndex].setVisible(false);
        }

        // initialize public cards
        var publicCardIndex;
        this.publicCards = [];
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
            this.publicCards[publicCardIndex].setVisible(false);
        }

        // initialize alt frames
        this.initializeAltFrames();

        // initialize round text
        this.roundLabel = new cc.LabelTTF('', this.roundTextFont, this.roundTextSize);
        this.roundLabel.setColor(cc.color(255, 255, 255, 255));
        this.roundLabel.setAnchorPoint(0, 0);
        this.roundLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.roundLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.roundLabel.boundingWidth = this.roundTextWidth;
        this.roundLabel.boundingHeight = this.roundTextHeight;
        var shadowColor = cc.color(128, 128, 128);
        this.roundLabel.enableShadow(shadowColor, cc.size(0, -4), 0);
        this.roundLabel.setScale(this.gameScale);
        this.roundLabel
            .setPosition((this.bgSprite.getContentSize().width - this.roundLabel.getContentSize().width) / 2
                    * this.gameScale,
                        this.roundTextMarginBottom * this.gameScale);
        this.addChild(this.roundLabel, 2);

        // initialize author text
        this.authorLabel = new cc.LabelTTF('Developer: Bobi.Zhou, JP.Yang, Teresa.Wu\r\n ' +
                    'CDC Mobile Club 2017\r\n Engineering Camp 2017 Task Force',
                this.authorTextFont, this.authorTextSize);
        this.authorLabel.setColor(cc.color(255, 255, 255, 255));
        this.authorLabel.setAnchorPoint(0, 0);
        this.authorLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.authorLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.authorLabel.boundingWidth = this.authorTextWidth;
        this.authorLabel.boundingHeight = this.authorTextHeight;
        this.authorLabel.setScale(this.gameScale);
        this.authorLabel
            .setPosition((this.bgSprite.getContentSize().width - this.authorLabel.getContentSize().width) / 2
                * this.gameScale,
                this.authorTextMarginBottom * this.gameScale);
        this.addChild(this.authorLabel, 2);

        // initialize TrendMicro logo
        this.tmLogo = cc.Sprite.create(s_tm_logo);
        this.tmLogo.setAnchorPoint(0, 0);
        this.tmLogo.setScale(this.gameScale);
        this.tmLogo.setPosition((this.bgSprite.getContentSize().width -
            this.tmLogo.getContentSize().width - this.logoMarginRight) * this.gameScale,
                (this.bgSprite.getContentSize().height -
                this.tmLogo.getContentSize().height - this.logoMarginTop) * this.gameScale);
        this.addChild(this.tmLogo, 2);

        // add start and stop button
        this.controlMenuScale = this.gameScale * 0.6;

        this.startButton = ccui.Button.create(s_start_button, s_start_button_pressed, s_start_button_disabled);
        this.startButton.setAnchorPoint(0, 0);
        this.startButton.setScale(this.controlMenuScale);
        this.startButton.setPosition(this.controlMenuMarginLeft * this.gameScale,
                                     this.controlMenuMarginBottom * this.gameScale);
        this.addChild(this.startButton, 2);
        this.startButton.addTouchEventListener(function (sender, type) {
            if (ccui.Widget.TOUCH_ENDED === type) {
                console.log('start game');
                if (gameStatus !== STATUS_GAME_RUNNING) {
                    startGame();
                }
            }
        }, this);

        this.stopButton = ccui.Button.create(s_stop_button, s_stop_button_pressed, s_stop_button_disabled);
        this.stopButton.setAnchorPoint(0, 0);
        this.stopButton.setScale(this.controlMenuScale);
        this.stopButton.setPosition(this.controlMenuMarginLeft * this.gameScale,
            this.controlMenuMarginBottom * this.gameScale);
        this.addChild(this.stopButton, 2);
        this.stopButton.addTouchEventListener(function (sender, type) {
            if (ccui.Widget.TOUCH_ENDED === type) {
                console.log('start game');
                if (gameStatus === STATUS_GAME_RUNNING) {
                    stopGame();
                }
            }
        }, this);

        // add dealer layer on the top
        this.dealerLayer = new DealerLayer(this.gameScale);
        this.dealerLayer.init();
        this.dealerLayer.setAnchorPoint(0, 0);
        this.dealerLayer.setPosition(0, 0);
        this.dealerLayer.setVisible(false);
        this.addChild(this.dealerLayer, 100);

        // add winner layer on the top
        this.winnerLayer = new WinnerLayer(this.gameScale);
        this.winnerLayer.init();
        this.winnerLayer.setAnchorPoint(0, 0);
        this.winnerLayer.setPosition(0, 0);
        this.winnerLayer.setVisible(false);
        this.addChild(this.winnerLayer, 100);

        this.reset();
        this.scheduleUpdate();
    },

    // game operations
    update: function () {
        this.doUpdate();
    },

    reset: function() {

    },

    removeAll: function() {
        this.reset();
    },

    doUpdate: function() {
        this.updateLayers();
    },

    updateLayers: function() {
        switch(gameStatus) {
            case STATUS_GAME_STANDBY:
                this.showLayer(this.dealerLayer, true);
                this.showLayer(this.winnerLayer, false);
                this.updateBoardLayer();
                this.updateDealerLayer();
                break;

            case STATUS_GAME_RUNNING:
                this.showLayer(this.dealerLayer, false);
                this.showLayer(this.winnerLayer, false);
                this.updateBoardLayer();
                break;

            case STATUS_GAME_FINISHED:
                this.showLayer(this.dealerLayer, false);
                this.showLayer(this.winnerLayer, true);
                this.updateWinnerLayer();
                // this.updateBoardLayer();
                break;

            default:
                break;
        }
    },

    updateBoardLayer: function() {
        this.updateBoard();
        this.updatePlayers();
    },

    updateDealerLayer: function() {
        this.dealerLayer.update();
    },

    updateWinnerLayer: function() {

    },

    // update sub layers
    updatePlayers: function() {
        if (!players || players.length === 0) {
            // no players at all
            return;
        }
        var playerIndex;
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            if (players && players[playerIndex]) {
                this.updatePlayer(this.playerLayers[playerIndex], players[playerIndex], true);
            } else {
                this.updatePlayer(this.playerLayers[playerIndex], null, false);
            }
        }
    },

    updateBoard: function() {
        switch(gameStatus) {
            case STATUS_GAME_STANDBY:
                this.roundLabel.setString('GET READY');
                break;

            case STATUS_GAME_RUNNING:
                this.roundLabel.setString('ROUND ' + currentRound);
                // update public cards
                this.updatePublicCardsModel();
                var publicCardIndex;
                for (publicCardIndex = 0; publicCardIndex < this.maxPublicCardCount; publicCardIndex++) {
                    if (this.publicCardsModel[publicCardIndex] === null ||
                        '' === this.publicCardsModel[publicCardIndex]) {
                        this.changeSpriteImage(this.publicCards[publicCardIndex], this.pokerBackFrame);
                    } else {
                        this.changeSpriteImage(this.publicCards[publicCardIndex],
                            this.pokerFrames.get(this.publicCardsModel[publicCardIndex]));
                    }
                    this.publicCards[publicCardIndex].setVisible(true);
                }
                break;

            case STATUS_GAME_FINISHED:
                this.roundLabel.setString('GAME OVER');
                break;

            default:
                break;
        }
    },

    updatePublicCardsModel: function() {
        this.publicCardsModel = publicCards;
    },

    // UI helpers
    showLayer: function(layer, show) {
        layer.setVisible(show);
        layer.eventListener.swallowTouches = show;
    },

    updatePlayer: function(playerLayer, player, show) {
        if (playerLayer) {
            playerLayer.setPlayer(player);
            playerLayer.setVisible(show);
            if (show) {
                playerLayer.update();
            }
        }
    },

    initializeAltFrames: function() {
        var index;
        this.pokerBackFrame = cc.SpriteFrame.create(s_p_back, cc.rect(0, 0,
            this.publicCards[0].getContentSize().width, this.publicCards[0].getContentSize().height));

        this.pokerEmptyFrame = cc.SpriteFrame.create(s_p_empty, cc.rect(0, 0,
            this.publicCards[0].getContentSize().width, this.publicCards[0].getContentSize().height));

        var pokerKeys = pokerMap.keys();
        this.pokerFrames = new Map();
        for (index = 0; index < pokerKeys.length; index++) {
            var pokerFrame = cc.SpriteFrame.create(pokerMap.get(pokerKeys[index]), cc.rect(0, 0,
                this.publicCards[0].getContentSize().width, this.publicCards[0].getContentSize().height));
            this.pokerFrames.set(pokerKeys[index], pokerFrame);
        }
    },

    changeSpriteImage: function(sprite, srcFrame) {
        if (sprite) {
            sprite.setSpriteFrame(srcFrame);
        }
    }
});
