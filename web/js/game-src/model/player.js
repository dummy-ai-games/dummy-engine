/**
 * Created by the-engine-team
 * 2017-08-22
 */

var playerStatusAlive = 0;
var playerStatusDead = 1;

var Player = function(_id, _name, _displayName, _chips) {
    this.id = _id;
    this.name = _name;
    this.displayName = _displayName;
    this.status = playerStatusAlive;
    this.chips = _chips;
    this.bet = 0;
    this.privateCards = [];
    this.action = "No Action";
    this.inTurn = 0;
};

// UX flow control on player
Player.prototype.setBet = function (_bet) {
    this.bet = _bet;
    this.chips -= _bet;
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
