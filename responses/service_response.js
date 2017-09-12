/**
 * Created by the-engine team
 * 2017-09-08
 */

function ServiceResponse(status, cause) {
    this.status = status;
    this.cause = cause;
}

module.exports = ServiceResponse;