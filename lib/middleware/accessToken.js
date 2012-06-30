/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');


/**
 * Handle requests to obtain an access token.
 *
 * This middleware implements the access token endpoint of the OAuth protocol.
 * An access token represents a user's authorization to a client applicaiton,
 * which uses the token to make authenticated requests on behalf of the user.
 *
 *
 * Callbacks:
 *
 * This middleware requires an `verify` callback, for which the function
 * signature is as follows:
 *
 *     function(requestToken, verifier, info, done) { ... }
 *
 * `requestToken` is the request token being exchanged for an access token.
 * `verifier` is the verification code which must match that issued by the
 * service provider.  `info` is any additional properties associated with the
 * token loaded during authentication.  `done` is a callback which must be
 * invoked with the following signature:
 *
 *     done(err, ok);
 *
 * `ok` should be set to `true` if the verification code matches, and `false`
 * otherwise.  If an error occurs, `done` should be invoked with `err` set in
 * idomatic Node.js fashion.
 *
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, requestToken, info, done) { ... }
 *
 * `client` is the authenticated OAuth client (aka consumer) that is making the
 * request.  `requestToken` is the request token being exchanged for an access
 * token.  `info` is any additional properties associated with the token loaded
 * during authentication.  `done` is a callback which must be invoked with the
 * following signature:
 *
 *     done(err, token, tokenSecret, params);
 *
 * `token` is the access token to be issued to the client, and `tokenSecret` is
 * the corresponding secret.  `params` is an optional argument which will be 
 * included in the response.  If an error occurs, `done` should be invoked with
 * `err` set in idomatic Node.js fashion.
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
 * `verifier` will be undefined for the request.  This makes it impossible to
 * know if the user who authorized the request token is the same user returning
 * to the application  Further details about the session fixation vulnerability
 * can be found here:
 *
 *   http://hueniverse.com/2009/04/explaining-the-oauth-session-fixation-attack/
 *
 * Assumptions:
 *
 * `req.authInfo` must be set on the request and contain `oauth.token` and
 * `oauth.verifier` properties.  Due to the nature of OAuth, these parameters
 * are transmitted along with authentication credentials and are parsed during
 * that step, *prior* to this middleware being invoked.
 *
 * By design, this integrates with the `ConsumerStrategy` provided by
 * [passport-http-oauth](https://github.com/jaredhanson/passport-http-oauth).
 * That module is recommended for authentication; however, any middleware
 * satisfying these assumptions is usable.
 *
 * Examples:
 *
 *     app.post('/access_token',
 *       passport.authenticate('consumer', { session: false }),
 *       oauth.requestToken(
 *         function(requestToken, verifier, info, done) {
 *           if (verifier != info.verifier) { return done(null, false); }
 *           return done(null, true);
 *         },
 *         function(client, requestToken, info, done) {
 *           if (!info.authorized) { return done(null, false); }
 *           if (client.id !== info.clientId) { return done(null, false); }
 *
 *           var token = utils.uid(16)
 *             , secret = utils.uid(64)
 *           var t = new AccessToken(token, secret, info.userId, info.clientId);
 *           t.save(function(err) {
 *             if (err) { return done(err); }
 *             return done(null, token, secret);
 *           });
 *         }
 *       ));
 *
 * References:
 *  - [Token Credentials](http://tools.ietf.org/html/rfc5849#section-2.3)
 *  - [Obtaining an Access Token](http://oauth.net/core/1.0a/#auth_step3)
 *  - [Obtaining an Access Token](http://oauth.net/core/1.0/#auth_step3)
 *
 * @param {Object} options
 * @param {Function} verify
 * @param {Function} issue
 * @return {Function}
 * @api public
 */
module.exports = function accessToken(options, verify, issue) {
  if (typeof options == 'function') {
    issue = verify;
    verify = options
    options = {};
  }
  options = options || {};
  
  if (!verify) throw new Error('OAuth accessToken middleware requires a verify function.');
  if (!issue) throw new Error('OAuth accessToken middleware requires an issue function.');
  
  var userProp = options.userProperty || 'user';
  
  return function accessToken(req, res, next) {
    if (!req.authInfo) { return next(new Error('authentication info not available')); }
    
    var consumer = req[userProp]
      , requestToken = req.authInfo.oauth.token
      , verifier = req.authInfo.oauth.verifier;
      
    function issued(err, token, tokenSecret, params) {
      if (err) { return next(err); }
      if (!token) {
        return next(new AuthorizationError('access token not issued', 'token_rejected'));
      }
      
      params = params || {};
      params['oauth_token'] = token;
      params['oauth_token_secret'] = tokenSecret;
      
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
    
    function verified(err, ok) {
      if (err) { return next(err); }
      if (!ok) {
        return next(new AuthorizationError('not verified', 'verifier_invalid'));
      }
      
      var arity = issue.length;
      if (arity == 3) {
        issue(consumer, requestToken, issued);
      } else { // arity == 4
        issue(consumer, requestToken, req.authInfo, issued);
      }
    }
    
    var arity = verify.length;
    if (arity == 3) {
      verify(requestToken, verifier, verified);
    } else { // arity == 4
      verify(requestToken, verifier, req.authInfo, verified);
    }
  }
}
