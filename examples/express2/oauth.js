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
  //return done(null, id);
  
  db.clients.find(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});


// Request token endpoint
//
// `requestToken` middleware accepts an `issue` callback which is responsible
// for issuing a request token and corresponding secret.  This token serves as
// a temporary credential, and is used when requesting authorization from the
// user.  The request token is bound to the client to which it is issued.
//
// This example is kept intentionally simple, and may not represent best
// security practices.  Implementers are encouraged to understand the
// intricacies of the OAuth protocol and the security considerations regarding
// request tokens.  In particular, the token should have a limited lifetime.
// Furthermore, it may be dificult or impossible to guarantee the
// confidentiality of client credentials, in which case it is advisable
// to validate the `callbackURL` against a registered value.

exports.requestToken = server.requestToken(function(client, callbackURL, done) {
    console.log('issuing request token...');
    console.dir(client)
    console.log(callbackURL);
    
    var token = utils.uid(8)
      , secret = utils.uid(32)
    
    db.requestTokens.save(token, secret, client.id, callbackURL, function(err) {
      if (err) { return done(err); }
      return done(null, token, secret);
    });
  }
);

exports.accessToken = server.accessToken(function(client, requestToken, verifier, done) {
    done(null, 'nnch734d00sl2jdk', 'pfkkdhi9sl3r4s00')
  }
);


// User authorization endpoint
//
// `userAuthorization` middleware accepts an `validate` callback which is
// responsible for retrieving details about a previously issued request token.
// Once retreived, the `done` callback must be invoked with the client to which
// the request token was issued, as well as the callback URL to which the user
// will be redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and obtain their
// approval (displaying details about the client requesting authorization).

exports.userAuthorization = server.userAuthorization(function(requestToken, done) {
    console.log('authorizing request token...');
    console.log(requestToken)
  
    db.requestTokens.find(requestToken, function(err, token) {
      if (err) { return done(err); }
      db.clients.find(token.clientID, function(err, client) {
        if (err) { return done(err); }
        return done(null, client, token.callbackURL);
      });
    });
  }
);


// User decision endpoint
//
// `userDecision` middleware processes a user's decision to allow or deny access
// requested by a client application.  It accepts an `issue` callback which is
// responsible for issuing a verifier, which is used to verify the subsequent
// request by the client to exchange the request token for an access token.
//
// The `issue` callback accepts as arguments a `requestToken`, `user`, and
// `res`.  `user` is the authenticated user that approved the request.  `res` is
// the response to the OAuth transaction, which may include details such as
// scope of access, duration of access, and any other parameters parsed by the
// application.  These details are encoded into the token, to be used when
// issuing the permanent access token.

exports.userDecision = server.userDecision(function(requestToken, user, res, done) {
    var verifier = utils.uid(8);
    
    // TODO: Authenticate these requests
    //db.requestTokens.approve(requestToken, user.id, verifier, function(err) {
    db.requestTokens.approve(requestToken, 'x', verifier, function(err) {
      if (err) { return done(err); }
      return done(null, verifier);
    });
  }
);
