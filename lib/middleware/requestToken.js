/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');

/**
 * Handle requests to obtain an unauthorized request token.
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
 * References:
 *  - [Temporary Credentials](http://tools.ietf.org/html/rfc5849#section-2.1)
 *  - [Obtaining an Unauthorized Request Token](http://oauth.net/core/1.0a/#auth_step1)
 *  - [Obtaining an Unauthorized Request Token](http://oauth.net/core/1.0/#auth_step1)
 *
 * @param {Object} options
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
