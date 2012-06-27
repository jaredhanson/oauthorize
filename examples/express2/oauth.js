/**
 * Module dependencies.
 */
var oauthorize = require('oauthorize')
  , db = require('./db')
  , utils = require('./utils');


// create OAuth server
var server = oauthorize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to the user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  console.log('!! serialize client: ');
  console.dir(client)
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  console.log('!! deserialize client: ');
  console.dir(id)
  return done(null, id);
});


exports.requestToken = server.requestToken(function(client, callbackURL, done) {
    console.log('issuing request token...');
    console.dir(client)
    console.log(callbackURL);
    
    var token = utils.uid(8)
      , secret = utils.uid(32)
    
    db.requestTokens.save(token, secret, client.id, callbackURL, function(err) {
      if (err) { return done(err); }
      done(null, token, secret);
    });
  }
);

exports.accessToken = server.accessToken(function(client, requestToken, verifier, done) {
    done(null, 'nnch734d00sl2jdk', 'pfkkdhi9sl3r4s00')
  }
);


exports.userAuthorization = server.userAuthorization(function(token, done) {
    done(null, { id: '1234', name: 'Some OAuth Application' }, 'http://macbook-air.local.jaredhanson.net:3001/auth/swayside/oauth/callback');
  }
);

exports.userDecision = server.userDecision(function(token, user, res, done) {
    return done(null, 'hfdp7dh39dks9884');
  }
);
