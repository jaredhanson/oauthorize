/**
 * Module dependencies.
 */
var AuthorizationError = require('../errors/authorizationerror');


/**
 * Loads an OAuth authorization transaction from the session.
 *
 * This middleware is used to load an ongoing OAuth transaction that is
 * serialized into the session.  In most circumstances, this is transparently
 * done prior to processing a user's decision with `userDecision` middleware,
 * and an implementation shouldn't need to mount this middleware explicitly.
 *
 * Options:
 *   - `transactionField`  field name containing transaction ID, defaults to _transaction_id_
 *
 * @param {Server} server
 * @param {Object} options
 * @return {Function}
 * @api public
 */
module.exports = function transactionLoader(server, options) {
  options = options || {};
  
  if (!server) throw new Error('OAuth transactionLoader middleware requires a server instance.');
  
  var field = options.transactionField || 'transaction_id'
    , key = options.sessionKey || 'authorize';
  
  return function transactionLoader(req, res, next) {
    if (!req.session) { return next(new Error('OAuth service provider requires session support.')); }
    if (!req.session[key]) { return next(new Error('Invalid OAuth session key.')); }
    
    var query = req.query || {}
      , body = req.body || {}
      , tid = query[field] || body[field];
      
    if (!tid) { return next(); }
    var txn = req.session[key][tid];
    if (!txn) { return next(); }
    
    server.deserializeClient(txn.client, function(err, client) {
      if (err) { return next(err); }
      if (!client) {
        // At the time the request was initiated, the client was validated.
        // Since then, however, it has been invalidated.  The transaction will
        // be invalidated and no response will be sent to the client.
        delete req.session[key][tid];
        return next(new AuthorizationError('no longer authorized', 'consumer_key_rejected'));
      };
      
      req.oauth = {};
      req.oauth.transactionID = tid;
      req.oauth.client =
      req.oauth.consumer = client;
      req.oauth.callbackURL = txn.callbackURL;
      req.oauth.req = txn.req;
      req.oauth.authz = txn.authz;
      next();
    });
  }
}
