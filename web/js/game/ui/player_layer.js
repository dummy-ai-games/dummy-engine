/**
 * Created by the-engine-team
 * 2017-10-03
 */

var PlayerLayer = cc.Layer.extend({

    // constants
    nameFont: '微软雅黑',
    nameTextSize: 20,
    chipsFont: 'Impact',
    chipsTextSize: 18,
    debug: true,
    maxChipLevel: 10,

    // game model variables
    size: null,
    validWidth: 0,
    validHeight: 0,
    playerType: PLAYER_AT_LEFT,
    player: null,
    actionMap: null,
    nameNormal: null,
    avatarNormal: null,
    nameHighLight: null,
    avatarHighLight: null,

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
    privateCard0: null,
    privateCard1: null,

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

    // alternative frames
    nameHighLightFrame: null,
    avatarHighLightFrame: null,
    nameNormalFrame: null,
    avatarNormalFrame: null,
    avatarFrames: [],
    pokerFrames: null,
    pokerBackFrame: null,
    pokerEmptyFrame: null,
    actionFrames: null,
    actionEmptyFrame: null,

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
        var avatarGap;
        if (this.playerType === PLAYER_AT_RIGHT) {

            // add avatar panel
            this.avatarPanel = cc.Sprite.create(s_avatar_panel_right);
            this.avatarPanel.setAnchorPoint(0, 0);
            this.avatarPanel.setPosition(0, 0);
            this.addChild(this.avatarPanel, 2);

            // add avatar
            avatarIndex = 0;
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
            this.nameLabel = new cc.LabelTTF('', this.nameFont, this.nameTextSize);
            this.nameLabel.setColor(cc.color(0, 255, 255, 255));

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
            this.chipsLabel = new cc.LabelTTF('', this.chipsFont, this.chipsTextSize);
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
            for (betChipIndex = 0; betChipIndex < this.maxChipLevel; betChipIndex++) {
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
            this.accChipsLabel = new cc.LabelTTF('', this.chipsFont, this.chipsTextSize);
            this.accChipsLabel.setColor(cc.color(255, 255, 255, 255));
            this.accChipsLabel.setAnchorPoint(0, 0);
            this.accChipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setPosition(this.betChips[this.currentChipLevel].getPositionX() +
                (this.betChips[this.currentChipLevel].getContentSize().width -
                    this.accChipsLabel.getContentSize().width) / 2,
                        this.betChips[0].getPositionY() -
                        this.betChips[0].getContentSize().height / 2);
            this.addChild(this.accChipsLabel, 7);

            // add action panel
            this.actionMap = actionRightMap;
            this.nameNormal = s_name_panel_right;
            this.nameHighLight = s_name_panel_right_hl;
            this.avatarNormal = s_avatar_panel_right;
            this.avatarHighLight = s_avatar_panel_right_hl;

            this.actionPanel = cc.Sprite.create(action_allin);
            this.actionPanel.setAnchorPoint(0, 0);
            this.actionPanel.setPosition(this.avatarPanel.getPositionX() - this.actionPanel.getContentSize().width / 2,
                this.avatarPanel.getPositionY() +
                    this.avatarPanel.getContentSize().height - this.avatarPanelBottomPadding - this.actionPanelGap);
            this.addChild(this.actionPanel, 22);

            // add bet chips
            this.betChipsLabel = new cc.LabelTTF('', this.chipsFont, this.chipsTextSize);
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

            this.privateCard0 = cc.Sprite.create(s_p_back);
            this.privateCard0.setAnchorPoint(0, 0);
            this.cardsScale =
                Math.max(this.cardVisualHeight / this.privateCard0.getContentSize().height,
                    this.cardVisualWidth / this.privateCard0.getContentSize().width);
            this.privateCard0.setScale(this.cardsScale);
            this.privateCard0.setPosition(this.namePanel.getPositionX() + this.namePanel.getContentSize().width -
                this.cardMargin - (this.privateCard0.getContentSize().width * this.cardsScale) -
                this.avatarPanelLeftPadding,
                this.namePanel.getPositionY() + this.privateCardsMarginBottom);
            this.addChild(this.privateCard0, 0);

            this.privateCard1 = cc.Sprite.create(s_p_back);
            this.privateCard1.setAnchorPoint(0, 0);
            this.cardsScale =
                Math.max(this.cardVisualHeight / this.privateCard1.getContentSize().height,
                    this.cardVisualWidth / this.privateCard1.getContentSize().width);
            this.privateCard1.setScale(this.cardsScale);
            this.privateCard1.setPosition(this.namePanel.getPositionX() + this.namePanel.getContentSize().width -
                    (this.privateCard1.getContentSize().width * this.cardsScale) -
                    this.avatarPanelLeftPadding,
                    this.namePanel.getPositionY() + this.privateCardsMarginBottom);
            this.addChild(this.privateCard1, 1);

        } else if (this.playerType === PLAYER_AT_LEFT) {

            // add name panel
            this.namePanel = cc.Sprite.create(s_name_panel_left);
            this.namePanel.setAnchorPoint(0, 0);
            this.namePanel.setPosition(0, 0);
            this.addChild(this.namePanel, 2);

            // add name label
            this.nameLabel = new cc.LabelTTF('', this.nameFont, this.nameTextSize);
            this.nameLabel.setColor(cc.color(0, 255, 255, 255));
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
            this.chipsLabel = new cc.LabelTTF('1000', this.chipsFont, this.chipsTextSize);
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
            avatarIndex = 0;
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
            for (betChipIndex = 0; betChipIndex < this.maxChipLevel; betChipIndex++) {
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
            this.accChipsLabel = new cc.LabelTTF('', this.chipsFont, this.chipsTextSize);
            this.accChipsLabel.setColor(cc.color(255, 255, 255, 255));
            this.accChipsLabel.setAnchorPoint(0, 0);
            this.accChipsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
            this.accChipsLabel.setPosition(this.betChips[this.currentChipLevel].getPositionX() +
                (this.betChips[this.currentChipLevel].getContentSize().width -
                    this.accChipsLabel.getContentSize().width) / 2,
                this.betChips[0].getPositionY() -
                this.betChips[0].getContentSize().height / 2);
            this.addChild(this.accChipsLabel, 7);

            // add action panel
            this.actionMap = actionLeftMap;
            this.nameNormal = s_name_panel_left;
            this.nameHighLight = s_name_panel_left_hl;
            this.avatarNormal = s_avatar_panel_left;
            this.avatarHighLight = s_avatar_panel_left_hl;

            this.actionPanel = cc.Sprite.create(action_raise_left);
            this.actionPanel.setAnchorPoint(0, 0);
            this.actionPanel.setPosition(this.avatarPanel.getPositionX() + this.avatarPanel.getContentSize().width / 2,
                this.avatarPanel.getPositionY() +
                this.avatarPanel.getContentSize().height - this.avatarPanelBottomPadding - this.actionPanelGap);
            this.addChild(this.actionPanel, 22);

            // add bet chips
            this.betChipsLabel = new cc.LabelTTF('', this.chipsFont, this.chipsTextSize);
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
            this.privateCard0 = cc.Sprite.create(s_p_back);
            this.privateCard0.setAnchorPoint(0, 0);
            this.cardsScale =
                Math.max(this.cardVisualHeight / this.privateCard0.getContentSize().height,
                    this.cardVisualWidth / this.privateCard0.getContentSize().width);
            this.privateCard0.setScale(this.cardsScale);
            this.privateCard0
                .setPosition(this.namePanel.getPositionX() +
                    this.avatarPanelLeftPadding,
                    this.namePanel.getPositionY() + this.privateCardsMarginBottom);
            this.addChild(this.privateCard0, 0);

            this.privateCard1 = cc.Sprite.create(s_p_back);
            this.privateCard1.setAnchorPoint(0, 0);
            this.cardsScale =
                Math.max(this.cardVisualHeight / this.privateCard1.getContentSize().height,
                    this.cardVisualWidth / this.privateCard1.getContentSize().width);
            this.privateCard1.setScale(this.cardsScale);
            this.privateCard1
                .setPosition(this.namePanel.getPositionX() +
                    this.avatarPanelLeftPadding + this.cardMargin,
                    this.namePanel.getPositionY() + this.privateCardsMarginBottom);
            this.addChild(this.privateCard1, 0);
        }
        this.initializeAltFrames();
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
        if (!this.player) {
            return;
        }

        // update chips
        this.chipsLabel.setString(this.player.chips);

        // update accumulate
        if (this.player.accumulate > 0) {
            var accString = '$ ' + this.player.accumulate;
            this.accChipsLabel.setString(accString);

            // update chip sprites
            this.currentChipLevel = Math.min(this.maxChipLevel, Math.ceil(this.player.accumulate / 1000));
            // console.log('player ' + this.player.playerName + ' acc level = ' + this.currentChipLevel);
            for (var betChipIndex = 0; betChipIndex < this.maxChipLevel; betChipIndex++) {
                if (betChipIndex < this.currentChipLevel) {
                    this.betChips[betChipIndex].setVisible(true);
                } else {
                    this.betChips[betChipIndex].setVisible(false);
                }
            }
        } else {
            this.accChipsLabel.setString('');
        }

        // update action
        if (this.player.action !== '') {
            this.changeSpriteImage(this.actionPanel, this.actionFrames.get(this.player.action));
        } else {
            this.changeSpriteImage(this.actionPanel, this.actionEmptyFrame);
        }

        if (this.player.inTurn) {
            this.changeSpriteImage(this.namePanel, this.nameHighLightFrame);
            this.changeSpriteImage(this.avatarPanel, this.avatarHighLightFrame);
        } else {
            this.changeSpriteImage(this.namePanel, this.nameNormalFrame);
            this.changeSpriteImage(this.avatarPanel, this.avatarNormalFrame);
        }

        // update current bet
        if (this.player.bet > 0) {
            this.betChipsLabel.setString('+' + this.player.bet);
        } else {
            this.betChipsLabel.setString('');
        }

        // update private cards
        if (this.player.privateCards[0]) {
            if (this.player.folded) {
                this.changeSpriteImage(this.privateCard0, this.pokerBackFrame);
            } else {
                this.changeSpriteImage(this.privateCard0, this.pokerFrames.get(this.player.privateCards[0]));
            }

            this.privateCard0.setVisible(true);
        } else {
            this.changeSpriteImage(this.privateCard0, this.pokerEmptyFrame);
            this.privateCard0.setVisible(false);
        }
        if (this.player.privateCards[1]) {
            if (this.player.folded) {
                this.changeSpriteImage(this.privateCard1, this.pokerBackFrame);
            } else {
                this.changeSpriteImage(this.privateCard1, this.pokerFrames.get(this.player.privateCards[1]));
            }

            this.privateCard1.setVisible(true);
        } else {
            this.changeSpriteImage(this.privateCard1, this.pokerEmptyFrame);
            this.privateCard1.setVisible(false);
        }
    },

    setPlayer: function(_player) {
        this.player = _player;

        // change name and avatar
        if (this.player) {
            this.nameLabel.setString(this.player.displayName);
            var avatarIndex = this.player.avatarId || 0;
            this.changeSpriteImage(this.avatar, this.avatarFrames[avatarIndex]);
        }
    },

    // UI helpers
    initializeAltFrames: function() {
        this.nameHighLightFrame = cc.SpriteFrame.create(this.nameHighLight, cc.rect(0, 0,
            this.namePanel.getContentSize().width, this.namePanel.getContentSize().height));

        this.avatarHighLightFrame = cc.SpriteFrame.create(this.avatarHighLight, cc.rect(0, 0,
            this.avatarPanel.getContentSize().width, this.avatarPanel.getContentSize().height));

        this.nameNormalFrame = cc.SpriteFrame.create(this.nameNormal, cc.rect(0, 0,
            this.namePanel.getContentSize().width, this.namePanel.getContentSize().height));

        this.avatarNormalFrame = cc.SpriteFrame.create(this.avatarNormal, cc.rect(0, 0,
            this.avatarPanel.getContentSize().width, this.avatarPanel.getContentSize().height));

        var index;
        for (index = 0; index < avatars.length; index++) {
            this.avatarFrames[index] = cc.SpriteFrame.create(avatars[index], cc.rect(0, 0,
                this.avatar.getContentSize().width, this.avatar.getContentSize().height));
        }

        this.pokerBackFrame = cc.SpriteFrame.create(s_p_back, cc.rect(0, 0,
            this.privateCard0.getContentSize().width, this.privateCard0.getContentSize().height));

        this.pokerEmptyFrame = cc.SpriteFrame.create(s_p_empty, cc.rect(0, 0,
            this.privateCard0.getContentSize().width, this.privateCard0.getContentSize().height));

        var pokerKeys = pokerMap.keys();
        this.pokerFrames = new Map();
        for (index = 0; index < pokerKeys.length; index++) {
            var pokerFrame = cc.SpriteFrame.create(pokerMap.get(pokerKeys[index]), cc.rect(0, 0,
                this.privateCard0.getContentSize().width, this.privateCard0.getContentSize().height));
            this.pokerFrames.set(pokerKeys[index], pokerFrame);
        }

        this.actionEmptyFrame = cc.SpriteFrame.create(action_empty, cc.rect(0, 0,
            this.actionPanel.getContentSize().width, this.actionPanel.getContentSize().height));

        var actionKeys = this.actionMap.keys();
        this.actionFrames = new Map();
        for (index = 0; index < actionKeys.length; index++) {
            var actionFrame = cc.SpriteFrame.create(this.actionMap.get(actionKeys[index]), cc.rect(0, 0,
                this.actionPanel.getContentSize().width, this.actionPanel.getContentSize().height));
            this.actionFrames.set(actionKeys[index], actionFrame);
        }
    },

    changeSpriteImage: function(sprite, srcFrame) {
        sprite.setSpriteFrame(srcFrame);
    }
});
