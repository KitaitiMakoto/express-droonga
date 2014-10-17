/**
 * var connectionPool = new ConnectionPool({
 *                            tag:             'droonga',
 *                            defaultDataset:  'example',
 *                            hostNames:       ['127.0.0.1', ...],
 *                            port:            24224,
 *                            receiveHostName: '127.0.0.1',
 *                            receivePort:     10030
 *                          });
 */

var Connection = require('./connection').Connection;
var ConsoleLogger = require('../console-logger').ConsoleLogger;

function ConnectionPool(params) {
  this._params = params || {};

  if (!this._params.logger)
    this._params.logger = new ConsoleLogger();

  var hostNames = this._params.hostNames ||
                    this._params.hostName ||
                    Connection.DEFAULT_FLUENT_HOST_NAME;
  if (!Array.isArray(hostNames))
    hostNames = [hostNames];

  var uniqueHostNames = {};
  hostNames.forEach(function(hostName) {
    if (hostName in uniqueHostNames) {
      return false;
    }
    else {
      uniqueHostNames[hostName] = true;
      return true;
    }
  });
  this._params.hostNames = Object.keys(uniqueHostNames);

  if (this._params.hostNames.length == 0)
    throw new Error('ConnectionPool: you must give one or more host name(s)!');

  this._connections = {};
  this._instantiate();
}

ConnectionPool.prototype = {
  _instantiate: function() {
    this._params.hostNames.forEach(function(hostName) {
      if (this._connections[hostName])
        return;

      this._connections[hostName] = new Connection({
        tag:             this._params.tag,
        defaultDataset:  this._params.defaultDataset,
        hostName:        hostName,
        port:            this._params.port,
        receiveHostName: this._params.receiveHostName,
        receivePort:     this._params.receivePort
      });
    }, this);

    this._nextIndex = 0;
  },

  get: function() {
    var hostName = this._params.hostNames[this._nextIndex];

    this._nextIndex++;
    if (this._nextIndex == this._params.hostNames.length)
      this._nextIndex = 0;

    return this._connections[hostName];
  },

  closeAll: function() {
    this._params.hostNames.forEach(function(hostName) {
      var connection = this._connections[hostName];
      connection.close();
    }, this);
  },

  get count() {
    return this._params.hostNames.length;
  }
};

exports.ConnectionPool = ConnectionPool;