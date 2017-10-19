/**
 * Created by the-engine-team
 * 2017-10-15
 */

var ScoreLayer = cc.LayerColor.extend({

    // constants
    titleFont: 'IMPACT',
    titleTextSize: 36,
    playerFont: 'Tw Cen MT',
    playerTextSize: 20,
    cardsInfoFont: 'Tw Cen MT',
    cardsInfoTextSize: 16,
    debug: true,

    // game_services model variables
    size: null,
    validWidth: 0,
    validHeight: 0,
    maxPlayerCount: 10,
    maxCardsCount: 7,
    maxMedalCount: 3,
    players: [],

    // pre-loaded frames
    pokerFrames: null,
    pokerBackFrame: null,
    pokerEmptyFrame: null,

    // scales
    gameScale: 1.0,
    cardScale: 1.0,
    medalScale: 1.0,

    // sprites
    playerHands: [],
    medals: [],

    // labels
    titleLabel: null,
    scoreLabels: [],
    cardsInfo: [],

    // buttons
    reloadButton: null,

    // menus

    // layers

    // design specs
    titleTextWidth: 960,
    titleTextHeight: 64,
    titleTextMarginBottom: 680,
    scoreTextWidth: 400,
    scoreTextHeight: 24,
    scoreTextsMarginBottom: 640,
    scoreTextMarginTop: 100,
    cardMarginTop: 0,
    cardMarginLeft: -12,
    cardWidth: 207,
    cardHeight: 290,
    cardWidthSpec: 57,
    cardHeightSpec: 80,
    reloadButtonMarginBottom: 10,
    medalMarginRight: 10,

    // event managers
    eventListener: null,

    // constructor
    ctor: function (gameScale) {
        this._super();
        this.gameScale = gameScale;
    },

    // game_services initializer
    init: function () {
        this._super(cc.color(15, 15, 15, 239));

        // initiate layout on DealerLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // initialize title
        this.titleLabel= new cc.LabelTTF('Round 1 Clear', this.titleFont, this.titleTextSize);
        this.titleLabel.setColor(cc.color(255, 255, 0, 255));
        this.titleLabel.setAnchorPoint(0, 0);
        this.titleLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.titleLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.titleLabel.boundingWidth = this.titleTextWidth;
        this.titleLabel.boundingHeight = this.titleTextHeight;
        this.titleLabel.setScale(this.gameScale);
        this.titleLabel
            .setPosition((this.validWidth -
                this.titleLabel.getContentSize().width * this.gameScale) / 2,
                    this.titleTextMarginBottom * this.gameScale);
        this.addChild(this.titleLabel, 2);

        // initialize player score labels
        var playerIndex;
        this.scoreLabels = [];
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            this.scoreLabels[playerIndex] = new cc.LabelTTF('player ' + playerIndex + ' $20000',
                this.playerFont, this.playerTextSize);
            this.scoreLabels[playerIndex].setColor(cc.color(255, 255, 255, 255));
            this.scoreLabels[playerIndex].setAnchorPoint(0, 0);
            this.scoreLabels[playerIndex].setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
            this.scoreLabels[playerIndex].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_TOP);
            this.scoreLabels[playerIndex].boundingWidth = this.scoreTextWidth;
            this.scoreLabels[playerIndex].boundingHeight = this.scoreTextHeight;
            this.scoreLabels[playerIndex].setScale(this.gameScale);
            if (playerIndex < 5) {
                this.scoreLabels[playerIndex]
                    .setPosition(this.validWidth / 10,
                        (this.scoreTextsMarginBottom -
                            (this.scoreLabels[playerIndex].getContentSize().height + this.scoreTextMarginTop)
                            * playerIndex) * this.gameScale);
            } else {
                this.scoreLabels[playerIndex]
                    .setPosition(this.validWidth / 10 * 6,
                        (this.scoreTextsMarginBottom -
                            (this.scoreLabels[playerIndex].getContentSize().height + this.scoreTextMarginTop)
                            * (playerIndex - 5)) *
                                this.gameScale);
            }
            this.addChild(this.scoreLabels[playerIndex], 2);
        }

        // initialize medals
        var medalIndex;
        this.medals = [];
        for (medalIndex = 0; medalIndex < this.maxMedalCount; medalIndex++) {
            this.medals[medalIndex] = new cc.Sprite(medalArray[medalIndex]);
            this.medals[medalIndex].setAnchorPoint(0, 0);
            this.medalScale = this.gameScale * 0.6;
            this.medals[medalIndex].setScale(this.medalScale);
            this.medals[medalIndex].setPosition(this.scoreLabels[0].getPositionX() -
                this.medals[medalIndex].getContentSize().width * this.medalScale -
                this.medalMarginRight * this.gameScale,
                    this.scoreLabels[medalIndex].getPositionY() -
                    this.medals[medalIndex].getContentSize().height * this.medalScale);

            this.addChild(this.medals[medalIndex], 2);
        }

        // initialize player hands
        this.playerHands = []; // this is a 2-dimension array indicating hand cards of players
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            this.playerHands[playerIndex] = [];
            this.cardScale = this.gameScale * 0.25;
            var cardPosY = this.scoreLabels[playerIndex].getPositionY() - this.cardMarginTop * this.gameScale -
                this.cardHeight * this.cardScale;
            var cardPosX = this.scoreLabels[playerIndex].getPositionX();
            for (var cardIndex = 0; cardIndex < this.maxCardsCount; cardIndex++) {
                this.playerHands[playerIndex][cardIndex] = new cc.Sprite(s_p_2C);
                this.playerHands[playerIndex][cardIndex].setAnchorPoint(0, 0);
                this.playerHands[playerIndex][cardIndex].setScale(this.cardScale);
                this.playerHands[playerIndex][cardIndex]
                    .setPosition(cardPosX + (cardIndex *
                        (this.cardWidth * this.cardScale + this.cardMarginLeft * this.gameScale)),
                        cardPosY);

                this.addChild(this.playerHands[playerIndex][cardIndex], 2);
            }
        }
        this.initializeAltFrames();

        // initialize cards info
        this.cardsInfo = [];
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            this.cardsInfo[playerIndex] = new cc.LabelTTF('Rank: 100 (Full house)',
                this.cardsInfoFont, this.cardsInfoTextSize);
            this.cardsInfo[playerIndex].setColor(cc.color(255, 255, 255, 255));
            this.cardsInfo[playerIndex].setAnchorPoint(0, 0);
            this.cardsInfo[playerIndex].setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
            this.cardsInfo[playerIndex].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_TOP);
            this.cardsInfo[playerIndex].boundingWidth = this.scoreTextWidth;
            this.cardsInfo[playerIndex].boundingHeight = this.scoreTextHeight;
            this.cardsInfo[playerIndex].setScale(this.gameScale);
            this.cardsInfo[playerIndex]
                .setPosition(this.playerHands[playerIndex][6].getPositionX() +
                    this.playerHands[playerIndex][6].getContentSize().width * this.cardScale -
                    this.cardsInfo[playerIndex].getContentSize().width * this.gameScale,
                    this.playerHands[playerIndex][6].getPositionY() -
                    this.cardsInfo[playerIndex].getContentSize().height * this.gameScale);
            this.addChild(this.cardsInfo[playerIndex], 2);
        }

        if (playMode === MODE_PLAYER) {
            this.reloadButton = new ccui.Button(s_o_reload_button,
                                                   s_o_reload_button_pressed,
                                                   s_o_reload_button_disabled);
            this.reloadButton.setAnchorPoint(0, 0);
            this.reloadButton.setScale(this.gameScale * 0.8);
            this.reloadButton.setPosition((this.validWidth -
                this.reloadButton.getContentSize().width * this.gameScale) / 2,
                this.reloadButtonMarginBottom);
            this.addChild(this.reloadButton, 2);
            this.reloadButton.addTouchEventListener(function (sender, type) {
                if (ccui.Widget.TOUCH_ENDED === type) {
                    if (STATUS_GAME_RUNNING === gameStatus) {
                        console.log('reload');
                        reload();
                    }
                }
            }, this);
        }

        // event management
        this.eventListener = new cc.EventListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (/*touch, event*/) {
                return true;
            },
            // trigger when moving touch
            onTouchMoved: function (/*touch, event*/) {
                return true;
            },
            // process the touch end event
            onTouchEnded: function (/*touch, event*/) {
                return true;
            }
        });
        cc.eventManager.addListener(this.eventListener, this);
    },

    // game_services operations
    update: function () {
        this.doUpdate();
    },

    reset: function() {
    },

    removeAll: function() {
        this.reset();
    },

    doUpdate: function() {
        // update round label
        this.titleLabel.setString('Round ' + currentRound + ' Clear');

        // update score label
        var playerIndex;
        if (this.players) {
            for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
                // update score stats
                if (this.scoreLabels && this.scoreLabels[playerIndex] && playerIndex < this.players.length) {
                    // handle dead players
                    if (!this.players[playerIndex].isSurvive) {
                        this.scoreLabels[playerIndex].setString(this.players[playerIndex].displayName + ' : K.O');
                        this.scoreLabels[playerIndex].setVisible(true);
                        for (cardIndex = 0; cardIndex < this.maxCardsCount; cardIndex++) {
                            this.changeSpriteImage(this.playerHands[playerIndex][cardIndex],
                                this.pokerEmptyFrame);
                            this.playerHands[playerIndex][cardIndex].setVisible(false);
                        }
                        this.cardsInfo[playerIndex].setString('');
                        this.cardsInfo[playerIndex].setVisible(false);
                        continue;
                    }

                    // update prize
                    var prizeString = this.players[playerIndex].displayName + ' : ' + this.players[playerIndex].chips;
                    if (null !== this.players[playerIndex].prize) {
                        var originalChip = parseInt(this.players[playerIndex].chips) -
                            parseInt(this.players[playerIndex].prize);
                        prizeString += '(' + originalChip + '+' + this.players[playerIndex].prize + ')';
                    }
                    this.scoreLabels[playerIndex].setString(prizeString);
                    this.scoreLabels[playerIndex].setVisible(true);

                    // update hands
                    if (this.players[playerIndex].hand && this.players[playerIndex].hand.cards) {
                        var cardIndex;
                        for (cardIndex = 0; cardIndex < this.players[playerIndex].hand.cards.length; cardIndex++) {
                            if (null !== this.players[playerIndex].hand.cards[cardIndex] &&
                                '' !== this.players[playerIndex].hand.cards[cardIndex]) {
                                this.changeSpriteImage(this.playerHands[playerIndex][cardIndex],
                                    this.pokerFrames.get(this.players[playerIndex].hand.cards[cardIndex]));
                                this.playerHands[playerIndex][cardIndex].setVisible(true);
                            } else {
                                this.changeSpriteImage(this.playerHands[playerIndex][cardIndex],
                                    this.pokerEmptyFrame);
                                this.playerHands[playerIndex][cardIndex].setVisible(false);
                            }
                        }
                    } else {
                        for (cardIndex = 0; cardIndex < this.maxCardsCount; cardIndex++) {
                            this.changeSpriteImage(this.playerHands[playerIndex][cardIndex],
                                this.pokerEmptyFrame);
                            this.playerHands[playerIndex][cardIndex].setVisible(false);
                        }
                    }

                    // update cards information
                    if (this.players[playerIndex].hand &&
                        this.players[playerIndex].hand.rank &&
                        this.players[playerIndex].hand.message) {
                        this.cardsInfo[playerIndex].setString(this.players[playerIndex].hand.message + '! rank: ' +
                            this.players[playerIndex].hand.rank.toFixed(1));
                        this.cardsInfo[playerIndex].setVisible(true);
                    } else {
                        this.cardsInfo[playerIndex].setString('');
                        this.cardsInfo[playerIndex].setVisible(false);
                    }
                } else {
                    this.scoreLabels[playerIndex].setString('');
                    this.scoreLabels[playerIndex].setVisible(false);
                    for (cardIndex = 0; cardIndex < this.maxCardsCount; cardIndex++) {
                        this.changeSpriteImage(this.playerHands[playerIndex][cardIndex],
                            this.pokerEmptyFrame);
                        this.playerHands[playerIndex][cardIndex].setVisible(false);
                    }
                    this.cardsInfo[playerIndex].setString('');
                    this.cardsInfo[playerIndex].setVisible(false);
                }
            }
        }
    },

    setPlayers: function(_players) {
        this.players = _players;
        if (this.players) {
            this.players.sort(compare);
        }
    },

    // UI helpers
    initializeAltFrames: function() {
        var index;
        var cardSprite = this.playerHands[0][0];
        this.pokerBackFrame = new cc.SpriteFrame(s_p_back, cc.rect(0, 0,
            cardSprite.getContentSize().width, cardSprite.getContentSize().height));

        this.pokerEmptyFrame = new cc.SpriteFrame(s_p_empty, cc.rect(0, 0,
            cardSprite.getContentSize().width, cardSprite.getContentSize().height));

        var pokerKeys = pokerMap.keys();
        this.pokerFrames = new Map();
        for (index = 0; index < pokerKeys.length; index++) {
            var pokerFrame = new cc.SpriteFrame(pokerMap.get(pokerKeys[index]), cc.rect(0, 0,
                cardSprite.getContentSize().width, cardSprite.getContentSize().height));
            this.pokerFrames.set(pokerKeys[index], pokerFrame);
        }
    },

    changeSpriteImage: function(sprite, srcFrame) {
        if (sprite && srcFrame) {
            sprite.setSpriteFrame(srcFrame);
        }
    }
});

// utils
function compare(a, b) {
    if (a.chips < b.chips)
        return 1;
    if (a.chips > b.chips)
        return -1;
    return 0;
}