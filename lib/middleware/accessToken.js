/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');


/**
 * Handle requests to obtain an access token.
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
 * References:
 *  - [Token Credentials](http://tools.ietf.org/html/rfc5849#section-2.3)
 *  - [Obtaining an Access Token](http://oauth.net/core/1.0a/#auth_step3)
 *  - [Obtaining an Access Token](http://oauth.net/core/1.0/#auth_step3)
 *
 * @param {Object} options
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
        // TODO:  Set a better error condition
        return next(new AuthorizationError('access token not issued', 'token_rejected'));
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
