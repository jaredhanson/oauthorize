var vows = require('vows');
var assert = require('assert');
var util = require('util');
var Server = require('server');


vows.describe('Server').addBatch({
  
  'Server': {
    topic: function() {
      return new Server();
    },
    
    'should wrap requestToken middleware': function (server) {
      assert.isFunction(server.requestToken);
      assert.lengthOf(server.requestToken, 3);
    },
    'should wrap accessToken middleware': function (server) {
      assert.isFunction(server.accessToken);
      assert.lengthOf(server.accessToken, 3);
    },
    'should wrap userAuthorization middleware': function (server) {
      assert.isFunction(server.userAuthorization);
      assert.lengthOf(server.userAuthorization, 3);
    },
    'should wrap userDecision middleware': function (server) {
      assert.isFunction(server.userDecision);
      assert.lengthOf(server.userDecision, 3);
    },
    'should wrap errorHandler middleware': function (server) {
      assert.isFunction(server.errorHandler);
      assert.lengthOf(server.errorHandler, 1);
    },
  },
  
  'userDecision middleware': {
    topic: function() {
      var server = new Server();
      return server.userDecision;
    },
    
    'should have implicit transactionLoader': function (userDecision) {
      var mw = userDecision(function() {}, function() {});
      assert.isArray(mw);
      assert.lengthOf(mw, 2);
    },
    'should not have implicit transactionLoader if option disabled': function (userDecision) {
      var mw = userDecision({ loadTransaction: false }, function() {}, function() {});
      assert.isFunction(mw);
    },
  },
  
}).export(module);
