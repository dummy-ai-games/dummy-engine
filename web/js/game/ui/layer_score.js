/**
 * Created by the-engine-team
 * 2017-10-15
 */

var ScoreLayer = cc.LayerColor.extend({

    // constants
    titleFont: 'IMPACT',
    titleTextSize: 64,
    playerFont: 'IMPACT',
    playerTextSize: 32,
    debug: true,

    // game model variables
    size: null,
    validWidth: 0,
    validHeight: 0,
    maxPlayerCount: 10,
    players: [],

    // scales
    gameScale: 1.0,

    // sprites
    bgSprite: null,

    // labels
    titleLabel: null,
    scoreLabels: [],

    // buttons
    reloadButton: null,

    // menus

    // layers

    // design specs
    titleTextWidth: 640,
    titleTextHeight: 64,
    titleTextMarginBottom: 680,
    scoreTextWidth: 320,
    scoreTextHeight: 80,
    scoreTextMarginBottom: 560,

    // event managers
    eventListener: null,

    // constructor
    ctor: function (gameScale) {
        this._super();
        this.gameScale = gameScale;
    },

    // game initializer
    init: function () {
        this._super(cc.color(0, 0, 0, 239));

        // initiate layout on DealerLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // initialize background
        this.bgSprite = cc.Sprite.create(s_bg);
        this.bgSprite.setAnchorPoint(0, 0);
        this.bgSprite.setScale(this.gameScale);
        this.bgSprite.setPosition(0, 0);
        this.addChild(this.bgSprite, 0);

        // initialize title
        this.titleLabel= new cc.LabelTTF('Round Finished', this.titleFont, this.titleTextSize);
        this.titleLabel.setColor(cc.color(255, 255, 255, 255));
        this.titleLabel.setAnchorPoint(0, 0);
        this.titleLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.titleLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.titleLabel.boundingWidth = this.titleTextWidth;
        this.titleLabel.boundingHeight = this.titleTextHeight;
        this.titleLabel.setScale(this.gameScale);
        this.titleLabel
            .setPosition((this.bgSprite.getContentSize().width * this.gameScale -
                this.titleLabel.getContentSize().width * this.gameScale) / 2,
                    this.titleTextMarginBottom * this.gameScale);
        this.addChild(this.titleLabel, 2);

        var playerIndex;
        this.scoreLabels = [];
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            this.scoreLabels[playerIndex] = new cc.LabelTTF('player ' + playerIndex + ' $20000',
                this.playerFont, this.playerTextSize);
            this.scoreLabels[playerIndex].setColor(cc.color(255, 255, 255, 255));
            this.scoreLabels[playerIndex].setAnchorPoint(0, 0);
            this.scoreLabels[playerIndex].setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
            this.scoreLabels[playerIndex].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.scoreLabels[playerIndex].boundingWidth = this.scoreTextWidth;
            this.scoreLabels[playerIndex].boundingHeight = this.scoreTextHeight;
            this.scoreLabels[playerIndex].setScale(this.gameScale);
            if (playerIndex < 5) {
                this.scoreLabels[playerIndex]
                    .setPosition(this.bgSprite.getContentSize().width / 5 * this.gameScale,
                        (this.scoreTextMarginBottom -
                            this.scoreLabels[playerIndex].getContentSize().height * playerIndex) * this.gameScale);
            } else {
                this.scoreLabels[playerIndex]
                    .setPosition(this.bgSprite.getContentSize().width / 5 * 3 * this.gameScale,
                        (this.scoreTextMarginBottom -
                            this.scoreLabels[playerIndex].getContentSize().height * (playerIndex - 5)) * this.gameScale);
            }

            this.addChild(this.scoreLabels[playerIndex], 2);
        }

        if (playMode == MODE_PLAYER) {
            this.reloadButton = ccui.Button.create(s_start_button, s_start_button_pressed, s_start_button_disabled);
            this.reloadButton.setAnchorPoint(0, 0);
            this.reloadButton.setScale(this.gameScale * 0.8);
            this.reloadButton.setPosition((this.validWidth -
                this.reloadButton.getContentSize().width * this.gameScale * 0.8) / 2,
                this.validHeight / 12 * 2);
            this.addChild(this.reloadButton, 2);
            this.reloadButton.addTouchEventListener(function (sender, type) {
                if (ccui.Widget.TOUCH_ENDED === type) {
                    if (STATUS_GAME_RUNNING !== gameStatus) {
                        console.log('reload');
                    }
                }
            }, this);
        }

        // event management
        this.eventListener = cc.EventListener.create({
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
        var playerIndex;
        if (this.players) {
            for (playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
                if (this.scoreLabels && this.scoreLabels[playerIndex]) {
                    this.scoreLabels[playerIndex].setString(this.players[playerIndex].displayName + ' : ' +
                        this.players[playerIndex].chips);
                }
            }
        }
    },

    setPlayers: function(_players) {
        this.players = _players;
        if (this.players) {
            this.players.sort(compare);
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