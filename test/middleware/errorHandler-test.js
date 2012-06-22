var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var errorHandler = require('middleware/errorHandler');
var AuthorizationError = require('errors/authorizationerror');


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


vows.describe('errorHandler').addBatch({
  
  'middleware that handles an error in direct mode': {
    topic: function() {
      return errorHandler();
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 500);
        assert.isUndefined(res._headers['WWW-Authenticate']);
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, 'oauth_problem=server_error&oauth_problem_advice=something%20went%20wrong');
      },
    },
  },
  
  'middleware that handles an authorization error in direct mode': {
    topic: function() {
      return errorHandler();
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 401);
        assert.equal(res._headers['WWW-Authenticate'], 'OAuth realm="Clients",oauth_problem="token_rejected",oauth_problem_advice="something%20went%20wrong"');
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, 'oauth_problem=token_rejected&oauth_problem_advice=something%20went%20wrong');
      },
    },
  },
  
  'middleware that handles an authorization error with parameter_absent code in direct mode': {
    topic: function() {
      return errorHandler();
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('something went wrong', 'parameter_absent');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 400);
        assert.isUndefined(res._headers['WWW-Authenticate']);
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, 'oauth_problem=parameter_absent&oauth_problem_advice=something%20went%20wrong');
      },
    },
  },
  
  'middleware that handles an authorization error with permission_denied code in direct mode': {
    topic: function() {
      return errorHandler();
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('something went wrong', 'permission_denied');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 403);
        assert.equal(res._headers['WWW-Authenticate'], 'OAuth realm="Clients",oauth_problem="permission_denied",oauth_problem_advice="something%20went%20wrong"');
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, 'oauth_problem=permission_denied&oauth_problem_advice=something%20went%20wrong');
      },
    },
  },
  
  'middleware with realm option that handles an authorization error in direct mode': {
    topic: function() {
      return errorHandler({ realm: 'http://sp.example.com/' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 401);
        assert.equal(res._headers['WWW-Authenticate'], 'OAuth realm="http://sp.example.com/",oauth_problem="token_rejected",oauth_problem_advice="something%20went%20wrong"');
        assert.equal(res._headers['Content-Type'], 'x-www-form-urlencoded');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, 'oauth_problem=token_rejected&oauth_problem_advice=something%20went%20wrong');
      },
    },
  },
  
  'middleware that handles an error in indirect mode': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth = { callbackURL: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_problem=server_error&oauth_problem_advice=something%20went%20wrong');
      },
    },
  },
  
  'middleware that handles an authorization error in indirect mode': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth = { callbackURL: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('token has expired', 'token_expired');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?oauth_problem=token_expired&oauth_problem_advice=token%20has%20expired');
      },
    },
  },
  
  'middleware that handles an error in indirect mode without an oauth transaction': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should pass error to next middleware' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },
  
  'middleware that handles an error in indirect mode without a callback URL': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should pass error to next middleware' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },
  
  'middleware that handles an error in indirect mode with a callback URL set to oob': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth = { callbackURL: 'oob' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should pass error to next middleware' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },
  
  'middleware that handles an error in unkown mode': {
    topic: function() {
      return errorHandler({ mode: 'unkown' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth = { callbackURL: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should pass error to next middleware' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },

}).export(module);
