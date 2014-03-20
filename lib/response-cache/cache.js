var createCache = require('uber-cache');
var Rule = require('./rule');

var defaultSize              = 100;
var defaultTTLInMilliSeconds = 60 * 1000;

function normalizeTTLOption(options) {
  var ttlInSeconds = options.ttlInSeconds || 0;
  options.ttlInMilliSeconds = options.ttl ||
                                options.ttlInMilliSeconds ||
                                (ttlInSeconds * 1000) ||
                                defaultTTLInMilliSeconds;
}

function normalizeCacheOptions(options) {
  options = options || {};

  options.rules = options.rules || [];
  options.size = options.size || defaultSie;
  normalizeTTLOption(options);

  options.rules = options.rules.map(function(rule) {
    normalizeTTLOption(rule);
    return new Rule(rule, options);
  });

  return options;
}

function Cache(options) {
  options = normalizeCacheOptions(options);
  var cache = this.cache = createCache({
    size: options.size
  });

  this.rules = options.rules;
  this.rules.forEach(function(rule) {
    rule.cache = cache;
  });
}
Cache.prototype = {
  'get': function(key, callback) {
    return this.cache.get(key, callback);
  },

  'set': function(key, value, ttl, callback) {
    return this.cache.set(key, value, ttl, callback);
  },

  getRule: function(request) {
    if (request.method != 'GET')
      return null;

    var foundRule = null;
    this.rules.some(function(rule) {
      if (rule.match(request))
        return foundRule = rule;
    });
    return foundRule;
  };
};
exports = module.exports = Cache;