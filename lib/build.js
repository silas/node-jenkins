/**
 * Build client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');
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

  this.jenkins._log(['debug', 'build', 'get'], opts);

  var req = { name: 'build.get' };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');
    if (!opts.number) throw new Error('number required');

    req.path = '{folder}/{number}/api/json';
    req.params = {
      folder: folder.path(),
      number: opts.number,
    };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

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

  var req = { name: 'build.stop' };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');
    if (!opts.number) throw new Error('number required');

    req.path = '{folder}/{number}/stop';
    req.params = {
      folder: folder.path(),
      number: opts.number,
    };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.notFound(opts.name + ' ' + opts.number),
    middleware.require302('failed to stop: ' + opts.name),
    middleware.empty,
    callback
  );
};

/**
* Get build log
*/

Build.prototype.log = function(opts, callback) {
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

  this.jenkins._log(['debug', 'build', 'log'], opts);

  var req = { name: 'build.log' };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');
    if (!opts.number) throw new Error('number required');

    req.path = '{folder}/{number}/consoleText';
    req.params = {
      folder: folder.path(),
      number: opts.number,
    };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._get(
    req,
    middleware.notFound(opts.name + ' ' + opts.number),
    middleware.body,
    callback
  );
};

/**
 * Module exports.
 */

exports.Build = Build;
