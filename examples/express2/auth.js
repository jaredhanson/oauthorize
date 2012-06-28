/**
 * Module dependencies.
 */
var passport = require('passport')
  , ConsumerStrategy = require('passport-http-oauth').ConsumerStrategy
  , TokenStrategy = require('passport-http-oauth').TokenStrategy
  , db = require('./db')


passport.use('consumer', new ConsumerStrategy(
  // consumer callback
  //
  // This callback finds the registered client associated with `consumerKey`.
  // The client should be supplied to the `done` callback as the second
  // argument, and the consumer secret known by the server should be supplied
  // as the third argument.  The `ConsumerStrategy` will use this secret to
  // validate the request signature, failing authentication if it does not
  // match.
  function(consumerKey, done) {
    db.clients.findByConsumerKey(consumerKey, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      return done(null, client, client.consumerSecret);
    });
  },
  // token callback
  //
  // This callback find the request token identified by `requestToken`.  This
  // is typcially only used when a client is exchanging a request token for
  // an access token.  The `done` callback accepts the corresponding token
  // secret as the second argument.  The `ConsumerStrategy` will use this secret to
  // validate the request signature, failing authentication if it does not
  // match.
  //
  // Furthermore, additional arbitrary `info` can be passed as the third
  // argument to the callback.  A request token will often have associated
  // details such as the user who approved it, scope of access, etc.  These
  // details can be retrieved from the database once, and carried through to
  // other middleware that will handle then (for example, `oauthorize.accessToken`).
  function(requestToken, done) {
    console.log('look up req tok: ' + requestToken)
    db.requestTokens.find(requestToken, function(err, token) {
      if (err) { return done(err); }
      console.log('found!')
      console.dir(token)
      
      var info = { verifier: token.verifier,
        clientID: token.clientID,
        userID: token.userID,
        approved: token.approved
      }
      done(null, token.secret, info);
    });
  },
  function(timestamp, nonce, done) {
    done(null, true)
  }
));

passport.use('token', new TokenStrategy(
  function(consumerKey, done) {
    console.log('token auth client: ' + consumerKey)
    //done(null, { who: 'dat' }, 'keep-this-secret')
    db.clients.findByConsumerKey(consumerKey, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      return done(null, client, client.consumerSecret);
    });
  },
  function(accessToken, done) {
    // verify callback
    console.log('token auth verify: ' + accessToken)
    //done(null, { username: 'jaredhanson' }, { tokenSecret: 'pfkkdhi9sl3r4s00' })
    db.accessTokens.find(accessToken, function(err, token) {
      if (err) { return done(err); }
      console.log('found!')
      console.dir(token)
      
      db.users.find(token.userID, function(err, user) {
        if (err) { return done(err); }
        console.log('found user!')
        console.dir(user)
        //return done(null, client, token.callbackURL);
        
        // TODO: Switch to passing secret as separate argument.
        var info = { tokenSecret: token.secret }
        done(null, user, info);
      });
    });
  },
  function(timestamp, nonce, done) {
    done(null, true)
  }
));
