/**
 * Created by the-engine team
 * 2017-09-12
 */

ServiceResponse = require("./service_response");
function TablesNPlayersResponse(status, entity) {
    this.entity = entity;
    ServiceResponse.call(this, status);
}

module.exports = TablesNPlayersResponse;