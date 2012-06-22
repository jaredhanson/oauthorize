/**
 * Module dependencies.
 */
var url = require('url');

/**
 * Handle a user's response to an authorization dialog.
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
module.exports = function userDescision(server, options, parse, issue) {
  if (typeof options == 'function') {
    issue = parse;
    parse = options;
    options = {};
  }
  if (!issue) {
    // fn signature: userDescision(server, options, issue)
    issue = parse;
    parse = function(req, done) { return done(); };
  }
  options = options || {};
  
  if (!server) throw new Error('OAuth userDescision middleware requires a server instance.');
  if (!issue) throw new Error('OAuth userDescision middleware requires an issue function.');
  
  var cancelField = options.cancelField || 'cancel'
    , userProperty = options.userProperty || 'user'
    , key = options.sessionKey || 'authorize';
  
  var redirectOnCancel = (options.redirectOnCancel !== undefined) ? options.redirectOnCancel : true;
  
  return function userDescision(req, res, next) {
    if (!req.session) { return next(new Error('OAuth service provider requires session support.')); }
    if (!req.session[key]) { return next(new Error('Invalid OAuth session key.')); }
    if (!req.body) { return next(new Error('OAuth service provider requires body parsing.')); }
    if (!req.oauth) { return next(new Error('OAuth transaction not found.')); }
    
    parse(req, function(err, ares) {
      if (err) { return next(err); }
      
      var tid = req.oauth.transactionID;
      req.oauth.user = req[userProperty];
      req.oauth.res = ares || {};
      
      if (req.oauth.res.allow === undefined) {
        if (!req.body[cancelField]) { req.oauth.res.allow = true; }
        else { req.oauth.res.allow = false; }
      }
      
      var allow = req.oauth.res.allow;
      
      function removeTxnLater() {
        // proxy end() to delete the transaction
        var end = res.end;
        res.end = function(chunk, encoding) {
          delete req.session[key][tid];
          res.end = end;
          res.end(chunk, encoding);
        }
      }
    
      if (allow) {
        issue(req.oauth.authz.token, req.oauth.user, req.oauth.res, function(err, verifier) {
          if (err) { return next(err); }
        
          if (!req.oauth.callbackURL || req.oauth.callbackURL == 'oob') {
            req.oauth.verifier = verifier;
            removeTxnLater();
            return next();
          }
        
          var parsed = url.parse(req.oauth.callbackURL, true);
          delete parsed.search;
          parsed.query['oauth_token'] = req.oauth.authz.token;
          if (verifier) { parsed.query['oauth_verifier'] = verifier; }

          removeTxnLater();
          var location = url.format(parsed);
          return res.redirect(location);
        });
      } else {
        // OAuth does not define what should occur when the user denies access.
        // Most applications either redirect back to the consumer or display an
        // intermediate page confirming that access was not granted, which in
        // turn offers a link back to the consumer.
        //
        // In order to match behavior in OAuth 2.0, and inform the consumer
        // application that access was denied, this middleware's default
        // behavior is to redirect with a problem indication.  This behavior can
        // be disabled by setting the `redirectOnCancel` option to `false`, in
        // which case it is expected that the application will implement
        // middleware to handle this situation as desired, for example by
        // checking if `req.oauth.res.allow` is `false` and rendering a message
        // to display to the user.
        
        if (!req.oauth.callbackURL || req.oauth.callbackURL == 'oob') {
          removeTxnLater();
          return next();
        }
        
        if (redirectOnCancel) {
          var parsed = url.parse(req.oauth.callbackURL, true);
          delete parsed.search;
          parsed.query['oauth_problem'] = 'user_refused';
          
          removeTxnLater();
          var location = url.format(parsed);
          return res.redirect(location);
        } else {
          removeTxnLater();
          return next();
        }
      }
    });
  }
}
