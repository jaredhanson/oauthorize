var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var requestToken = require('middleware/requestToken');


function MockRequest() {
}

function MockResponse() {
  this._headers = {};
  this._data = '';
}

MockResponse.prototype.setHeader = function(name, value) {
  this._headers[name] = value;
}

MockResponse.prototype.end = function(data, encoding) {
  this._data += data;
  if (this.done) { this.done(); }
}


vows.describe('requestToken').addBatch({
  
  'middleware that issues a request token': {
    topic: function() {
      return requestToken(function(consumer, callbackURL, done) {
        if (consumer.id == 'client-1234' && callbackURL === 'http://www.example.com/auth/callback') {
          done(null, 'a1b2c3', 'shh-its-secret');
        } else {
          done(new Error('something is wrong'))
        }
      });
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.callbackURL = 'http://www.example.com/auth/callback'
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not call next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, 'oauth_token=a1b2c3&oauth_token_secret=shh-its-secret&oauth_callback_confirmed=true');
      },
    },
  },
  
  'middleware that issues a request token and params': {
    topic: function() {
      return requestToken(function(consumer, callbackURL, done) {
        if (consumer.id == 'client-1234' && callbackURL === 'http://www.example.com/auth/callback') {
          done(null, 'a1b2c3', 'shh-its-secret', { foo: 'bar' });
        } else {
          done(new Error('something is wrong'))
        }
      });
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.callbackURL = 'http://www.example.com/auth/callback'
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not call next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, 'foo=bar&oauth_token=a1b2c3&oauth_token_secret=shh-its-secret&oauth_callback_confirmed=true');
      },
    },
  },
  
  'middleware with request parsing function that issues a request token with params echoing the query': {
    topic: function() {
      return requestToken(
        // parse function
        function(req, done) {
          done(null, req.query)
        },
        // issue function
        function(consumer, callbackURL, params, done) {
          if (consumer.id == 'client-1234' && callbackURL === 'http://www.example.com/auth/callback') {
            done(null, 'a1b2c3', 'shh-its-secret', params);
          } else {
            done(new Error('something is wrong'))
          }
        }
      ); // requestToken();
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.callbackURL = 'http://www.example.com/auth/callback';
        req.query = {};
        req.query['scribble'] = 'scrobble';
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not call next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, 'scribble=scrobble&oauth_token=a1b2c3&oauth_token_secret=shh-its-secret&oauth_callback_confirmed=true');
      },
    },
  },
  
  'middleware with userProperty option that issues a request token': {
    topic: function() {
      return requestToken({ userProperty: 'client' }, function(consumer, callbackURL, done) {
        if (consumer.id == 'client-1234' && callbackURL === 'http://www.example.com/auth/callback') {
          done(null, 'a1b2c3', 'shh-its-secret');
        } else {
          done(new Error('something is wrong'))
        }
      });
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.client = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.callbackURL = 'http://www.example.com/auth/callback'
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not call next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, 'oauth_token=a1b2c3&oauth_token_secret=shh-its-secret&oauth_callback_confirmed=true');
      },
    },
  },
  
  'middleware that does not issue a request token': {
    topic: function() {
      return requestToken(function(consumer, callbackURL, done) {
        return done(null, false);
      });
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.callbackURL = 'http://www.example.com/auth/callback'
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.name, 'AuthorizationError');
        assert.equal(e.code, 'consumer_key_rejected');
      },
    },
  },
  
  'middleware that errors while issuing a request token': {
    topic: function() {
      return requestToken(function(consumer, callbackURL, done) {
        return done(new Error('something went wrong'));
      });
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.callbackURL = 'http://www.example.com/auth/callback'
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not call done' : function(err, req, res) {
        assert.isNull(err);
      },
      'should call next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
    },
  },
  
  'middleware that errors while parsing a request': {
    topic: function() {
      return requestToken(
        // parse function
        function(req, done) {
          done(new Error('something went wrong'))
        },
        // issue function
        function(consumer, callbackURL, params, done) {
          done(null, 'a1b2c3', 'shh-its-secret', params);
        }
      ); // requestToken();
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.callbackURL = 'http://www.example.com/auth/callback';
        req.query = {};
        req.query['scribble'] = 'scrobble';
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not call done' : function(err, req, res) {
        assert.isNull(err);
      },
      'should call next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
    },
  },
  
  'middleware that handles a request without authInfo': {
    topic: function() {
      return requestToken(function(consumer, callbackURL, done) {
        done(null, 'a1b2c3', 'shh-its-secret');
      });
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          requestToken(req, res, next)
        });
      },

      'should not call done' : function(err, req, res) {
        assert.isNull(err);
      },
      'should call next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
    },
  },
  
  'middleware constructed without an issue callback': {
    'should throw an error': function () {
      assert.throws(function() { requestToken() });
    },
  },
  
}).export(module);
