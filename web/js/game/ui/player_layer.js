/**
 * Created by the-engine-team
 * 2017-10-03
 */

var PLAYER_AT_LEFT = 0;
var PLAYER_AT_RIGHT = 1;

// visualization related
var PlayerLayer = cc.Layer.extend({

    // constants
    nameFont: '微软雅黑',
    nameSize: 14,
    chipsFont: 'Impact',
    chipsSize: 18,
    debug: true,
    chipLevelMax: 10,

    // game model variables
    size: null,
    validWidth: 0,
    validHeight: 0,
    playerType: PLAYER_AT_LEFT,

    currentChipLevel: 0,

    // scales
    avatarScale: 1.0,
    nameScale: 1.0,
    cardsScale: 1.0,

    // sprites
    avatarPanel: null,
    namePanel: null,
    avatar: null,
    betChips: [],
    actionPanel: null,
    privateCards: [],

    // labels
    nameLabel: null,
    chipsLabel: null,
    betChipsLabel: null,
    ccChipsLabel: null,

    // menus

    // layers

    // design specs
    avatarNameGap: -1,
    avatarMarginLeft: 6,
    avatarWidth: 48,
    avatarPanelLeftPadding: 16,
    avatarPanelBottomPadding: 16,
    avatarPanelWidth: 58,
    chipsHorizontalGap: 0,
    chipsVerticalGap: 20,
    actionPanelGap: 10,
    betChipsLabelMarginLeft: 5,
    privateCardsMarginBottom: 36,
    cardVisualHeight: 100,
    cardVisualWidth: 72,
    cardMargin: 48,

    // constructor
    ctor: function (playerType) {
        this._super();
        this.playerType = playerType;
    },

    // game initializer
    init: function () {
        this._super();

        // initiate layout on PlayerLayer
        this.validWidth = gameWidth;
        this.validHeight = gameHeight;
        this.size = cc.size(this.validWidth, this.validHeight);

        var betChipIndex;
        var avatarIndex;
        var privateCardIndex;
        var avatarGap;
        if (this.playerType === PLAYER_AT_RIGHT) {

            // add avatar panel
            this.avatarPanel = cc.Sprite.create(s_avatar_panel_right);
            this.avatarPanel.setAnchorPoint(0, 0);
            this.avatarPanel.setPosition(0, 0);
            this.addChild(this.avatarPanel, 2);

            // add avatar
            avatarIndex = Math.floor(Math.random() * 16);
            this.avatar = cc.Sprite.create(avatars[avatarIndex]);
            this.avatar.setAnchorPoint(0, 0);
            this.avatarScale = this.avatarWidth / this.avatar.getContentSize().width;
            avatarGap = (this.avatarPanelWidth - this.avatarWidth) / 2;
            this.avatar
                .setPosition(this.avatarPanel.getPositionX() + this.avatarPanelLeftPadding + avatarGap,
                    this.avatarPanelBottomPadding + avatarGap);

            this.avatar.setScale(this.avatarScale);
            this.addChild(this.avatar, 2);

            // add name panel
            this.namePanel = cc.Sprite.create(s_name_panel_right);
            this.namePanel.setAnchorPoint(0, 0);
            this.namePanel.setPosition(this.avatarPanel.getContentSize().width + this.avatarNameGap, 0);
            this.addChild(this.namePanel, 2);

            // add name label
            this.nameLabel = new cc.LabelTTF('Player', this.nameFont, this.nameSize);
            this.nameLabel.setColor(cc.color(255, 255, 255, 255));

            this.nameLabel.setAnchorPoint(0, 0);
            this.nameLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.nameLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.nameLabel.boundingWidth = this.namePanel.getContentSize().width - this.avatarPanelLeftPadding;
            this.nameLabel.boundingHeight =
                (this.namePanel.getContentSize().height - this.avatarPanelBottomPadding) / 2;

            this.nameLabel.setPosition(this.namePanel.getPositionX(),
                this.nameLabel.getContentSize().height + this.avatarPanelBottomPadding / 4);
            this.addChild(this.nameLabel, 3);

            // add chips label
            this.chipsLabel = new cc.LabelTTF('$ 1000', this.chipsFont, this.chipsSize);
            this.chipsLabel.setColor(cc.color(255, 255, 255, 255));

            this.chipsLabel.setAnchorPoint(0, 0);
            this.chipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.chipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.chipsLabel.boundingWidth = this.namePanel.getContentSize().width - this.avatarPanelLeftPadding;
            this.chipsLabel.boundingHeight =
                (this.namePanel.getContentSize().height - this.avatarPanelBottomPadding) / 2;

            this.chipsLabel.setPosition(this.namePanel.getPositionX(),
                (this.nameLabel.getContentSize().height + this.avatarPanelBottomPadding / 2) / 4);
            this.addChild(this.chipsLabel, 3);

            // add bet chips sprite
            for (betChipIndex = 0; betChipIndex < this.chipLevelMax; betChipIndex++) {
                this.betChips[betChipIndex] = cc.Sprite.create(s_chips);
                this.betChips[betChipIndex].setAnchorPoint(0, 0);
                this.betChips[betChipIndex].setPosition(this.avatarPanel.getPositionX() -
                    (this.betChips[betChipIndex].getContentSize().width + this.chipsHorizontalGap),
                    this.chipsVerticalGap + (betChipIndex * 3));
                this.addChild(this.betChips[betChipIndex], 6 + betChipIndex);
                if (betChipIndex < this.currentChipLevel) {
                    this.betChips[betChipIndex].setVisible(true);
                } else {
                    this.betChips[betChipIndex].setVisible(false);
                }
            }

            // add acc chips
            this.accChipsLabel = new cc.LabelTTF('$ 10000', this.chipsFont, this.chipsSize);
            this.accChipsLabel.setColor(cc.color(255, 255, 255, 255));
            this.accChipsLabel.setAnchorPoint(0, 0);
            this.accChipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setPosition(this.betChips[this.currentChipLevel].getPositionX() +
                (this.betChips[this.currentChipLevel].getContentSize().width -
                    this.accChipsLabel.getContentSize().width) / 2,
                        this.betChips[0].getPositionY() -
                        this.betChips[0].getContentSize().height / 2);
            this.addChild(this.accChipsLabel, 6);

            // add action panel
            this.actionPanel = cc.Sprite.create(action_allin);
            this.actionPanel.setAnchorPoint(0, 0);
            this.actionPanel.setPosition(this.avatarPanel.getPositionX() - this.actionPanel.getContentSize().width / 2,
                this.avatarPanel.getPositionY() +
                    this.avatarPanel.getContentSize().height - this.avatarPanelBottomPadding - this.actionPanelGap);
            this.addChild(this.actionPanel, 22);

            // add bet chips
            this.betChipsLabel = new cc.LabelTTF('+100', this.chipsFont, this.chipsSize);
            this.betChipsLabel.setColor(cc.color(0, 255, 0, 255));
            this.betChipsLabel.setAnchorPoint(0, 0);
            this.betChipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.betChipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.betChipsLabel.boundingWidth = this.actionPanel.getContentSize().width;
            this.betChipsLabel
                .setPosition(this.actionPanel.getPositionX(),
                    this.actionPanel.getPositionY() + this.actionPanel.getContentSize().height);
            this.addChild(this.betChipsLabel, 6 + this.currentChipLevel);

            // add private cards
            for (privateCardIndex = 1; privateCardIndex >= 0; privateCardIndex--) {
                this.privateCards[privateCardIndex] = cc.Sprite.create(s_p_back);
                this.privateCards[privateCardIndex].setAnchorPoint(0, 0);
                this.cardsScale =
                    Math.max(this.cardVisualHeight / this.privateCards[privateCardIndex].getContentSize().height,
                        this.cardVisualWidth / this.privateCards[privateCardIndex].getContentSize().width);
                this.privateCards[privateCardIndex].setScale(this.cardsScale);
                this.privateCards[privateCardIndex]
                    .setPosition(this.namePanel.getPositionX() + this.namePanel.getContentSize().width -
                        (privateCardIndex * this.cardMargin) -
                        (this.privateCards[privateCardIndex].getContentSize().width * this.cardsScale) -
                        this.avatarPanelLeftPadding,
                                this.namePanel.getPositionY() + this.privateCardsMarginBottom);
                this.addChild(this.privateCards[privateCardIndex], (1 - privateCardIndex));
            }

        } else if (this.playerType === PLAYER_AT_LEFT) {

            // add name panel
            this.namePanel = cc.Sprite.create(s_name_panel_left);
            this.namePanel.setAnchorPoint(0, 0);
            this.namePanel.setPosition(0, 0);
            this.addChild(this.namePanel, 2);

            // add name label
            this.nameLabel = new cc.LabelTTF('Player', this.nameFont, this.nameSize);
            this.nameLabel.setColor(cc.color(255, 255, 255, 255));
            this.nameLabel.setAnchorPoint(0, 0);
            this.nameLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.nameLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.nameLabel.boundingWidth = this.namePanel.getContentSize().width - this.avatarPanelLeftPadding;
            this.nameLabel.boundingHeight =
                (this.namePanel.getContentSize().height - this.avatarPanelBottomPadding) / 2;
            this.nameLabel.setPosition(this.namePanel.getPositionX() + this.avatarPanelLeftPadding,
                this.nameLabel.getContentSize().height + this.avatarPanelBottomPadding / 4);
            this.addChild(this.nameLabel, 3);

            // add chips label
            this.chipsLabel = new cc.LabelTTF('$ 1000', this.chipsFont, this.chipsSize);
            this.chipsLabel.setColor(cc.color(255, 255, 255, 255));

            this.chipsLabel.setAnchorPoint(0, 0);
            this.chipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.chipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.chipsLabel.boundingWidth = this.namePanel.getContentSize().width - this.avatarPanelLeftPadding;
            this.chipsLabel.boundingHeight =
                (this.namePanel.getContentSize().height - this.avatarPanelBottomPadding) / 2;

            this.chipsLabel.setPosition(this.namePanel.getPositionX() + this.avatarPanelLeftPadding,
                (this.nameLabel.getContentSize().height + this.avatarPanelBottomPadding / 2) / 4);
            this.addChild(this.chipsLabel, 3);

            // add avatar panel
            this.avatarPanel = cc.Sprite.create(s_avatar_panel_left);
            this.avatarPanel.setAnchorPoint(0, 0);
            this.avatarPanel.setPosition(this.namePanel.getContentSize().width + this.avatarNameGap, 0);
            this.addChild(this.avatarPanel, 2);

            // add avatar
            avatarIndex = Math.floor(Math.random() * 16);
            this.avatar = cc.Sprite.create(avatars[avatarIndex]);
            this.avatar.setAnchorPoint(0, 0);
            this.avatarScale = this.avatarWidth / this.avatar.getContentSize().width;
            avatarGap = (this.avatarPanelWidth - this.avatarWidth) / 2;
            this.avatar
                .setPosition(this.avatarPanel.getPositionX() + avatarGap,
                    this.avatarPanelBottomPadding + avatarGap);

            this.avatar.setScale(this.avatarScale);
            this.addChild(this.avatar, 3);

            // add bet chips sprite
            for (betChipIndex = 0; betChipIndex < this.chipLevelMax; betChipIndex++) {
                this.betChips[betChipIndex] = cc.Sprite.create(s_chips);
                this.betChips[betChipIndex].setAnchorPoint(0, 0);
                this.betChips[betChipIndex].setPosition(this.avatarPanel.getPositionX() +
                    this.avatarPanel.getContentSize().width + this.chipsHorizontalGap,
                    this.chipsVerticalGap + (betChipIndex * 3));
                this.addChild(this.betChips[betChipIndex], 4 + betChipIndex);
                if (betChipIndex < this.currentChipLevel) {
                    this.betChips[betChipIndex].setVisible(true);
                } else {
                    this.betChips[betChipIndex].setVisible(false);
                }
            }

            // add acc chips
            this.accChipsLabel = new cc.LabelTTF('$ 10000', this.chipsFont, this.chipsSize);
            this.accChipsLabel.setColor(cc.color(255, 255, 255, 255));
            this.accChipsLabel.setAnchorPoint(0, 0);
            this.accChipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setPosition(this.betChips[this.currentChipLevel].getPositionX() +
                (this.betChips[this.currentChipLevel].getContentSize().width -
                    this.accChipsLabel.getContentSize().width) / 2,
                this.betChips[0].getPositionY() -
                this.betChips[0].getContentSize().height / 2);
            this.addChild(this.accChipsLabel, 6);

            // add action panel
            this.actionPanel = cc.Sprite.create(action_raise_left);
            this.actionPanel.setAnchorPoint(0, 0);
            this.actionPanel.setPosition(this.avatarPanel.getPositionX() + this.avatarPanel.getContentSize().width / 2,
                this.avatarPanel.getPositionY() +
                this.avatarPanel.getContentSize().height - this.avatarPanelBottomPadding - this.actionPanelGap);
            this.addChild(this.actionPanel, 22);

            // add bet chips
            this.betChipsLabel = new cc.LabelTTF('+100', this.chipsFont, this.chipsSize);
            this.betChipsLabel.setColor(cc.color(0, 255, 0, 255));
            this.betChipsLabel.setAnchorPoint(0, 0);
            this.betChipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.betChipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.betChipsLabel.boundingWidth = this.actionPanel.getContentSize().width;
            this.betChipsLabel
                .setPosition(this.actionPanel.getPositionX(),
                    this.actionPanel.getPositionY() + this.actionPanel.getContentSize().height);
            this.addChild(this.betChipsLabel, 6 + this.currentChipLevel);

            // add private cards
            for (privateCardIndex = 0; privateCardIndex < 2; privateCardIndex++) {
                this.privateCards[privateCardIndex] = cc.Sprite.create(s_p_back);
                this.privateCards[privateCardIndex].setAnchorPoint(0, 0);
                this.cardsScale =
                    Math.max(this.cardVisualHeight / this.privateCards[privateCardIndex].getContentSize().height,
                        this.cardVisualWidth / this.privateCards[privateCardIndex].getContentSize().width);
                this.privateCards[privateCardIndex].setScale(this.cardsScale);
                this.privateCards[privateCardIndex]
                    .setPosition(this.namePanel.getPositionX() +
                        this.avatarPanelLeftPadding + privateCardIndex * this.cardMargin,
                            this.namePanel.getPositionY() + this.privateCardsMarginBottom);
                this.addChild(this.privateCards[privateCardIndex], 0);
            }
        }
    },

    // game operations
    update: function (dt) {
        this.doUpdate();
    },

    // reset function
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

    },

    // UI helpers
    showPlayer: function(i, show) {
    }
});
