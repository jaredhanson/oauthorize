var tokens = {};


exports.find = function(key, done) {
  var token = tokens[key];
  return done(null, token);
};

exports.save = function(token, secret, clientID, callbackURL, done) {
  tokens[token] = { secret: secret, clientID: clientID, callbackURL: callbackURL };
  return done(null);
};
