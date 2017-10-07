/**
 * Created by the-engine-team
 * 2017-10-04
 */

var DealerLayer = cc.LayerColor.extend({

    // constants
    defaultFont: 'Tw Cen MT',
    titleFont: 'IMPACT',
    titleTextSize: 64,
    boardFont: 'Tw Cen MT',
    boardTextSize: 32,
    nameFont: 'IMPACT',
    nameTextSize: 32,
    debug: true,
    maxPlayerCount: 10,
    minPlayerCount: 3,

    // visualization variables
    size: null,
    validWidth: 0,
    validHeight: 0,

    // scales
    gameScale: 1.0,
    buttonScale: 1.0,

    // sprites
    dialogBoxSprite: null,

    // labels
    titleLabel: null,
    boardLabel: null,
    playerLabels: [],

    // buttons
    startButton: null,
    stopButton: null,

    // menus
    controlMenu: null,

    // layers

    // design specs
    titleTextWidth: 800,
    titleTextHeight: 144,
    boardTextWidth: 240,
    boardTextHeight: 32,
    nameTextWidth: 160,
    nameTextHeight: 32,

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

        // initialize layout on DealerLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        // initialize start and stop button
        this.buttonScale = this.gameScale * 0.8;
        this.startButton = ccui.Button.create(s_start_button, s_start_button_pressed, s_start_button_disabled);
        this.startButton.setAnchorPoint(0, 0);
        this.startButton.setScale(this.buttonScale);
        this.startButton.setPosition((this.validWidth - this.startButton.getContentSize().width * this.buttonScale) / 2,
                this.validHeight / 12 * 2);
        this.addChild(this.startButton, 2);
        this.enableButton(this.startButton, false);
        this.startButton.addTouchEventListener(function (sender, type) {
                if (ccui.Widget.TOUCH_ENDED === type) {
                    if (STATUS_GAME_RUNNING !== gameStatus) {
                        console.log('start game');
                        startGame();
                    }
                }
            }, this);

        this.stopButton = ccui.Button.create(s_stop_button, s_stop_button_pressed, s_stop_button_disabled);
        this.stopButton.setAnchorPoint(0, 0);
        this.stopButton.setScale(this.buttonScale);
        this.stopButton.setPosition((this.validWidth - this.stopButton.getContentSize().width * this.buttonScale) / 2,
                this.validHeight / 12 * 2);
        this.addChild(this.stopButton, 2);
        this.enableButton(this.stopButton, false);
        this.stopButton.addTouchEventListener(function (sender, type) {
                if (ccui.Widget.TOUCH_ENDED === type) {
                    if (STATUS_GAME_RUNNING === gameStatus) {
                        console.log('stop game');
                        stopGame();
                    }
                }
            }, this);

        // initialize title
        this.titleLabel = new cc.LabelTTF('Texas Hold\'em AI Game',
            this.titleFont, this.titleTextSize);
        this.titleLabel.setColor(cc.color(255, 128, 0, 255));
        this.titleLabel.setAnchorPoint(0, 0);
        this.titleLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.titleLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.titleLabel.boundingWidth = this.validWidth;
        this.titleLabel.boundingHeight = this.titleTextHeight;
        var shadowColor = cc.color(128, 128, 0);
        this.titleLabel.enableShadow(shadowColor, cc.size(0, -4), 0);
        this.titleLabel.setScale(this.gameScale);
        this.titleLabel.setPosition((this.validWidth - this.titleLabel.getContentSize().width * this.gameScale) / 2,
                this.validHeight / 12 * 9);
        this.addChild(this.titleLabel, 2);

        // initialize board number
        this.boardLabel = new cc.LabelTTF('Board ' + tableNumber,
            this.boardFont, this.boardTextSize);
        this.boardLabel.setColor(cc.color(255, 255, 255, 255));
        this.boardLabel.setAnchorPoint(0, 0);
        this.boardLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        this.boardLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        this.boardLabel.boundingWidth = this.boardTextWidth;
        this.boardLabel.boundingHeight = this.boardTextHeight;
        this.boardLabel.setScale(this.gameScale);
        this.boardLabel.setPosition((this.validWidth - this.boardLabel.getContentSize().width * this.gameScale) / 2,
                this.validHeight / 12 * 8);
        this.addChild(this.boardLabel, 2);

        // initialize name labels
        var playerIndex;
        this.playerLabels = [];
        for (playerIndex = 0; playerIndex < this.maxPlayerCount; playerIndex++) {
            this.playerLabels[playerIndex] = new cc.LabelTTF('',
                this.nameFont, this.nameTextSize);
            this.playerLabels[playerIndex].setColor(cc.color(255, 255, 255, 255));
            this.playerLabels[playerIndex].setAnchorPoint(0, 0);
            this.playerLabels[playerIndex].setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.playerLabels[playerIndex].setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.playerLabels[playerIndex].boundingWidth = this.nameTextWidth;
            this.playerLabels[playerIndex].boundingHeight = this.nameTextHeight;
            this.playerLabels[playerIndex].setScale(this.gameScale);
            if (playerIndex < 5) {
                this.playerLabels[playerIndex].setPosition(this.validWidth / 7 * (playerIndex + 1),
                    this.validHeight / 12 * 6);
            } else {
                this.playerLabels[playerIndex].setPosition(this.validWidth / 7 * (playerIndex - 5 + 1),
                    this.validHeight / 12 * 5);
            }

            this.addChild(this.playerLabels[playerIndex], 2);
        }

        // event management
        this.eventListener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (/*touch, event*/) {
                return true;
            },

            onTouchMoved: function (/*touch, event*/) {
                return true;
            },

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
        this.updateControl();
        this.updatePlayers();
    },

    updatePlayers: function() {
        var playerIndex;
        if (dbPlayers && this.playerLabels) {
            for (playerIndex = 0; playerIndex < dbPlayers.length; playerIndex++) {
                if (this.playerLabels[playerIndex]) {
                    var playerName = dbPlayers[playerIndex].playerName;
                    var displayName = dbPlayers[playerIndex].displayName;
                    this.playerLabels[playerIndex].setString(displayName);
                    if (this.isPlayerIn(playerName)) {
                        this.playerLabels[playerIndex].setColor(cc.color(255, 255, 0, 255));
                    } else {
                        this.playerLabels[playerIndex].setColor(cc.color(128, 128, 128, 128));
                    }
                }
                if (playerIndex >= this.maxPlayerCount) {
                    return;
                }
            }
        }
    },

    updateControl: function() {
        if (gameStatus === STATUS_GAME_STANDBY || gameStatus === STATUS_GAME_FINISHED) {
            this.stopButton.setVisible(false);
            this.startButton.setVisible(true);
            if (players && players.length >= this.minPlayerCount) {
                this.enableButton(this.startButton, true);
            } else {
                this.enableButton(this.startButton, false);
            }
            this.enableButton(this.stopButton, false);
        } else if (gameStatus === STATUS_GAME_RUNNING) {
            this.stopButton.setVisible(true);
            this.startButton.setVisible(false);
            if (players && players.length >= this.minPlayerCount) {
                this.enableButton(this.stopButton, true);
            } else {
                this.enableButton(this.stopButton, false);
            }
            this.enableButton(this.startButton, false);
        }
    },

    isPlayerIn: function(playerName) {
        if (!players) {
            return false;
        }
        var playerIndex;
        for (playerIndex = 0; playerIndex < players.length; playerIndex++) {
            if (players[playerIndex].playerName === playerName) {
                return true;
            }
        }
        return false;
    },

    // UI helpers
    enableButton: function(button, enable) {
        if (button.isEnabled() !== enable) {
            button.setEnabled(enable);
            button.setBright(enable);
        }
    }
});
