var passport = require('passport')
  , ConsumerStrategy = require('passport-http-oauth').ConsumerStrategy
  , TokenStrategy = require('passport-http-oauth').TokenStrategy;


passport.use('consumer', new ConsumerStrategy(
  function(consumerKey, done) {
    done(null, { id: consumerKey, name: 'Some OAuth Application' }, 'keep-this-secret')
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
