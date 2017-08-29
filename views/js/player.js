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
var rtc = SkyRTC();

rtc.connect("ws:" + window.location.href.substring(window.location.protocol.length).split('#')[0], '');

rtc.on("_action", function (data) {
    console.log(data);

    $("#userName").text("用户名:"+data.player.playerName);
    $("#bet").prop("disabled",true);
    $("#msg").text("该回合轮到你了");
    $("#msg").show();
    $("#amount").val("");
    $("#action").show();
    self = data.player;
    roundBets = data.game.roundBets;
    bets = data.game.bets;
    board = data.game.board;
    minBet = data.game.minBet;
    raiseCount = data.game.raiseCount;
    /* setTimeout(function(){
         $("#call").click();
     },2000);*/

});

rtc.on("_bet", function (data) {
    console.log(data);

    $("#msg").text("该回合轮到你首先押注,注意最小押注额");
    $("#bet").prop("disabled",false);
    $("#msg").show();
    $("#amount").val("");
    $("#action").show();
    self = data.player;
    roundBets = data.game.roundBets;
    bets = data.game.bets;
    board = data.game.board;
    minBet = data.game.minBet;
    raiseCount = data.game.raiseCount;
    /* setTimeout(function(){
         $("#amount").val("20");
         $("#bet").click();
     },2000);*/
});

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

rtc.on('__showAction', function (data) {
    console.log("action : " + JSON.stringify(data.action));
});