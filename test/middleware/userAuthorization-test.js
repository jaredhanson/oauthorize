var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var userAuthorization = require('middleware/userAuthorization');


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


vows.describe('userAuthorization').addBatch({
  
  'middleware that handles an authorization request': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // validate function
        function(token, done) {
          if (token == 'aaaa-bbbb-cccc') {
            var client = { id: '1234', name: 'Example' };
            done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth);
        assert.isString(req.oauth.transactionID);
        assert.lengthOf(req.oauth.transactionID, 8);
        assert.equal(req.oauth.client.id, '1234');
        assert.equal(req.oauth.client.name, 'Example');
        assert.strictEqual(req.oauth.client, req.oauth.consumer);
        assert.equal(req.oauth.callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.oauth.req.scope, 'write');
        assert.equal(req.oauth.authz.token, 'aaaa-bbbb-cccc');
        assert.isUndefined(req.oauth.authz.callbackURL);
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.scope, 'write');
        assert.equal(req.session['authorize'][tid].authz.token, 'aaaa-bbbb-cccc');
      },
    },
  },
  
  'middleware that parses and handles an authorization request': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // parse function
        function(req, done) {
          return done(null, { foo: req.query.foo });
        },
        // validate function
        function(token, done) {
          if (token == 'aaaa-bbbb-cccc') {
            var client = { id: '1234', name: 'Example' };
            done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc', foo: 'bar' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth);
        assert.isString(req.oauth.transactionID);
        assert.lengthOf(req.oauth.transactionID, 8);
        assert.equal(req.oauth.client.id, '1234');
        assert.equal(req.oauth.client.name, 'Example');
        assert.strictEqual(req.oauth.client, req.oauth.consumer);
        assert.equal(req.oauth.callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.oauth.req.scope, 'write');
        assert.equal(req.oauth.authz.token, 'aaaa-bbbb-cccc');
        assert.isUndefined(req.oauth.authz.callbackURL);
        assert.equal(req.oauth.authz.foo, 'bar');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.scope, 'write');
        assert.equal(req.session['authorize'][tid].authz.token, 'aaaa-bbbb-cccc');
      },
    },
  },
  
  'middleware that parses and validates an authorization request with params': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // parse function
        function(req, done) {
          return done(null, { foo: req.query.foo });
        },
        // validate function
        function(token, params, done) {
          if (token == 'aaaa-bbbb-cccc' && params.callbackURL == 'http://example.com/auth/callback' && params.foo == 'bar') {
            var client = { id: '1234', name: 'Example' };
            done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc', 'oauth_callback': 'http://example.com/auth/callback', foo: 'bar' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth);
        assert.isString(req.oauth.transactionID);
        assert.lengthOf(req.oauth.transactionID, 8);
        assert.equal(req.oauth.client.id, '1234');
        assert.equal(req.oauth.client.name, 'Example');
        assert.strictEqual(req.oauth.client, req.oauth.consumer);
        assert.equal(req.oauth.callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.oauth.req.scope, 'write');
        assert.equal(req.oauth.authz.token, 'aaaa-bbbb-cccc');
        assert.equal(req.oauth.authz.callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.oauth.authz.foo, 'bar');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.scope, 'write');
        assert.equal(req.session['authorize'][tid].authz.token, 'aaaa-bbbb-cccc');
      },
    },
  },
  
  'middleware that does not validate an authorization request': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // validate function
        function(token, done) {
          done(null, false);
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.message, 'request token not valid');
        assert.equal(e.code, 'token_rejected');
      },
    },
  },
  
  'middleware that does not validate an authorization request but sets a callback url': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // validate function
        function(token, done) {
          done(null, false, 'http://example.com/auth/callback');
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.message, 'request token not valid');
        assert.equal(e.code, 'token_rejected');
      },
      'should set callbackURL on oauth transaction' : function(err, req, res, e) {
        assert.equal(req.oauth.callbackURL, 'http://example.com/auth/callback');
      },
    },
  },
  
  'middleware that errors when validating an authorization request': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // validate function
        function(token, done) {
          done(new Error('something went wrong'))
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },
  
  'middleware that errors while parsing an authorization request': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // parse function
        function(req, done) {
          return done(new Error('something went wrong during parsing'));
        },
        // validate function
        function(token, done) {
          var client = { id: '1234', name: 'Example' };
          done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc', foo: 'bar' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong during parsing');
      },
    },
  },
  
  'middleware that errors when serializing a client': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        done(new Error('serialization failed'))
      }
      
      return userAuthorization(server,
        // validate function
        function(token, done) {
          var client = { id: '1234', name: 'Example' };
          done(null, client, 'http://example.com/auth/callback')
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'serialization failed');
      },
    },
  },
  
  'middleware with idLength option that handles an authorization request': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server, { idLength: 12 },
        // validate function
        function(token, done) {
          var client = { id: '1234', name: 'Example' };
          done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth);
        assert.isString(req.oauth.transactionID);
        assert.lengthOf(req.oauth.transactionID, 12);
        assert.equal(req.oauth.client.id, '1234');
        assert.equal(req.oauth.client.name, 'Example');
        assert.strictEqual(req.oauth.client, req.oauth.consumer);
        assert.equal(req.oauth.callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.oauth.req.scope, 'write');
        assert.equal(req.oauth.authz.token, 'aaaa-bbbb-cccc');
        assert.isUndefined(req.oauth.authz.callbackURL);
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.scope, 'write');
        assert.equal(req.session['authorize'][tid].authz.token, 'aaaa-bbbb-cccc');
      },
    },
  },
  
  'middleware with sessionKey option that handles an authorization request': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server, { sessionKey: 'oauthz' },
        // validate function
        function(token, done) {
          var client = { id: '1234', name: 'Example' };
          done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth);
        assert.isString(req.oauth.transactionID);
        assert.lengthOf(req.oauth.transactionID, 8);
        assert.equal(req.oauth.client.id, '1234');
        assert.equal(req.oauth.client.name, 'Example');
        assert.strictEqual(req.oauth.client, req.oauth.consumer);
        assert.equal(req.oauth.callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.oauth.req.scope, 'write');
        assert.equal(req.oauth.authz.token, 'aaaa-bbbb-cccc');
        assert.isUndefined(req.oauth.authz.callbackURL);
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth.transactionID;
        assert.isObject(req.session['oauthz'][tid]);
        assert.equal(req.session['oauthz'][tid].protocol, 'oauth');
        assert.equal(req.session['oauthz'][tid].client, '1234');
        assert.equal(req.session['oauthz'][tid].callbackURL, 'http://example.com/auth/callback');
        assert.equal(req.session['oauthz'][tid].req.scope, 'write');
        assert.equal(req.session['oauthz'][tid].authz.token, 'aaaa-bbbb-cccc');
      },
    },
  },
  
  'middleware that handles a request without a oauth_token parameter': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // validate function
        function(token, done) {
          done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'BadRequestError');
      },
    },
  },
  
  'middleware that handles a request without a session': {
    topic: function() {
      var server = {};
      server.serializeClient = function(client, done) {
        return done(null, client.id);
      }
      
      return userAuthorization(server,
        // validate function
        function(token, done) {
          var client = { id: '1234', name: 'Example' };
          done(null, client, 'http://example.com/auth/callback', { scope: 'write' })
        }
      );
    },

    'when handling a request': {
      topic: function(userAuthorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'oauth_token': 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          userAuthorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
    },
  },
  
  'middleware constructed without a server instance': {
    'should throw an error': function () {
      assert.throws(function() { userAuthorization() });
    },
  },
  
  'middleware constructed without a validate function': {
    'should throw an error': function () {
      assert.throws(function() { userAuthorization({}) });
    },
  },

}).export(module);
