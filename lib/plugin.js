/**
 * Plugin client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');
var utils = require('./utils');

/**
 * Initialize a new `Plugin` client.
 */

function Plugin(jenkins) {
  this.jenkins = jenkins;
}

/**
 * List plugins
 */

Plugin.prototype.list = function(opts, callback) {
  var defaultOpts = { depth: 1 };  // depth of 0 is useless for plugins
  if (typeof opts === 'function') {
    callback = opts;
    opts = defaultOpts;
  } else {
    opts = opts || defaultOpts;
  }

  this.jenkins._log(['debug', 'plugin', 'list'], opts);

  var req = {
    name: 'plugin.list',
    path: '/pluginManager/api/json',
  };

  utils.options(req, opts);

  return this.jenkins._get(req, middleware.bodyItem('plugins'), callback);
};

/**
 * Module exports.
 */

exports.Plugin = Plugin;
