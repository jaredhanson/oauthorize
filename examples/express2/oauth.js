var oauthorize = require('oauthorize');

var server = oauthorize.createServer();

server.serializeClient(function(client, done) {
  return done(null, client);
});

server.deserializeClient(function(obj, done) {
  return done(null, obj);
});


exports.requestToken = server.requestToken(function(client, callbackURL, done) {
    done(null, 'hh5s93j4hdidpola', 'hdhd0244k9j7ao03');
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
