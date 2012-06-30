/**
 * Module dependencies.
 */
var url = require('url');

/**
 * Handle a user's response to an authorization dialog.
 *
 * This middleware processes a user's decision to allow or deny authorization.
 * If authorization is allowed, the user will be redirected back to the client
 * with a verifier.  If authorization is denied, by default, the user will be
 * redirected back with a problem indicatation formatted according to the
 * Problem Reporting extension.
 *
 * After this middleware has completed processing, if control is passed to the
 * service provider application, an OAuth transaction will be exposed as
 * properties on the request:
 *
 *     req.oauth.transactionID  an ID assigned to this transaction
 *     req.oauth.consumer       the consumer instance supplied by the application to the `validate` callback
 *     req.oauth.client         alias for `req.oauth.consumer`
 *     req.oauth.callbackURL    URL to redirect the user to after authorization
 *     req.oauth.req            parameters from the initial request token request made by the client
 *     req.oauth.authz          parameters parsed from this user authorization request
 *     req.oauth.user           the authenticated user who allowed or denied the authorization request
 *     req.oauth.res            the users decision, including `allow` flag and other parameters parsed by the implementation
 *     req.oauth.verifier       the verifier required to obtain an access token
 *
 * Note that it is the latter three properties that are available only after a
 * decision has been obtained.
 *
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(requestToken, user, res, done) { ... }
 *
 * `requestToken` is the request token authorized by `user`.  `user` is the
 * authenticated user who authorized `requestToken`.  `res` is an optional
 * argument containing other parameters parsed from the request (for example,
 * scope of access).  `done` is a callback which must be invoked with the
 * following signature:
 *
 *     done(err, verifier);
 *
 * `verifier` is the verifier required for the client to exchange the request
 * token for an access token.  If an error occurs, `done` should be invoked with
 * `err` set in idomatic Node.js fashion.
 *
 *
 * An optional `parse` callback can also be passed as an argument, for which the
 * function signature is as follows:
 *
 *     function(req, done) { ... }
 *
 * `req` is the request, which can be parsed for any additional parameters found
 * in query as required by the service provider.  `done` is a callback which
 * must be invoked with the following signature:
 *
 *     done(err, params);
 *
 * `params` are the additional parameters parsed from the request.  These will
 * be passed to the `issue` callback detailed above.  If an error occurs, `done`
 * should be invoked with `err` set in idomatic Node.js fashion.
 *
 *
 * Options:
 *   - `cancelField`       field name set if the user chose to deny access, defaults to _cancel_
 *   - `redirectOnCancel`  set to `false` to disable default redirect on cancel behavior (default: `true`)
 *
 * Optional Functionality:
 *
 * An implementation may allow OAuth to operate without a callback URL.  In this
 * case, it is expected that the application will display the verifier and
 * instruct the user to enter it manually in the client application.  This can
 * be accomplished by rendering the necessary views after this middleware has
 * completed processing.
 *
 * Examples:
 *
 *     app.post('/dialog/authorize/decision',
 *       login.ensureLoggedIn(),
 *       oauth.userDecision(function(requestToken, user, done) {
 *         RequestToken.findOne(requestToken, function(err, token) {
 *           if (err) { return done(err); }
 *           var verifier = utils.uid(8);
 *           token.authorized = true;
 *           token.userId = user.id;
 *           token.verifier = verifier;
 *           token.save(function(err) {
 *             if (err) { return done(err); }
 *             return done(null, verifier);
 *           });
 *         });
 *       }));
 *
 *     app.post('/dialog/authorize/decision',
 *       login.ensureLoggedIn(),
 *       oauth.userDecision(
 *         function(req, done) {
 *           var params = { scope: req.body.scope }
 *           return done(null, params);
 *         },
 *         function(requestToken, user, res, done) {
 *           RequestToken.findOne(requestToken, function(err, token) {
 *             if (err) { return done(err); }
 *             var verifier = utils.uid(8);
 *             token.authorized = true;
 *             token.userId = user.id;
 *             token.scope = res.scope;
 *             token.verifier = verifier;
 *             token.save(function(err) {
 *               if (err) { return done(err); }
 *               return done(null, verifier);
 *             });
 *           });
 *         }
 *       ));
 *
 * References:
 *  - [Resource Owner Authorization](http://tools.ietf.org/html/rfc5849#section-2.2)
 *  - [Obtaining User Authorization](http://oauth.net/core/1.0a/#auth_step2)
 *  - [Obtaining User Authorization](http://oauth.net/core/1.0/#auth_step2)
 *  - [Problem Reporting](http://wiki.oauth.net/w/page/12238543/ProblemReporting)
 *
 * @param {Server} server
 * @param {Object} options
 * @param {Function} parse (optional)
 * @param {Function} issue
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
        function issued(err, verifier) {
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
        }
        
        var arity = issue.length;
        if (arity == 4) {
          issue(req.oauth.authz.token, req.oauth.user, req.oauth.res, issued);
        } else { // arity == 3
          issue(req.oauth.authz.token, req.oauth.user, issued);
        }
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
        
        // TODO: Implement optional `deny` callback
        
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
