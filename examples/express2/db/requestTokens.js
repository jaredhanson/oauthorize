var tokens = {};


exports.find = function(key, done) {
  var token = tokens[key];
  return done(null, token);
};

exports.save = function(token, secret, clientID, callbackURL, done) {
  tokens[token] = { secret: secret, clientID: clientID, callbackURL: callbackURL };
  return done(null);
};

exports.approve = function(key, userID, verifier, done) {
  var token = tokens[key];
  token.userID = userID;
  token.verifier = verifier;
  token.approved = true;
  return done(null);
};
