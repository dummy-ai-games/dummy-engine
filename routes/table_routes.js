/**
 * Created by the-engine team
 * 2017-10-19
 */

var app = require('../the-engine.js');
var tableService = require('../rest_services/table_service.js');

app.post("/table/list_tables", tableService.listTables);
app.post("/table/trace_tables", tableService.listTablesForTrace);
