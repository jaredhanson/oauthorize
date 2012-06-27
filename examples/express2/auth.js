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
  function(requestToken, done) {
    done(null, 'hdhd0244k9j7ao03');
  },
  function(timestamp, nonce, done) {
    done(null, true)
  }
));

passport.use('token', new TokenStrategy(
  function(consumerKey, done) {
    done(null, { who: 'dat' }, 'keep-this-secret')
  },
  function(token, done) {
    // verify callback
    done(null, { username: 'jaredhanson' }, { tokenSecret: 'pfkkdhi9sl3r4s00' })
  },
  function(timestamp, nonce, done) {
    done(null, true)
  }
));
