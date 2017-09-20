/**
 * Created by the-engine-team
 * 2017-09-20
 */

var hasUpdate =
    [{
        tab: 'game_instruction_new',
        update: 1
    }, {
        tab: 'api_new',
        update: 1
    }, {
        tab: 'example_new',
        update: 1
    }, {
        tab: 'faq_new',
        update: 1
    }, {
        tab: 'release_note_new',
        update: 0
    }];

$(document).ready(function() {
    initUpdates();
});

function initUpdates() {
    // TODO: remove the new dot after user has clicked the tab
}

function gotoTest() {
    var tableNumber = window.prompt("table number ?", "");
    if (tableNumber === null || tableNumber === "") {
        return;
    }
    window.location="./game.html?table="+tableNumber;
}

function hideTip() {
    $('#tip').hide();
}