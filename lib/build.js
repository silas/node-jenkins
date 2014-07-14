/**
 * Build client
 */

'use strict';

/**
 * Module dependencies.
 */

var utils = require('./utils');

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
  // pre-4.x
  switch (arguments.length) {
    case 4:
      opts = arguments[2];
      opts.name = arguments[0];
      opts.number = arguments[1];
      callback = arguments[3];
      break;
    case 3:
      opts = {
        name: arguments[0],
        number: arguments[1],
      };
      callback = arguments[2];
      break;
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'build', 'get'], opts);

  if (!opts.name) return callback(new Error('name required'));
  if (!opts.hasOwnProperty('number')) {
    return callback(new Error('number required'));
  }

  var req = {
    path: {
      name: opts.name,
      number: opts.number,
    },
    query: { depth: opts.depth },
  };

  this.jenkins._get('/job/{name}/{number}/api/json', req, function(err, res) {
    if (err) {
      utils.notFound(err, res, 'build', opts.name + ' ' + opts.number);
      return callback(err);
    }

    callback(null, res.body);
  });
};

/**
 * Stop build
 */

Build.prototype.stop = function(opts, callback) {
  // pre-4.x
  if (arguments.length === 3) {
    opts = {
      name: arguments[0],
      number: arguments[1],
    };
    callback = arguments[2];
  }

  this.jenkins._log(['debug', 'build', 'stop'], opts);

  if (!opts.name) return callback(new Error('name required'));
  if (!opts.hasOwnProperty('number')) {
    return callback(new Error('number required'));
  }

  var req = {
    path: {
      name: opts.name,
      number: opts.number,
    },
  };

  this.jenkins._get('/job/{name}/{number}/stop', req, function(err, res) {
    if (res && res.statusCode === 302) {
      return callback();
    }

    if (err) {
      utils.notFound(err, res, 'build', opts.name + ' ' + opts.number);

      return callback(err);
    }

    if (!err) {
      err = new Error();
      err.res = res;
    }

    err.message = 'Failed to stop build: ' + opts.name;

    callback(err);
  });
};

/**
 * Module Exports.
 */

exports.Build = Build;
