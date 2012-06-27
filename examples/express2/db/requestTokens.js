var tokens = {};


exports.save = function(token, secret, clientID, callbackURL, done) {
  tokens[token] = { secret: secret, clientID: clientID, callbackURL: callbackURL };
  return done(null);
};
