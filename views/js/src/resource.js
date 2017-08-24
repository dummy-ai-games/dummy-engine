/**
 * Created by Strawmanbobi
 * 2017-08-21
 */

var bg = "./res/images/game_bg.jpg";

var s_p_2C = "./res/images/poker/2C.png";
var s_p_2D = "./res/images/poker/2D.png";
var s_p_2H = "./res/images/poker/2H.png";
var s_p_2S = "./res/images/poker/2S.png";
var s_p_3C = "./res/images/poker/3C.png";
var s_p_3D = "./res/images/poker/3D.png";
var s_p_3H = "./res/images/poker/3H.png";
var s_p_3S = "./res/images/poker/3S.png";
var s_p_4C = "./res/images/poker/4C.png";
var s_p_4D = "./res/images/poker/4D.png";
var s_p_4H = "./res/images/poker/4H.png";
var s_p_4S = "./res/images/poker/4S.png";
var s_p_5C = "./res/images/poker/5C.png";
var s_p_5D = "./res/images/poker/5D.png";
var s_p_5H = "./res/images/poker/5H.png";
var s_p_5S = "./res/images/poker/5S.png";
var s_p_6C = "./res/images/poker/6C.png";
var s_p_6D = "./res/images/poker/6D.png";
var s_p_6H = "./res/images/poker/6H.png";
var s_p_6S = "./res/images/poker/6S.png";
var s_p_7C = "./res/images/poker/7C.png";
var s_p_7D = "./res/images/poker/7D.png";
var s_p_7H = "./res/images/poker/7H.png";
var s_p_7S = "./res/images/poker/7S.png";
var s_p_8C = "./res/images/poker/8C.png";
var s_p_8D = "./res/images/poker/8D.png";
var s_p_8H = "./res/images/poker/8H.png";
var s_p_8S = "./res/images/poker/8S.png";
var s_p_9C = "./res/images/poker/9C.png";
var s_p_9D = "./res/images/poker/9D.png";
var s_p_9H = "./res/images/poker/9H.png";
var s_p_9S = "./res/images/poker/9S.png";
var s_p_TC = "./res/images/poker/TC.png";
var s_p_TD = "./res/images/poker/TD.png";
var s_p_TH = "./res/images/poker/TH.png";
var s_p_TS = "./res/images/poker/TS.png";
var s_p_JC = "./res/images/poker/JC.png";
var s_p_JD = "./res/images/poker/JD.png";
var s_p_JH = "./res/images/poker/JH.png";
var s_p_JS = "./res/images/poker/JS.png";
var s_p_QC = "./res/images/poker/QC.png";
var s_p_QD = "./res/images/poker/QD.png";
var s_p_QH = "./res/images/poker/QH.png";
var s_p_QS = "./res/images/poker/QS.png";
var s_p_KC = "./res/images/poker/KC.png";
var s_p_KD = "./res/images/poker/KD.png";
var s_p_KH = "./res/images/poker/KH.png";
var s_p_KS = "./res/images/poker/KS.png";
var s_p_AC = "./res/images/poker/AC.png";
var s_p_AD = "./res/images/poker/AD.png";
var s_p_AH = "./res/images/poker/AH.png";
var s_p_AS = "./res/images/poker/AS.png";
var s_p_empty = "./res/images/poker/empty.png";
var s_p_back = "./res/images/poker/back.png";

var s_a_avatar_1 = "./res/images/avatar/avatar_01.jpg";
var s_a_avatar_2 = "./res/images/avatar/avatar_02.jpg";
var s_a_avatar_3 = "./res/images/avatar/avatar_03.jpg";
var s_a_avatar_4 = "./res/images/avatar/avatar_04.jpg";

var pokerMap = new Map();
pokerMap.set("2C", s_p_2C);
pokerMap.set("2D", s_p_2D);
pokerMap.set("2H", s_p_2H);
pokerMap.set("2S", s_p_2S);
pokerMap.set("3C", s_p_3C);
pokerMap.set("3D", s_p_3D);
pokerMap.set("3H", s_p_3H);
pokerMap.set("3S", s_p_3S);
pokerMap.set("4C", s_p_4C);
pokerMap.set("4D", s_p_4D);
pokerMap.set("4H", s_p_4H);
pokerMap.set("4S", s_p_4S);
pokerMap.set("5C", s_p_5C);
pokerMap.set("5D", s_p_5D);
pokerMap.set("5H", s_p_5H);
pokerMap.set("5S", s_p_5S);
pokerMap.set("6C", s_p_6C);
pokerMap.set("6D", s_p_6D);
pokerMap.set("6H", s_p_6H);
pokerMap.set("6S", s_p_6S);
pokerMap.set("7C", s_p_7C);
pokerMap.set("7D", s_p_7D);
pokerMap.set("7H", s_p_7H);
pokerMap.set("7S", s_p_7S);
pokerMap.set("8C", s_p_8C);
pokerMap.set("8D", s_p_8D);
pokerMap.set("8H", s_p_8H);
pokerMap.set("8S", s_p_8S);
pokerMap.set("9C", s_p_9C);
pokerMap.set("9D", s_p_9D);
pokerMap.set("9H", s_p_9H);
pokerMap.set("9S", s_p_9S);
pokerMap.set("TC", s_p_TC);
pokerMap.set("TD", s_p_TD);
pokerMap.set("TH", s_p_TH);
pokerMap.set("TS", s_p_TS);
pokerMap.set("JC", s_p_JC);
pokerMap.set("JD", s_p_JD);
pokerMap.set("JH", s_p_JH);
pokerMap.set("JS", s_p_JS);
pokerMap.set("QC", s_p_QC);
pokerMap.set("QD", s_p_QD);
pokerMap.set("QH", s_p_QH);
pokerMap.set("QS", s_p_QS);
pokerMap.set("KC", s_p_KC);
pokerMap.set("KD", s_p_KD);
pokerMap.set("KH", s_p_KH);
pokerMap.set("KS", s_p_KS);
pokerMap.set("AC", s_p_AC);
pokerMap.set("AD", s_p_AD);
pokerMap.set("AH", s_p_AH);
pokerMap.set("AS", s_p_AS);


var resources = [
    bg,
    s_p_2C,
    s_p_2D,
    s_p_2H,
    s_p_2S,
    s_p_3C,
    s_p_3D,
    s_p_3H,
    s_p_3S,
    s_p_4C,
    s_p_4D,
    s_p_4H,
    s_p_4S,
    s_p_5C,
    s_p_5D,
    s_p_5H,
    s_p_5S,
    s_p_6C,
    s_p_6D,
    s_p_6H,
    s_p_6S,
    s_p_7C,
    s_p_7D,
    s_p_7H,
    s_p_7S,
    s_p_8C,
    s_p_8D,
    s_p_8H,
    s_p_8S,
    s_p_9C,
    s_p_9D,
    s_p_9H,
    s_p_9S,
    s_p_TC,
    s_p_TD,
    s_p_TH,
    s_p_TS,
    s_p_JC,
    s_p_JD,
    s_p_JH,
    s_p_JS,
    s_p_QC,
    s_p_QD,
    s_p_QH,
    s_p_QS,
    s_p_KC,
    s_p_KD,
    s_p_KH,
    s_p_KS,
    s_p_AC,
    s_p_AD,
    s_p_AH,
    s_p_AS,
    s_p_empty,
    s_p_back,
    s_a_avatar_1,
    s_a_avatar_2,
    s_a_avatar_3,
    s_a_avatar_4];