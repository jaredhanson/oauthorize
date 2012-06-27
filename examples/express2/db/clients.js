var clients = [
    { id: '1', name: 'Samplr', consumerKey: 'abc123', consumerSecret: 'ssh-secret' }
];


exports.findByConsumerKey = function(consumerKey, done) {
  for (var i = 0, len = clients.length; i < len; i++) {
    var client = clients[i];
    if (client.consumerKey === consumerKey) {
      return done(null, client);
    }
  }
  return done(null, null);
};
