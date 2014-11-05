/**
 * usage:
 *   var Agent = require('lib/serf/agent');
 *   var serf = new Agent({
 *                serf:         '/path/to/serf',
 *                hostName:     'node0',
 *                otherMembers: ['node0:7946', 'node1:8946', 'node2', ...]
 *              });
 *   serf.start()
 *     .then(function() { ... })
 *     .catch(function(error) { ... });
 *   serf.shutdown();
 */

var exec  = require('child_process').exec,
    fs    = require('fs'),
    path  = require('path'),
    Q     = require('q'),
    spawn = require('child_process').spawn;

var ConsoleLogger = require('../console-logger').ConsoleLogger,
    Downloader    = require('./downloader');

var NODE_NAME_PATTERN = /^([^:]+):(\d+)\/(.+)$/;
var DEFAULT_BIND_PORT = 7946;
var BIND_PORT         = 8946;
var RPC_PORT          = 8373;

function Agent(options) {
  options = options || {};

  this._logger = options.logger || new ConsoleLogger();

  this._hostName = options.hostName;
  this._serf = options.serf || 'serf';
  if (this._serf.charAt(0) == '.')
    this._serf = path.resolve(this._serf);

  this._otherMembers = options.otherMembers || options.otherMember || [];
  if (!Array.isArray(this._otherMembers))
    this._otherMembers = [this._otherMembers];

  this._agentProcess = null;
  this.shutdown = this.shutdown.bind(this);
}
Agent.prototype = {
  get rpcAddress() {
    return this._hostName + ':' + RPC_PORT;
  },

  start: function() {
    this._logger.debug('Starting Serf agent (' + this._serf + ')');
    return Q.Promise((function(resolve, reject, notify) {
      if (this._agentProcess)
        return resolve();

      if (this._serf.charAt(0) == '/' &&
          !fs.existsSync(this._serf)) {
        this._logger.info('Serf command is not found. Install Serf automatically.');
        new Downloader().saveTo(path.dirname(this._serf))
          .then((function() {
            this.start().then(resolve).catch(reject);
          }).bind(this))
          .catch(reject);
        return;
      }

      exec(this._serf + ' version', (function(error, stdin, stdout) {
        if (error)
          return reject(new Error('Serf is not available.'));
        try {
          this.tryStart();
          resolve();
        } catch(error) {
          reject(error);
        }
      }).bind(this));
    }).bind(this));
  },

  tryStart: function() {
    var eventHandlerPath = path.join(__dirname, '..', '..', 'bin',
                                       'express-droonga-serf-event-handler');
    var agentArgs = [
      'agent',
      '-node', this._hostName + '/protocol-adapter',
      '-bind', this._hostName + ':' + BIND_PORT,
      '-rpc-addr', this._hostName + ':' + RPC_PORT,
      // '-event-handler', eventHandlerPath,
      // '-log-level', this._logLevel,
      '-tag', 'role=protocol-adapter'
    ];
    this._otherMembers.forEach(function(address) {
      if (address.indexOf(':') < 0)
        address = address + ':' + DEFAULT_BIND_PORT;
      agentArgs.push('-retry-join');
      agentArgs.push(address);
    });
    try {
      this._logger.info('Starting Serf agent: ' + this._serf + ' ' + agentArgs.join(' '));
      this._agentProcess = spawn(this._serf, agentArgs);
      this._agentProcess.on('close', (function(exitStatusCode) {
        if (exitStatusCode != 0)
          this._logger.error(new Error('Serf agent is closed with error: ' + exitStatusCode));
        this._agentProcess = null;
      }).bind(this));
    } catch(error) {
      this._agentProcess = null;
      this._logger.error(error);
    }
  },

  shutdown: function() {
    this._logger.info('Shutting down Serf agent');
    if (!this._agentProcess)
      return;
    try {
      this._agentProcess.removeAllListeners();
      this._agentProcess.kill();
      this._agentProcess = null;
    } catch(error) {
      this._logger.error(error);
    }
  }
};

module.exports = Agent;