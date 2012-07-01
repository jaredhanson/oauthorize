/**
 * Module dependencies.
 */
var url = require('url')
  , utils = require('../utils')


/**
 * Handles errors encountered in OAuth endpoints.
 *
 * This is error handling middleware intended for use in endpoints involved in
 * the OAuth protocol.  If an error occurs while processing a request, this
 * middleware formats a response in accordance with the Problem Reporting
 * extension to OAuth.
 *
 * This middleware has two modes of operation: direct and indirect.  Direct mode
 * (the default) is intended to be used with request token and access token
 * endpoints, in which the response can be sent directly to the client.
 * Indirect mode is intended to be used with user authorization endpoints, in
 * which the response must be issued to the client indirectly via a redirect
 * through the user's browser.
 *
 * Options:
 *   - `mode`   mode of operation, defaults to `direct`
 *   - `realm`  authentication realm, defaults to "Clients"
 *
 * Examples:
 *
 *    app.post('/access_token',
 *       passport.authenticate('consumer', { session: false }),
 *       oauth.accessToken( ... )
 *       oauth.errorHandler());
 *
 *    app.get('/dialog/authorize',
 *       login.ensureLoggedIn(),
 *       oauth.userAuthorization( ... )
 *       oauth.errorHandler({ mode: 'indirect' }));
 *
 * References:
 *  - [Problem Reporting](http://wiki.oauth.net/w/page/12238543/ProblemReporting)
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
module.exports = function errorHandler(options) {
  options = options || {};
  
  var mode = options.mode || 'direct';
  var realm = options.realm || 'Clients';
  
  return function errorHandler(err, req, res, next) {
    
    if (mode == 'direct') {
      if (err.status) { res.statusCode = err.status; }
      if (!res.statusCode || res.statusCode < 400) { res.statusCode = 500; }
      
      // TODO: Implement support for `oauth_error_in_response_body` parameter.
      //       This will require re-parsing the `Authorization` header for OAuth
      //       params, which is best implemented as reusable oauthParser
      //       middleware.
      
      var params = {};
      params['oauth_problem'] = err.code || 'server_error';
      if (err.message) { params['oauth_problem_advice'] = err.message; }
      
      if (res.statusCode == 401 || res.statusCode == 403) {
        var comps = { realm: realm };
        utils.merge(comps, params);
        
        var challenge = Object.keys(comps).map(function(key) {
          if (key === 'realm') { return 'realm="' + realm + '"'; }
          return utils.encode(key) + '="' + utils.encode(comps[key]) + '"';
        }).join(',');
        
        res.setHeader('WWW-Authenticate', 'OAuth ' + challenge);
      }
      
      // TODO: Implement support for other response formats, as described by
      //       (OAuth Extension for Response Data Format - Draft 1)[http://oauth.googlecode.com/svn/spec/ext/response_data_format/1.0/drafts/1/oauth_response_data_format_ext.html]
      
      var fue = Object.keys(params).map(function(key) {
        return utils.encode(key) + '=' + utils.encode(params[key]);
      }).join('&');
      
      res.setHeader('Content-Type', 'x-www-form-urlencoded');
      return res.end(fue);
      
    } else if (mode == 'indirect') {
      // If a callbackURL is not being used by this transaction, or it has been
      // explicitly set to `oob`, `next()` immediately into the application's
      // error handler.  This allows information to be rendered for display to
      // the user as necessary.
      if (!req.oauth || !req.oauth.callbackURL || req.oauth.callbackURL == 'oob') { return next(err); }

      var callbackURL = req.oauth.callbackURL;
      var parsed = url.parse(callbackURL, true);
      delete parsed.search;
      parsed.query['oauth_problem'] = err.code || 'server_error';
      if (err.message) { parsed.query['oauth_problem_advice'] = err.message; }
      
      var location = url.format(parsed);
      return res.redirect(location);
      
    } else {
      return next(err);
    }
  }
}
