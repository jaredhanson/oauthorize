/**
 * Module dependencies.
 */
var util = require('util')
  , utils = require('../utils')
  , BadRequestError = require('../errors/badrequesterror')
  , AuthorizationError = require('../errors/authorizationerror');


/**
 * Parses requests to obtain user authorization.
 *
 * An implementation may declare the `oauth_token` parameter optional, in which
 * case the user must be prompted to enter it manually.  This middleware expects
 * the parameter to be present, and it is the responsibility of an application
 * to detect the missing optional parameter, render a form in which to input the
 * token, and submit the form to an endpoint, at which point this middleware can
 * proceed to process the request.
 *
 * References:
 *  - [Resource Owner Authorization](http://tools.ietf.org/html/rfc5849#section-2.2)
 *  - [Obtaining User Authorization](http://oauth.net/core/1.0a/#auth_step2)
 *  - [Obtaining User Authorization](http://oauth.net/core/1.0/#auth_step2)
 *
 * @param {Server} server
 * @param {Object} options
 * @param {Function} validate
 * @return {Function}
 * @api public
 */
module.exports = function userAuthorization(server, options, parse, validate) {
  if (typeof options == 'function') {
    validate = parse;
    parse = options;
    options = {};
  }
  if (!validate) {
    // fn signature: userAuthorization(server, options, issue)
    validate = parse;
    parse = function(req, done) { return done(); };
  }
  options = options || {};
  
  if (!server) throw new Error('OAuth userAuthorization middleware requires a server instance.');
  if (!validate) throw new Error('OAuth userAuthorization middleware requires a validate function.');
  
  var lenTxnID = options.idLength || 8;
  var key = options.sessionKey || 'authorize';
  
  return function userAuthorization(req, res, next) {
    if (!req.session) { return next(new Error('OAuth service provider requires session support.')); }
    
    var token = req.query['oauth_token']
      , callback = req.query['oauth_callback'];
    
    if (!token) { return next(new BadRequestError('missing oauth_token parameter')); }
    
    req.oauth = {};
    
    function validated(err, consumer, callbackURL, areq) {
      // Set properties *before* next()'ing due to error.  The presence of a
      // callbackURL being provided, even under error conditions, indicates
      // that the client should be informed of the error via a redirect.
      req.oauth.client =
      req.oauth.consumer = consumer;
      req.oauth.callbackURL = callbackURL;
      
      if (err) { return next(err); }
      if (!consumer) {
        // At the time the request was initiated, the client was validated.
        // Since then, however, it has either been invalidated or is not allowed
        // based on additional parameters in the user authorization request.
        return next(new AuthorizationError('request token not valid', 'token_rejected'));
      };
      
      req.oauth.req = areq;
      
      server.serializeClient(consumer, function(err, obj) {
        if (err) { return next(err); }
      
        var tid = utils.uid(lenTxnID);
        req.oauth.transactionID = tid;
      
        var txn = {};
        txn.protocol = 'oauth';
        txn.client = obj;
        txn.callbackURL = callbackURL;
        txn.req = areq;
        txn.authz = req.oauth.authz;
        // store transaction in session
        var txns = req.session[key] = req.session[key] || {};
        txns[tid] = txn;
      
        next();
      });
    }
    
    parse(req, function(err, params) {
      if (err) { return next(err); }
      
      req.oauth.authz = params || {}
      req.oauth.authz.token = token;
      
      // WARNING: This callback URL is for OAuth 1.0 support.  A service
      //          provider that unconditionally accepts a URL during this phase
      //          may be inadvertently assisting in session fixation attacks, as
      //          described here:
      // 
      //          http://oauth.net/advisories/2009-1/
      //          http://hueniverse.com/2009/04/explaining-the-oauth-session-fixation-attack/
      //
      //          Service providers are encouraged to implement monitoring to
      //          detect potential attacks, and display advisory notices to
      //          users.
      
      req.oauth.authz.callbackURL = callback;
      
      var arity = validate.length;
      if (arity == 3) {
        validate(token, req.oauth.authz, validated);
      } else { // arity == 2
        validate(token, validated);
      }
    });
  }
}
