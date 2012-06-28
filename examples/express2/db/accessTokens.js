var tokens = {};


exports.find = function(key, done) {
  var token = tokens[key];
  return done(null, token);
};

exports.save = function(token, secret, userID, clientID, done) {
  tokens[token] = { secret: secret, userID: userID, clientID: clientID };
  return done(null);
};
