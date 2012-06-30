var vows = require('vows');
var assert = require('assert');
var util = require('util');
var oauthorize = require('index');
var Server = require('server');


vows.describe('oauthorize').addBatch({
  
  'should export functions': function () {
    assert.isFunction(oauthorize.createServer);
    assert.isFunction(oauthorize.createServiceProvider);
    assert.strictEqual(oauthorize.createServer, oauthorize.createServiceProvider);
  },
  
  'should export module function': function () {
    assert.strictEqual(oauthorize, oauthorize.createServer);
  },
  
  'should export middleware': function () {
    assert.isFunction(oauthorize.requestToken);
    assert.isFunction(oauthorize.accessToken);
  },
  
  'should export errors': function () {
    assert.isFunction(oauthorize.AuthorizationError);
    assert.isFunction(oauthorize.BadRequestError);
  },
  
  'createServer': {
    topic: function() {
      return oauthorize.createServer();
    },
    
    'should return a Server' : function(s) {
      assert.instanceOf(s, Server);
    },
  },
  
}).export(module);
