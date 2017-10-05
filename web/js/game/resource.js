/**
 * Created by the-engine-team
 * 2017-08-21
 */

// board images
var s_bg = "./res/images/game_board/bg.png";
var s_winner_bg = "./res/images/game_board/winner_bg.png";
var s_dec_bottom = "./res/images/game_board/bg_chip.png";
var s_bg_board = "./res/images/game_board/bg_table.png";
var s_bg_mm_2 = "./res/images/game_board/img_beauty_3.png";
var s_tm_logo = "./res/images/game_board/tm_logo.png";

// player images
var s_avatar_panel_right = "./res/images/game_board/bg_avatar_right.png";
var s_name_panel_right = "./res/images/game_board/bg_name_right.png";
var s_avatar_panel_right_hl = "./res/images/game_board/bg_avatar_right_hl.png";
var s_name_panel_right_hl = "./res/images/game_board/bg_name_right_hl.png";

var s_avatar_panel_left = "./res/images/game_board/bg_avatar_left.png";
var s_name_panel_left = "./res/images/game_board/bg_name_left.png";
var s_avatar_panel_left_hl = "./res/images/game_board/bg_avatar_left_hl.png";
var s_name_panel_left_hl = "./res/images/game_board/bg_name_left_hl.png";

var s_chips = "./res/images/game_board/chips.png";

var s_start_button = "./res/images/game_board/start_button.png";
var s_start_button_pressed = "./res/images/game_board/start_button_pressed.png";
var s_start_button_disabled = "./res/images/game_board/start_button_disabled.png";
var s_stop_button = "./res/images/game_board/stop_button.png";
var s_stop_button_pressed = "./res/images/game_board/stop_button_pressed.png";
var s_stop_button_disabled = "./res/images/game_board/stop_button_disabled.png";

// poker cards
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

// actions, NOTE: sizes of action images must be exactly the same
var action_empty = "./res/images/game_board/action_empty.png";
var action_allin = "./res/images/game_board/action_all_in.png";
var action_bet_left = "./res/images/game_board/action_left_bet.png";
var action_call_left = "./res/images/game_board/action_left_call.png";
var action_check_left = "./res/images/game_board/action_left_check.png";
var action_fold_left = "./res/images/game_board/action_left_fold.png";
var action_raise_left = "./res/images/game_board/action_left_raise.png";

var actionLeftMap = new Map();
actionLeftMap.set("allin", action_allin);
actionLeftMap.set("bet", action_bet_left);
actionLeftMap.set("call", action_call_left);
actionLeftMap.set("check", action_check_left);
actionLeftMap.set("fold", action_fold_left);
actionLeftMap.set("raise", action_raise_left);

var action_bet_right = "./res/images/game_board/action_right_bet.png";
var action_call_right = "./res/images/game_board/action_right_call.png";
var action_check_right = "./res/images/game_board/action_right_check.png";
var action_fold_right = "./res/images/game_board/action_right_fold.png";
var action_raise_right = "./res/images/game_board/action_right_raise.png";

var actionRightMap = new Map();
actionRightMap.set("allin", action_allin);
actionRightMap.set("bet", action_bet_right);
actionRightMap.set("call", action_call_right);
actionRightMap.set("check", action_check_right);
actionRightMap.set("fold", action_fold_right);
actionRightMap.set("raise", action_raise_right);

// avatars
var s_a_avatar_0 = "./res/images/avatars/avatar_0.png";
var s_a_avatar_1 = "./res/images/avatars/avatar_1.png";
var s_a_avatar_2 = "./res/images/avatars/avatar_2.png";
var s_a_avatar_3 = "./res/images/avatars/avatar_3.png";
var s_a_avatar_4 = "./res/images/avatars/avatar_4.png";
var s_a_avatar_5 = "./res/images/avatars/avatar_5.png";
var s_a_avatar_6 = "./res/images/avatars/avatar_6.png";
var s_a_avatar_7 = "./res/images/avatars/avatar_7.png";
var s_a_avatar_8 = "./res/images/avatars/avatar_8.png";
var s_a_avatar_9 = "./res/images/avatars/avatar_9.png";
var s_a_avatar_a = "./res/images/avatars/avatar_a.png";
var s_a_avatar_b = "./res/images/avatars/avatar_b.png";
var s_a_avatar_c = "./res/images/avatars/avatar_c.png";
var s_a_avatar_d = "./res/images/avatars/avatar_d.png";
var s_a_avatar_e = "./res/images/avatars/avatar_e.png";
var s_a_avatar_f = "./res/images/avatars/avatar_f.png";
var avatars = [s_a_avatar_0, s_a_avatar_1, s_a_avatar_2, s_a_avatar_3, s_a_avatar_4, s_a_avatar_5,
                s_a_avatar_6, s_a_avatar_7, s_a_avatar_8, s_a_avatar_9, s_a_avatar_a, s_a_avatar_b,
                s_a_avatar_c, s_a_avatar_d, s_a_avatar_e, s_a_avatar_f];


// global resource list
var resources = [
    s_bg,
    s_winner_bg,
    s_dec_bottom,
    s_bg_board,
    s_bg_mm_2,
    s_avatar_panel_right,
    s_name_panel_right,
    s_avatar_panel_right_hl,
    s_name_panel_right_hl,
    s_avatar_panel_left,
    s_name_panel_left,
    s_avatar_panel_left_hl,
    s_name_panel_left_hl,
    s_chips,
    s_tm_logo,
    s_start_button,
    s_start_button_pressed,
    s_start_button_disabled,
    s_stop_button,
    s_stop_button_pressed,
    s_stop_button_disabled,
    s_a_avatar_0,
    s_a_avatar_1,
    s_a_avatar_2,
    s_a_avatar_3,
    s_a_avatar_4,
    s_a_avatar_5,
    s_a_avatar_6,
    s_a_avatar_7,
    s_a_avatar_8,
    s_a_avatar_9,
    s_a_avatar_a,
    s_a_avatar_b,
    s_a_avatar_c,
    s_a_avatar_d,
    s_a_avatar_e,
    s_a_avatar_f,
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
    action_empty,
    action_allin,
    action_bet_left,
    action_call_left,
    action_check_left,
    action_fold_left,
    action_raise_left,
    action_bet_right,
    action_call_right,
    action_check_right,
    action_fold_right,
    action_raise_right];