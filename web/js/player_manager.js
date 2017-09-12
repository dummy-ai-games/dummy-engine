/**
 * Created by the-engine-team
 * 2017-09-12
 */

var currentTableNumber = 0;
var selectedPlayer = null;

$(document).ready(function() {
    initUI();
    initData();
});

function initUI() {
    $('#tables').select2({
    });
}

function initData() {
    loadTables();
}

// data related functions
function loadTables() {
    $.ajax({
        url: '/player/list_tables',
        type: 'GET',
        dataType: 'json',
        data: {},
        timeout: 20000,
        success: function (response) {
            if(response.status.code === 0) {
                console.log('list tables successfully');
                refreshTables(response.entity);
                if (0 === currentTableNumber) {
                    currentTableNumber = response.entity[0].tableNumber;
                    loadPlayersByTable();
                }
            } else {
                popUpHintDialog('获取游戏桌列表失败');
            }
        },
        error: function () {
            popUpHintDialog('获取游戏桌列表失败');
        }
    });
}

function loadPlayersByTable() {
    var url;
    url = '/player/get_players?table_number='+currentTableNumber;
    $('#player_table_container').empty();
    $('#player_table_container').append('<table id="player_table" data-row-style="rowStyle"></table>');

    $('#player_table').bootstrapTable({
        method: 'get',
        url: url,
        cache: false,
        height: 600,
        pagination: true,
        pageSize: 50,
        pageList: [10, 25, 50, 100, 200],
        search: true,
        showColumns: true,
        showRefresh: false,
        minimumCountColumns: 2,
        clickToSelect: true,
        singleSelect: true,
        showExport: true,
        exportDataType: 'all',
        exportTypes: ['txt', 'sql', 'excel'],
        columns: [{
            field: '',
            checkbox: true
        }, {
            field: 'playerName',
            title: '玩家名',
            align: 'left',
            valign: 'middle',
            sortable: true
        }, {
            field: '_id',
            title: 'ID',
            align: 'left',
            valign: 'middle',
            sortable: true
        },{
            field: 'tableNumber',
            title: '游戏桌号',
            align: 'left',
            valign: 'middle',
            sortable: true
        }]
    }).on('check.bs.table', function (e, row) {
        onPlayerSelected(row);
    }).on('uncheck.bs.table', function (e, row) {
        onPlayerUnselected();
    });
}

function onPlayerSelected(data) {
    selectedPlayer = data;
    $('#player_name').val(selectedPlayer.playerName);
    $('#table_number').val(selectedPlayer.tableNumber);

    // show update and remove button
    $('#create_player_button').hide();
    $('#remove_player_button').show();
}

function onPlayerUnselected() {
    selectedPlayer = null;
    $('#player_name').val('');
    $('#table_number').val('');

    // hide update and remove button
    $('#create_player_button').show();
    $('#remove_player_button').hide();
}

function onSelectedTableChanged() {
    currentTableNumber = $('#tables').val();
    if (0 !== currentTableNumber) {
        loadPlayersByTable();
    }
}

// UI related functions
function refreshTables(tablesList) {
    $('#tables')
        .find('option')
        .remove()
        .end();

    if (tablesList.length > 0) {
        $.each(tablesList, function (i, table) {
            $('#tables').append($('<option>', {
                value: table.tableNumber,
                text : table.tableNumber
            }));
        });
    } else {
        $('#tables').append($('<option>', {
            value: 0,
            text : '请选择游戏桌号'
        }));
    }

    $('#tables').select2({});
}

function updatePlayer() {
    var playerName = $('#player_name').val();
    var tableNumber = $('#table_number').val();

    if (null === playerName ||
        null === tableNumber ||
        '' === playerName ||
        '' === tableNumber) {
        popUpHintDialog('玩家名或者游戏桌号为空');
        return;
    }

    if (null === selectedPlayer) {
        selectedPlayer = new Object();
    }
    selectedPlayer.playerName = playerName;
    selectedPlayer.tableNumber = tableNumber;

    $.ajax({
        url: '/player/update_player',
        type: 'POST',
        dataType: 'json',
        data: selectedPlayer,
        timeout: 20000,
        success: function (response) {
            if(response.status.code === 0) {
                popUpHintDialog('添加玩家成功');
                currentTableNumber = selectedPlayer.tableNumber;
                $('#table_number').val(currentTableNumber);
                onPlayerUnselected();
                loadTables();
                loadPlayersByTable();
            } else if(response.status.code === 1) {
                popUpHintDialog('玩家已存在');
                onPlayerUnselected();
                loadTables();
                loadPlayersByTable();
            }
        },
        error: function () {
            popUpHintDialog('添加玩家失败');
            onPlayerUnselected();
            loadTables();
            loadPlayersByTable();
        }
    });
}

function removePlayer() {
    if (null === selectedPlayer) {
        popUpHintDialog('请选中一个玩家');
        return;
    }
    $.ajax({
        url: '/player/delete_player',
        type: 'POST',
        dataType: 'json',
        data: selectedPlayer,
        timeout: 20000,
        success: function (response) {
            if(response.status.code === 0) {
                console.log('delete player successfully');
                onPlayerUnselected();
                loadTables();
                loadPlayersByTable();
            } else if(response.status.code === 1) {
                popUpHintDialog('删除玩家失败');
                onPlayerUnselected();
                loadTables();
                loadPlayersByTable();
            }
        },
        error: function () {
            popUpHintDialog('删除玩家失败');
            onPlayerUnselected();
            loadTables();
            loadPlayersByTable();
        }
    });
}

function popUpHintDialog(hint) {
    $('#text_hint').empty();
    $('#text_hint').append(hint);
    $('#hint_dialog').modal();
}