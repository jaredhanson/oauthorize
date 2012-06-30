var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var userDecision = require('middleware/userDecision');


function MockRequest() {
}

function MockResponse() {
  this._headers = {};
  this._data = '';
}

MockResponse.prototype.setHeader = function(name, value) {
  this._headers[name] = value;
}

MockResponse.prototype.redirect = function(location) {
  this._redirect = location;
  this.end();
}

MockResponse.prototype.end = function(data, encoding) {
  this._data += data;
  if (this.done) { this.done(); }
}


vows.describe('userDecision').addBatch({
  
  'middleware that handles a user decision to allow': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow) {
            done(null, 'barx')
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isTrue(req.oauth.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_token=aaaa-bbbb-cccc&oauth_verifier=barx');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that handles a user decision to allow without a callback URL': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow) {
            done(null, 'barx')
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._next = true;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isTrue(req.oauth.res.allow);
      },
      'should set verifier on transaction' : function(err, req, res, e) {
        assert.equal(req.oauth.verifier, 'barx');
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should invoke next middleware' : function(err, req, res, e) {
        assert.isTrue(res._next);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that handles a user decision to disallow': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow) {
            done(null, 'barx')
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = { cancel: 'Deny' };
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._next = true;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isFalse(req.oauth.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_problem=user_refused');
      },
      'should not invoke next middleware' : function(err, req, res, e) {
        assert.isUndefined(res._next);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that handles a user decision to disallow without a callback URL': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow) {
            done(null, 'barx')
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = { cancel: 'Deny' };
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._next = true;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isFalse(req.oauth.res.allow);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should invoke next middleware' : function(err, req, res, e) {
        assert.isTrue(res._next);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware with redirectOnCancel option that handles a user decision to disallow': {
    topic: function() {
      var server = {};
      
      return userDecision(server, { redirectOnCancel: false },
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow) {
            done(null, 'barx')
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = { cancel: 'Deny' };
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._next = true;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isFalse(req.oauth.res.allow);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should invoke next middleware' : function(err, req, res, e) {
        assert.isTrue(res._next);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that handles a user decision to allow without issuing a verifier': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow) {
            done(null)
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isTrue(req.oauth.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_token=aaaa-bbbb-cccc');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that parses and handles a user decision to allow': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // parse function
        function(req, done) {
          done(null, { scope: req.query.scope });
        },
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow && ares.scope == 'write') {
            done(null, 'barx')
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = { scope: 'write' };
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isTrue(req.oauth.res.allow);
        assert.equal(req.oauth.res.scope, 'write');
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_token=aaaa-bbbb-cccc&oauth_verifier=barx');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that parses and handles a user decision to disallow': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // parse function
        function(req, done) {
          done(null, { allow: false });
        },
        // issue function
        function(token, user, ares, done) {
          if (token == 'aaaa-bbbb-cccc' && user.id == 'u1234' && ares.allow && ares.scope == 'write') {
            done(null, 'barx')
          } else {
            done(new Error('something is wrong'))
          }
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._next = true;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isFalse(req.oauth.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_problem=user_refused');
      },
      'should not invoke next middleware' : function(err, req, res, e) {
        assert.isUndefined(res._next);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware with userProperty option that handles a user decision to allow': {
    topic: function() {
      var server = {};
      
      return userDecision(server, { userProperty: 'otheruser' },
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.otheruser = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isTrue(req.oauth.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_token=aaaa-bbbb-cccc&oauth_verifier=barx');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware with sessionKey option that handles a user decision to allow': {
    topic: function() {
      var server = {};
      
      return userDecision(server, { sessionKey: 'oauthorize' },
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['oauthorize'] = {};
        req.session['oauthorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isTrue(req.oauth.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_token=aaaa-bbbb-cccc&oauth_verifier=barx');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['oauthorize']['abc123']);
      },
    },
  },
  
  'middleware with cancelField option that handles a user decision to disallow': {
    topic: function() {
      var server = {};
      
      return userDecision(server, { cancelField: 'deny' },
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = { deny: true };
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._next = true;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isFalse(req.oauth.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_problem=user_refused');
      },
      'should invoke next middleware' : function(err, req, res, e) {
        assert.isUndefined(res._next);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that errors while issuing a verifier': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          done(new Error('something went wrong'))
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'something went wrong');
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.user);
        assert.equal(req.oauth.user.id, 'u1234');
        assert.equal(req.oauth.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth.res);
        assert.isTrue(req.oauth.res.allow);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should not remove transaction from session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that errors while parsing the request': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // parse function
        function(req, done) {
          done(new Error('something went wrong'))
        },
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'something went wrong');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should not remove transaction from session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that handles a request without a session': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'OAuth service provider requires session support.');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  'middleware that handles a request without authorization transactions in the session': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'Invalid OAuth session key.');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  'middleware that handles a request without a body': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth = {};
        req.oauth.transactionID = 'abc123';
        req.oauth.callbackURL = 'http://example.com/auth/callback';
        req.oauth.authz = { token: 'aaaa-bbbb-cccc' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'OAuth service provider requires body parsing.');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should not remove transaction from session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware that handles a request without a transaction': {
    topic: function() {
      var server = {};
      
      return userDecision(server,
        // issue function
        function(token, user, ares, done) {
          done(null, 'barx')
        }
      );
    },

    'when handling a request': {
      topic: function(userDecision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth' };
        req.user = { id: 'u1234', username: 'bob' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          userDecision(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'OAuth transaction not found.');
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should not remove transaction from session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware constructed without a server instance': {
    'should throw an error': function () {
      assert.throws(function() { userDecision() });
    },
  },
  
  'middleware constructed without an issue function': {
    'should throw an error': function () {
      assert.throws(function() { userDecision({}) });
    },
  },

}).export(module);
