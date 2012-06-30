/**
 * Module dependencies.
 */
var Server = require('./server')
  , requestToken = require('./middleware/requestToken')
  , accessToken = require('./middleware/accessToken')
  , AuthorizationError = require('./errors/authorizationerror')
  , BadRequestError = require('./errors/badrequesterror');


// expose createServer() as the module
exports = module.exports = createServer;

/**
 * Create an OAuth service provider.
 *
 * @return {Server}
 * @api public
 */
function createServer() {
  var server = new Server();
  return server;
}

/**
 * Expose `.createServer()` as module method.
 */
exports.createServer = createServer;
exports.createServiceProvider = createServer;

/**
 * Expose bundled middleware.
 */
exports.requestToken = requestToken;
exports.accessToken = accessToken;

/**
 * Expose errors.
 */
exports.AuthorizationError = AuthorizationError;
exports.BadRequestError = BadRequestError;
