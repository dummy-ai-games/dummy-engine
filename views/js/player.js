/**
 * Created by the-engine-team
 * 2017-08-29
 */

var self;
var roundBets;
var bets;
var board;
var minBet;
var raiseCount;
var otherPlayers;
var playerActions = {};
var gameStatus = 0;
var risk = 1;
var danager = 2;
var rtc = SkyRTC();
var firstParam;
var url = location.href.split("?");
if (url.length > 1) {
    var params = url[1].split("&");
    if (params.length > 0)
        firstParam = params[0].split("=")[1];

}

rtc.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('#')[0], firstParam);

rtc.on("__action", function (data) {
    console.log(data);

    $("#userName").text("用户名:" + data.self.playerName);
    $("#bet").prop("disabled", true);
    $("#msg").text("该回合轮到你了");
    $("#msg").show();
    $("#amount").val("");
    $("#action").show();
    self = data.self;
    roundBets = data.game.roundBets;
    bets = data.game.bets;
    board = data.game.board;
    minBet = data.game.minBet;
    raiseCount = data.game.raiseCount;
    otherPlayers = data.game.otherPlayers;
    takeAction(self.cards, self.cards.concat(board), otherPlayers);
});

rtc.on("__bet", function (data) {
    console.log(data);

    $("#msg").text("该回合轮到你首先押注,注意最小押注额");
    $("#bet").prop("disabled", false);
    $("#msg").show();
    $("#amount").val("");
    $("#action").show();
    self = data.self;
    roundBets = data.game.roundBets;
    bets = data.game.bets;
    board = data.game.board;
    minBet = data.game.minBet;
    raiseCount = data.game.raiseCount;
    otherPlayers = data.game.otherPlayers;
    takeAction(self.cards, self.cards.concat(board), otherPlayers);
});

rtc.on('__newRound', function (data) {
    playerActions = {};
    gameStatus = 0;
});
rtc.on('__showAction', function (data) {
    console.log("action : " + JSON.stringify(data.action));
    var playerAction = data.action;


    if (!playerActions[playerAction.playerName]) {
        playerActions[playerAction.playerName] = [];
    }
    var currentPlayer = playerActions[playerAction.playerName];
    currentPlayer.push(playerAction.action);
    if (data.table.roundName == 'Flop' && (playerAction.action == 'raise' || playerAction.action == 'allin') && currentPlayer.toString().indexOf('raise') == -1) {
        gameStatus = risk;
    }
    if (data.table.roundName == 'Turn' && (playerAction.action == 'raise' || playerAction.action == 'allin') && currentPlayer.toString().indexOf('raise') == -1) {
        gameStatus = danager;
    }

});

function takeAction(selfCard, cards, players) {
    if (cards.length == 2) {
        setTimeout(function () {
            $("#call").click();
        }, 2000);
        return;
    }
    var handRanks = [];
    var handSuits = [];
    var isTonghua = false;
    var isShunzi = false;
    var isSitiao = false;
    var isSantiao = false;
    var pairNumber = 0;
    var pairValue = '';
    var maxPairValue = '0';


    var temp = 1;

    for (var i = 0; i < cards.length; i++) {
        handRanks[i] = cards[i].substr(0, 1);
        handSuits[i] = cards[i].substr(1, 2);
    }
    for (var i = 0; i < selfCard.length; i++)
        selfCard[i] = selfCard[i].substr(0, 1);
    handRanks = handRanks.sort().toString().replace(/\W/g, "");
    handSuits = handSuits.sort().toString().replace(/\W/g, "");


    for (var i = 1; i < handRanks.length; i++) {
        if (handRanks[i].charCodeAt(0) - handRanks[i - 1].charCodeAt(0) == 1) {
            temp++;
            if (temp == 5)
                isShunzi = true;
        } else {
            temp = 1;
        }
    }

    temp = 1;
    for (var i = 1; i < handRanks.length; i++) {
        if (handRanks[i] == handRanks[i - 1]) {
            temp++;
            if (temp == 4)
                isSitiao = true;
            else if (temp == 3)
                isSantiao = true;
            else if (temp == 2) {
                pairNumber++;
                pairValue += handRanks[i];
                if (handRanks[i] == 'A' && maxPairValue == '0')
                    maxPairValue = '1';
                else if (handRanks[i] == 'T' && maxPairValue < 'I')
                    maxPairValue = 'I';
                else if (handRanks[i] > maxPairValue)
                    maxPairValue = handRanks[i];
            }
        } else {
            temp = 1;
        }
    }


    temp = 1;
    for (var i = 1; i < handSuits.length; i++) {
        if (handSuits[i] == handSuits[i - 1]) {
            temp++;
            if (temp == 5)
                isTonghua = true;
        }
        else
            temp = 1;
    }

    if (isTonghua || isShunzi) {
        if (handRanks.indexOf("T") > -1 && handRanks.indexOf("J") > -1 && handRanks.indexOf("Q") > -1 && handRanks.indexOf("K") > -1 && handRanks.indexOf("A") > -1)
            setTimeout(function () {
                $("#allin").click();
            }, 2000);
        else if (isTonghua && isShunzi)
            setTimeout(function () {
                $("#raise").click();
            }, 2000);
        else if (gameStatus != danager)
            setTimeout(function () {
                $("#raise").click();
            }, 2000);
        else
            setTimeout(function () {
                $("#call").click();
            }, 2000);
        return;
    }

    if (isSitiao) {
        if (gameStatus != danager)
            setTimeout(function () {
                $("#raise").click();
            }, 2000);
        else
            setTimeout(function () {
                $("#call").click();
            }, 2000);
        return;
    }

    if (isSantiao || pairNumber > 1) {
        if (isSantiao && (pairNumber > 1 || maxPairValue > '9') && gameStatus != danager)
            setTimeout(function () {
                $("#raise").click();
            }, 2000);
        else if (gameStatus == danager && !isSantiao && !(pairValue.indexOf(selfCard[0]) > -1 && pairValue.indexOf(selfCard[1]) > -1 && selfCard[0] != selfCard[1]) && maxPairValue < 'I')
            setTimeout(function () {
                $("#fold").click();
            }, 2000);
        else
            setTimeout(function () {
                $("#call").click();
            }, 2000);
        return;
    }

    if (pairNumber > 0 && (pairValue.toString().indexOf(selfCard[0]) > -1 || pairValue.toString().indexOf(selfCard[1]) > -1)) {
        if ((gameStatus == risk && maxPairValue < '6') || (gameStatus == danager && maxPairValue < 'I'))
            setTimeout(function () {
                $("#fold").click();
            }, 2000);
        else
            setTimeout(function () {
                $("#call").click();
            }, 2000);
        return;
    }

    if (cards.length > 5)
        setTimeout(function () {
            $("#fold").click();
        }, 2000);
    else
        setTimeout(function () {
            $("#call").click();
        }, 2000);

}


$("#bet").click(function () {
    var amount = $("#amount").val();
    rtc.Bet(self.playerName, amount);
    $("#msg").text("该回合您采取的是：bet" + ",押注金额是：" + amount);
    $("#msg").show();
    $("#action").hide();
});

$("#call").click(function () {
    rtc.Call(self.playerName);
    $("#msg").text("该回合您采取的是：call");
    $("#msg").show();
    $("#action").hide();
});

$("#check").click(function () {
    rtc.Check(self.playerName);
    $("#msg").text("该回合您采取的是：check");
    $("#msg").show();
    $("#action").hide();
});

$("#raise").click(function () {
    rtc.Raise(self.playerName);
    $("#msg").text("该回合您采取的是：raise");
    $("#msg").show();
    $("#action").hide();
});

$("#allin").click(function () {
    rtc.AllIn(self.playerName);
    $("#msg").text("该回合您采取的是：allin");
    $("#msg").show();
    $("#action").hide();
});

$("#fold").click(function () {
    rtc.Fold(self.playerName);
    $("#msg").text("该回合您采取的是：fold");
    $("#msg").show();
    $("#action").hide();
});

