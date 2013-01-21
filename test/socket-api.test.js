var assert = require('chai').assert;
var nodemock = require('nodemock');
var Deferred = require('jsdeferred').Deferred;

var utils = require('./test-utils');

var express = require('express');
var socketAdaptor = require('../lib/socket-adaptor');
var Connection = require('../lib/backend-adaptor').Connection;

var client = require('socket.io-client');

suite('Socket.IO API', function() {
  var server;

  teardown(function() {
    if (server) {
      server.close();
    }
    server = undefined;
  });

  test('front to back', function(done) {
    var connection = nodemock
          .mock('on')
            .takes('message', function() {})
            .times(socketAdaptor.commands.length)
          .mock('emitMessage')
            .takes('search', { requestMessage: true });

    var application = express();
    server = utils.setupServer(application);
    socketAdaptor.registerHandlers(application, server, {
      connection: connection
    });

    var clientSocket = client.connect('http://localhost:' + utils.testServerPort);

    Deferred
      .wait(0.1)
      .next(function() {
        clientSocket.emit('search', { requestMessage: true });
      })
      .wait(0.1)
      .next(function() {
        connection.assertThrows();
        done();
      })
      .error(function(error) {
        done(error);
      });
  });
});

