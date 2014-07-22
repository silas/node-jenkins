/**
 * Build client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');

/**
 * Initialize a new `Build` client.
 */

function Build(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Build details
 */

Build.prototype.get = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];
  var arg3 = typeof arguments[3];

  if (arg0 === 'string' && (arg1 === 'string' || arg1 === 'number')) {
    if (arg2 === 'object') {
      opts = arguments[2];
      callback = arg3 === 'function' ? arguments[3] : undefined;
    } else {
      opts = {};
      callback = arg2 === 'function' ? arguments[2] : undefined;
    }

    opts.name = arguments[0];
    opts.number = arguments[1];
  } else {
    opts = opts || {};
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'build', 'get'], opts);

  var req = {
    name: 'build.get',
    path: '/job/{name}/{number}/api/json',
    options: function() {
      if (!opts.name) throw new Error('name required');
      if (!opts.hasOwnProperty('number')) throw new Error('number required');

      this.params.name = opts.name;
      this.params.number = opts.number;
      this.query.depth = opts.depth;
    },
  };

  return this.jenkins._get(
    req,
    middleware.notFound(opts.name + ' ' + opts.number),
    middleware.body,
    callback
  );
};

/**
 * Stop build
 */

Build.prototype.stop = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];

  if (arg0 === 'string' && (arg1 === 'string' || arg1 === 'number')) {
    opts = {
      name: arguments[0],
      number: arguments[1],
    };
    callback = arguments[2];
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'build', 'stop'], opts);

  var req = {
    name: 'build.stop',
    path: '/job/{name}/{number}/stop',
    options: function() {
      if (!opts.name) throw new Error('name required');
      if (!opts.hasOwnProperty('number')) throw new Error('number required');

      this.params.name = opts.name;
      this.params.number = opts.number;
    },
  };

  return this.jenkins._get(
    req,
    middleware.notFound(opts.name + ' ' + opts.number),
    middleware.require302('failed to stop: ' + opts.name),
    middleware.empty,
    callback
  );
};

/**
 * Module exports.
 */

exports.Build = Build;
