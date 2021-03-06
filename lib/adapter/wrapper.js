var LOG_PREFIX = '[connection-wrapper] ';

function DroongaProtocolConnectionWrapper(connection, callback, options) { // or (connection, options)
  this._connection = connection;
  if (typeof callback == 'function') {
    this._callback = callback;
    this._options = options;
  } else {
    this._callback = null;
    this._options = callback;
  }
  this._logger = this._options.logger || console;
}
DroongaProtocolConnectionWrapper.prototype = {
  get tag() {
    return this._connection.tag;
  },
  get hostName() {
    return this._connection.hostName;
  },
  get port() {
    return this._connection.port;
  },
  get routeToSelf() {
    return this._routeToSelf ||
           (this._routeToSelf = this._connection.getRouteToSelf(this._options));
  },
  emit: function(event, data, callback, options) {
    if (this._connection.closed) {
      this._logger.warn(LOG_PREFIX + 'connection is already closed.');
      return;
    }

    // support emitMessage(type, body, options)
    if (callback && typeof callback != 'function') {
      options = callback;
      callback = null;
    }

    var unifiedOptions = this._options;
    if (options && typeof options == 'object') {
      unifiedOptions = {};
      Object.keys(this._options).forEach(function (key) {
        unifiedOptions[key] = this._options[key];
      }, this);
      Object.keys(options).forEach(function (key) {
        options[key] = this._options[key];
      }, this);
    }

    if (callback) {
      var originalCallback = callback;
      callback = function(error, response) {
        originalCallback(error, response && response.body);
      };
    } else {
      callback = this._callback;
    }
    if (callback)
      this._connection.emitMessage(event, data, callback, unifiedOptions);
    else
      this._connection.emitMessage(event, data, unifiedOptions);
  },
  on: function(event, listener) {
    this._connection.on(event, listener);
  },
  once: function(event, listener) {
    this._connection.once(event, listener);
  },
  addListener: function(event, listener) {
    this._connection.addListener(event, listener);
  },
  removeListener: function(event, listener) {
    this._connection.removeListener(event, listener);
  },
  removeAllListeners: function(event) {
    this._connection.removeAllListeners(event);
  },
  destroy: function() {
    delete this._connection;
    delete this._callback;
    delete this._options;
  }
};
exports.DroongaProtocolConnectionWrapper = DroongaProtocolConnectionWrapper;


function SocketIOClientSocketWrapper(socket, options) {
  this._socket = socket;
  this._options = options || {};
}
SocketIOClientSocketWrapper.prototype = {
  emit: function(event, data) {
    if (this._options.event)
      event = this._options.event;
    this._socket.emit(event, data);
  },
  destroy: function() {
    delete this._socket;
  }
};
exports.SocketIOClientSocketWrapper = SocketIOClientSocketWrapper;
