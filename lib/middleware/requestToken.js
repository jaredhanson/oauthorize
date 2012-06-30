/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');

/**
 * Handle requests to obtain an unauthorized request token.
 *
 * This middleware implements the request token endpoint of the OAuth protocol.
 * A request token is a temporary credential, for which the sole purpose is to
 * obtain user authorization, after which the request token can be exchanged for
 * an access token.
 *
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, callbackURL, params, done) { ... }
 *
 * `client` is the authenticated OAuth client (aka consumer) that is making the
 * request.  `callbackURL` is the URL to which the client is requesting the user
 * be redirected to after authorization is complete.  `params` is an optional
 * argument containing other parameters parsed from the request.  `done` is a
 * callback which must be invoked with the following signature:
 *
 *     done(err, token, tokenSecret, params);
 *
 * `token` is the request token to be issued to the client, and `tokenSecret` is
 * the corresponding secret.  `params` is an optional argument which will be 
 * included in the response.  If an error occurs, `done` should be invoked with
 * `err` set in idomatic Node.js fashion.
 *
 *
 * An optional `parse` callback can also be passed as an argument, for which the
 * function signature is as follows:
 *
 *     function(req, done) { ... }
 *
 * `req` is the request, which can be parsed for any additional parameters found
 * in the body or query as required by the service provider.  `done` is a
 * callback which must be invoked with the following signature:
 *
 *     done(err, params);
 *
 * `params` are the additional parameters parsed from the request.  These will
 * be passed to the `issue` callback detailed above.  If an error occurs, `done`
 * should be invoked with `err` set in idomatic Node.js fashion.
 *
 *
 * Security Considerations:
 *
 * Requests to this endpoint must be authenticated.  It is expected that
 * authentication middleware will be invoked prior to this middleware being
 * invoked.  Use of `ConsumerStrategy` provided by [passport-http-oauth](https://github.com/jaredhanson/passport-http-oauth)
 * is recommended.
 *
 * If the client is not using the 1.0a revision of the OAuth protocol, the
 * `callbackURL` will be undefined during this request and supplied during the
 * user authorization request.  This exposes a potential session fixation
 * vulnerability.  Service providers that choose to support older clients are
 * encouraged to implement monitoring to detect potential attacks, and display
 * advisory notices to users.  Further details about the session fixation
 * vulnerability can be found here:
 *
 *   http://oauth.net/advisories/2009-1/
 *   http://hueniverse.com/2009/04/explaining-the-oauth-session-fixation-attack/
 *
 * Assumptions:
 *
 * `req.authInfo` must be set on the request and contain an `oauth.callbackURL`
 * property.  Due to the nature of OAuth, this parameter is transmitted along
 * with authentication credentials and is parsed during that step, *prior* to
 * this middleware being invoked.
 *
 * By design, this integrates with the `ConsumerStrategy` provided by
 * [passport-http-oauth](https://github.com/jaredhanson/passport-http-oauth).
 * That module is recommended for authentication; however, any middleware
 * satisfying these assumptions is usable.
 *
 * Examples:
 *
 *     app.post('/request_token',
 *       passport.authenticate('consumer', { session: false }),
 *       oauth.requestToken(function(client, callbackURL, done) {
 *         var token = utils.uid(8)
 *           , secret = utils.uid(32)
 *
 *         var t = new RequestToken(token, secret, client.id, callbackURL);
 *         t.save(function(err) {
 *           if (err) { return done(err); }
 *           return done(null, token, secret);
 *         });
 *       }));
 *
 *     app.post('/request_token',
 *       passport.authenticate('consumer', { session: false }),
 *       oauth.requestToken(
 *         function(req, done) {
 *           var params = { scope: req.body.scope }
 *           return done(null, params);
 *         },
 *         function(client, callbackURL, params, done) {
 *           var token = utils.uid(8)
 *             , secret = utils.uid(32)
 *
 *           var t = new RequestToken(token, secret, client.id, callbackURL, params.scope);
 *           t.save(function(err) {
 *             if (err) { return done(err); }
 *             return done(null, token, secret);
 *           });
 *         }
 *       ));
 * 
 * References:
 *  - [Temporary Credentials](http://tools.ietf.org/html/rfc5849#section-2.1)
 *  - [Obtaining an Unauthorized Request Token](http://oauth.net/core/1.0a/#auth_step1)
 *  - [Obtaining an Unauthorized Request Token](http://oauth.net/core/1.0/#auth_step1)
 *
 * @param {Object} options
 * @param {Function} parse (optional)
 * @param {Function} issue
 * @return {Function}
 * @api public
 */
module.exports = function requestToken(options, parse, issue) {
  if (typeof options == 'function') {
    issue = parse;
    parse = options;
    options = {};
  }
  if (!issue) {
    // fn signature: requestToken(options, issue)
    issue = parse;
    parse = function(req, done) { return done(); };
  }
  options = options || {};
  
  if (!issue) throw new Error('OAuth requestToken middleware requires an issue function.');
  
  var userProp = options.userProperty || 'user';
  
  return function requestToken(req, res, next) {
    if (!req.authInfo) { return next(new Error('authentication info not available')); }
    
    var consumer = req[userProp]
      , callbackURL = req.authInfo.oauth.callbackURL;
    
    function issued(err, token, tokenSecret, params) {
      if (err) { return next(err); }
      if (!token) {
        return next(new AuthorizationError('request token not issued', 'consumer_key_rejected'));
      }

      params = params || {};
      params['oauth_token'] = token;
      params['oauth_token_secret'] = tokenSecret;
      params['oauth_callback_confirmed'] = 'true';

      // TODO: Implement support for other response formats, as described by
      //       (OAuth Extension for Response Data Format - Draft 1)[http://oauth.googlecode.com/svn/spec/ext/response_data_format/1.0/drafts/1/oauth_response_data_format_ext.html]

      var fue = Object.keys(params).map(function(key) {
        return utils.encode(key) + '=' + utils.encode(params[key]);
      }).join('&');

      res.setHeader('Content-Type', 'x-www-form-urlencoded');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.end(fue);
    }
    
    parse(req, function(err, params) {
      if (err) { return next(err); }
      
      var arity = issue.length;
      if (arity == 4) {
        issue(consumer, callbackURL, params, issued);
      } else { // arity == 3
        issue(consumer, callbackURL, issued);
      }
    });
  }
}
