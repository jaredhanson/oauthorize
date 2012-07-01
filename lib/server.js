/**
 * Module dependencies.
 */
var requestToken = require('./middleware/requestToken')
  , accessToken = require('./middleware/accessToken')
  , userAuthorization = require('./middleware/userAuthorization')
  , userDecision = require('./middleware/userDecision')
  , transactionLoader = require('./middleware/transactionLoader')
  , errorHandler = require('./middleware/errorHandler')

/**
 * `Server` constructor.
 *
 * @api public
 */
function Server() {
  this._serializers = [];
  this._deserializers = [];
};

/**
 * Handle requests to obtain an unauthorized request token.
 *
 * @api public
 */
Server.prototype.requestToken = function(options, parse, issue) {
  return requestToken(options, parse, issue);
}

/**
 * Handle requests to obtain an access token.
 *
 * @api public
 */
Server.prototype.accessToken = function(options, verify, issue) {
  return accessToken(options, verify, issue);
}

/**
 * Parses requests to obtain user authorization.
 *
 * @api public
 */
Server.prototype.userAuthorization = function(options, parse, validate) {
  return userAuthorization(this, options, parse, validate);
}

/**
 * Handle a user's response to an authorization dialog.
 *
 * @api public
 */
Server.prototype.userDecision = function(options, parse, issue) {
  if (options.loadTransaction == false) {
    return userDecision(this, options, parse, issue);
  }
  return [transactionLoader(this, options), userDecision(this, options, parse, issue)];
}

/**
 * Respond to errors encountered in OAuth endpoints.
 *
 * @api public
 */
Server.prototype.errorHandler = function(options) {
  return errorHandler(options);
}

/**
 * Registers a function used to serialize client objects into the session.
 *
 * Examples:
 *
 *     server.serializeClient(function(client, done) {
 *       done(null, client.id);
 *     });
 *
 * @api public
 */
Server.prototype.serializeClient =
Server.prototype.serializeConsumer = function(fn, done) {
  if (typeof fn === 'function') {
    return this._serializers.push(fn);
  }
  
  // private implementation that traverses the chain of serializers, attempting
  // to serialize a client
  var client = fn;
  
  var stack = this._serializers;
  (function pass(i, err, obj) {
    // serializers use 'pass' as an error to skip processing
    if ('pass' === err) { err = undefined; }
    // an error or serialized object was obtained, done
    if (err || obj) { return done(err, obj); }
    
    var layer = stack[i];
    if (!layer) {
      return done(new Error('Failed to serialize client.  Register serialization function using serializeClient().'));
    }
    
    try {
      layer(client, function(e, o) { pass(i + 1, e, o); } )
    } catch(e) {
      return done(e);
    }
  })(0);
}

/**
 * Registers a function used to deserialize client objects out of the session.
 *
 * Examples:
 *
 *     server.deserializeClient(function(id, done) {
 *       Client.findById(id, function (err, client) {
 *         done(err, client);
 *       });
 *     });
 *
 * @api public
 */
Server.prototype.deserializeClient =
Server.prototype.deserializeConsumer = function(fn, done) {
  if (typeof fn === 'function') {
    return this._deserializers.push(fn);
  }
  
  // private implementation that traverses the chain of deserializers,
  // attempting to deserialize a client
  var obj = fn;
  
  var stack = this._deserializers;
  (function pass(i, err, client) {
    // deserializers use 'pass' as an error to skip processing
    if ('pass' === err) { err = undefined; }
    // an error or deserialized client was obtained, done
    if (err || client) { return done(err, client); }
    // a valid client existed when establishing the session, but that client has
    // since been deauthorized
    if (client === null || client === false) { return done(null, false); }
    
    var layer = stack[i];
    if (!layer) {
      return done(new Error('Failed to deserialize client.  Register deserialization function using deserializeClient().'));
    }
    
    try {
      layer(obj, function(e, c) { pass(i + 1, e, c); } )
    } catch(e) {
      return done(e);
    }
  })(0);
}


/**
 * Expose `Server`.
 */
exports = module.exports = Server;
