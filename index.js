var express = require('express');
var Connection = require('./lib/backend/connection').Connection;
var restAdapter = require('./lib/adapter/rest');
var groongaAdapter = require('./lib/adapter/groonga');
var socketIoAdapter = require('./lib/adapter/socket.io');
var dashboardUI = require('./lib/ui/dashboard');

express.application.droonga = function(params) {
  params = params || {};

  params.connection = params.connection || new Connection(params);
  var connection = params.connection;

  params.prefix = params.prefix || '';
  params.prefix = params.prefix.replace(/\/$/, '');

  restAdapter.register(this, params);
  groongaAdapter.register(this, params);

  if (params.server) {
    socketIoAdapter.register(this, params.server, params);
    params.server.on('close', function() {
      // The connection can be mocked/stubbed. We don't need to close
      // such a fake connection.
      if (typeof connection.close == 'function')
        connection.close();
    });
  }

  dashboardUI.register(this, params);

  this.connection = connection;
  this.emitMessage = connection.emitMessage.bind(connection); // shorthand
}

exports.model = require('./lib/model');
