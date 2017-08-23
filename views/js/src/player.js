/**
 * Created by Strawmanbobi
 * 2017-08-22
 */

var playerStatusAlive = 0;
var playerStatusDead = 1;

var Player = function(_id, _name, _gold) {
    this.id = _id;
    this.name = _name;
    this.status = playerStatusAlive;
    this.gold = _gold;
    this.bet = 0;
    this.privateCards = [];
    this.action = "";
    this.inTurn = 0;
};

// UX flow control on player
Player.prototype.bet = function (_bet) {
    this.bet = _bet;
    this.gold -= bet;
};

Player.prototype.die = function () {
    this.status = playerStatusDead;
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
