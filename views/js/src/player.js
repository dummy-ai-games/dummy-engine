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
    // member allCards might not be needed
    this.allCards = [];
};

// UX flow control on player
Player.prototype.bet = function (bet) {
    this.gold -= bet;
};

Player.prototype.die = function () {
    this.status = playerStatusDead;
};
