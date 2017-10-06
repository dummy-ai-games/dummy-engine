/**
 * Created by the-engine-team
 * 2017-08-22
 */

var Player = function(_id, _playerName, _displayName, _chips, _isSurvive, _reloadCount) {
    this.id = _id;
    this.playerName = _playerName;
    this.displayName = _displayName;
    this.isSurvive = _isSurvive;
    this.chips = _chips;
    this.reloadCount = _reloadCount;
    this.bet = 0;
    this.roundBet = 0;
    this.accumulate = 0;
    this.action = "";
    this.inTurn = 0;
    this.isSmallBlind = false;
    this.isBigBlind = false;
    this.privateCards = [];
    var avatarId = Math.abs(hashCode(this.playerName) % 16);
    this.avatarId = avatarId || 0;
    this.fold = false;
    this.allin = false;
};

Player.prototype.setId = function(_id) {
    this.id = _id;
};

Player.prototype.setPlayerName = function(_playerName) {
    this.setPlayerName = _playerName;
};

Player.prototype.setDisplayName = function(_displayName) {
    this.displayName = _displayName;
};

Player.prototype.setSurvive = function(_isSurvive) {
    this.isSurvive = _isSurvive;
};

Player.prototype.setChips = function(_chips) {
    this.chips = _chips;
};

Player.prototype.setReloadCount = function(_reloadCount) {
    this.reloadCount = _reloadCount;
};

Player.prototype.setBet = function(_bet) {
    this.bet = _bet;
    this.accumulate = this.bet + this.roundBet;
};

Player.prototype.setRoundBet = function(_roundBet) {
    this.roundBet = _roundBet;
    this.accumulate = this.bet + this.roundBet;
};

Player.prototype.setAccumulate = function(_accumulate) {
    this.accumulate = _accumulate;
};

Player.prototype.setAction = function(_action) {
    this.action = _action;
};

Player.prototype.setInTurn = function(_inTurn) {
    this.inTurn = _inTurn;
};

Player.prototype.setSmallBlind = function(_isSmallBlind) {
    this.isSmallBlind = _isSmallBlind;
};

Player.prototype.setBigBlind = function(_isBigBlind) {
    this.isBigBlind = _isBigBlind;
};

Player.prototype.setPrivateCards = function(_privateCard0, _privateCard1) {
    this.privateCards[0] = _privateCard0;
    this.privateCards[1] = _privateCard1;
};

Player.prototype.setFolded = function(_folded) {
    this.folded = _folded;
};

Player.prototype.setAllin = function(_allin) {
    this.allin = _allin;
};

// avatar hash helper
function hashCode(str) {
    var hash = 0;
    var char;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}