/**
 * Created by the-engine-team
 * 2017-08-22
 */

var Player = function(_id, _name, _displayName, _chips) {
    this.id = _id;
    this.name = _name;
    this.displayName = _displayName;
    this.isSurvive = true;
    this.chips = _chips;
    this.bet = 0;
    this.accumulate = 0;
    this.privateCards = [];
    this.action = "-";
    this.inTurn = 0;
    this.isSmallBlind = false;
    this.isBigBlind = false;
};

// UX flow control on player
Player.prototype.setBet = function(_bet) {
    this.bet = _bet;
};

Player.prototype.setChips = function(_chips) {
    this.chips = _chips;
};

Player.prototype.setAccRoundBet = function(_accRoundBet) {
    this.accRoundBet = _accRoundBet;
};

Player.prototype.setAccBet = function(_accBet) {
    this.accBet = _accBet;
};

Player.prototype.setAccumulate = function(_accumulate) {
    this.accumulate = _accumulate;
};

Player.prototype.setBlind = function(_smallBlind) {
    this.bet = _smallBlind;
};

Player.prototype.setChips = function(_chips) {
    this.chips = _chips;
};

Player.prototype.setSurvive = function(_isSurvive) {
    this.isSurvive = _isSurvive;
};

Player.prototype.setName = function(_name) {
    this.name = _name;
};

Player.prototype.setDisplayName = function(_displayName) {
    this.displayName = _displayName;
};

Player.prototype.setAction = function(_action) {
    this.action = _action;
};

Player.prototype.setInTurn = function() {
    this.inTurn = 1;
};

Player.prototype.clearInTurn = function() {
    this.inTurn = 0;
};
