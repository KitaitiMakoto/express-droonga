var assert = require('chai').assert;
var nodemock = require('nodemock');
var client = require('supertest');

var utils = require('../../../test-utils');
var groongaUtils = require('./utils');

var express = require('express');
var httpAdapter = require('../../../../lib/adapter/http');
var groongaAPI = require('../../../../lib/adapter/api/groonga');

suite('adapter/api/groonga: basic commands', function() {
  var connectionPool;
  var application;
  var server;
  var backend;

  setup(function(done) {
    utils.setupApplication()
      .then(function(result) {
        backend = result.backend;
        server = result.server;
        connectionPool = result.connectionPool;
        application = result.application;
        httpAdapter.register(application, {
          prefix: '',
          connectionPool: connectionPool,
          plugins: [groongaAPI]
        });
        done();
      })
      .catch(done);
  });

  teardown(function() {
    utils.teardownApplication({
      backend:    backend,
      server:     server,
      connectionPool: connectionPool
    });
  });

  suite('URL suffix', function() {
    test('nothing', function(done) {
      groongaUtils.pushSuccessResponse(backend);
      client(application)
        .get('/d/table_create?name=Users')
        .expect(200)
        .end(function(error, response) {
          if (error)
            return done(error);
          done();
        });
    });

    test('.json', function(done) {
      groongaUtils.pushSuccessResponse(backend);
      client(application)
        .get('/d/table_create.json?name=Users')
        .expect(200)
        .end(function(error, response) {
          if (error)
            return done(error);
          done();
        });
    });
  });
});
