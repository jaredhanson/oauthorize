var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var accessToken = require('middleware/accessToken');


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


vows.describe('accessToken').addBatch({
  
  'middleware that issues an access token': {
    topic: function() {
      return accessToken(
        function(requestToken, verifier, done) {
          if (requestToken === 'hdk48Djdsa' && verifier === '473f82d3') {
            done(null, true);
          } else {
            done(new Error('something is wrong'))
          }
        },
        function(consumer, requestToken, done) {
          if (consumer.id == 'client-1234' && requestToken === 'hdk48Djdsa') {
            done(null, 'j49ddk933skd9dks', 'll399dj47dskfjdk');
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.token = 'hdk48Djdsa'
        req.authInfo.oauth.verifier = '473f82d3'
        
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
        assert.equal(res._data, 'oauth_token=j49ddk933skd9dks&oauth_token_secret=ll399dj47dskfjdk');
      },
    },
  },
  
  'middleware with userProperty option that issues an access token': {
    topic: function() {
      return accessToken(
        { userProperty: 'client' },
        function(requestToken, verifier, done) {
          if (requestToken === 'hdk48Djdsa' && verifier === '473f82d3') {
            done(null, true);
          } else {
            done(new Error('something is wrong'))
          }
        },
        function(consumer, requestToken, done) {
          if (consumer.id == 'client-1234' && requestToken === 'hdk48Djdsa') {
            done(null, 'j49ddk933skd9dks', 'll399dj47dskfjdk');
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.client = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.token = 'hdk48Djdsa'
        req.authInfo.oauth.verifier = '473f82d3'
        
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
        assert.equal(res._data, 'oauth_token=j49ddk933skd9dks&oauth_token_secret=ll399dj47dskfjdk');
      },
    },
  },
  
  'middleware that issues an access token using info': {
    topic: function() {
      return accessToken(
        function(requestToken, verifier, done) {
          if (requestToken === 'hdk48Djdsa' && verifier === '473f82d3') {
            done(null, true);
          } else {
            done(new Error('something is wrong'))
          }
        },
        function(consumer, requestToken, info, done) {
          if (consumer.id == 'client-1234' && requestToken === 'hdk48Djdsa' && info.user.id == 'user-1235') {
            done(null, 'j49ddk933skd9dks', 'll399dj47dskfjdk');
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.user = { id: 'user-1235' }
        req.authInfo.oauth = {};
        req.authInfo.oauth.token = 'hdk48Djdsa'
        req.authInfo.oauth.verifier = '473f82d3'
        
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
        assert.equal(res._data, 'oauth_token=j49ddk933skd9dks&oauth_token_secret=ll399dj47dskfjdk');
      },
    },
  },
  
  'middleware that issues an access token with params': {
    topic: function() {
      return accessToken(
        function(requestToken, verifier, done) {
          if (requestToken === 'hdk48Djdsa' && verifier === '473f82d3') {
            done(null, true);
          } else {
            done(new Error('something is wrong'))
          }
        },
        function(consumer, requestToken, done) {
          if (consumer.id == 'client-1234' && requestToken === 'hdk48Djdsa') {
            done(null, 'j49ddk933skd9dks', 'll399dj47dskfjdk', { foo: 'bar' });
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.token = 'hdk48Djdsa'
        req.authInfo.oauth.verifier = '473f82d3'
        
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
        assert.equal(res._data, 'foo=bar&oauth_token=j49ddk933skd9dks&oauth_token_secret=ll399dj47dskfjdk');
      },
    },
  },
  
  'middleware that does not issue an access token': {
    topic: function() {
      return accessToken(
        function(requestToken, verifier, done) {
          return done(null, true)
        },
        function(consumer, requestToken, done) {
          return done(null, false)
        }
      );
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.token = 'hdk48Djdsa'
        req.authInfo.oauth.verifier = '473f82d3'
        
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
        assert.equal(e.code, 'token_rejected');
      },
    },
  },
  
  'middleware that errors while issuing an access token': {
    topic: function() {
      return accessToken(
        function(requestToken, verifier, done) {
          done(null, true);
        },
        function(consumer, requestToken, done) {
          done(new Error('something is wrong'))
        }
      );
    },

    'when handling a request': {
      topic: function(requestToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'client-1234' };
        req.authInfo = {};
        req.authInfo.oauth = {};
        req.authInfo.oauth.token = 'hdk48Djdsa'
        req.authInfo.oauth.verifier = '473f82d3'
        
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
      return accessToken(
        function(requestToken, verifier, done) {
          done(null, true);
        },
        function(consumer, requestToken, done) {
          done(null, 'a1b2c3', 'shh-its-secret');
        }
      );
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
  
  'middleware constructed without a verify callback': {
    'should throw an error': function () {
      assert.throws(function() { accessToken() });
    },
  },
  
  'middleware constructed without an issue callback': {
    'should throw an error': function () {
      assert.throws(function() { accessToken(function() {}) });
    },
  },
  
}).export(module);
