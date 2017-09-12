/**
 * Created by the-engine team
 * 2017-09-08
 */

ServiceResponse = require("./service_response");
function TablesResponse(status, entity) {
    this.entity = entity;
    ServiceResponse.call(this, status);
}

module.exports = TablesResponse;