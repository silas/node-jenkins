/**
 * Queue client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');
var utils = require('./utils');

/**
 * Initialize a new `Queue` client.
 */

function Queue(jenkins) {
  this.jenkins = jenkins;
}

/**
 * List queues
 */

Queue.prototype.list = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'queue', 'list'], opts);

  var req = {
    name: 'queue.list',
    path: '/queue/api/json',
  };

  utils.options(req, opts);

  return this.jenkins._get(req, middleware.bodyItem('items'), callback);
};

/**
 * Get an individual queue item
 */

Queue.prototype.item = function(opts, callback) {
  var arg0 = typeof arguments[0];

  if (arg0 === 'function') {
    callback = opts;
    opts = {};
  } else {
    if (arg0 === 'string' || arg0 === 'number') {
      opts = {
        number: opts
      };
    }
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'queue', 'item'], opts);

  var req = {
    name: 'queue.item',
    path: '/queue/item/{number}/api/json',
    params: {
      number: opts.number
    }
  };

  utils.options(req, opts);

  if (!opts.number) {
    return callback(this.jenkins._err(new Error('number required'), req));
  }

  return this.jenkins._get(req, middleware.body, callback);
};

/**
 * Deprecated
 */

Queue.prototype.get = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else {
    opts = opts || {};
  }

  this.list(opts, function(err, data) {
    if (err) return callback(err);

    callback(err, { items: data });
  });
};

/**
 * Cancel queue item
 */

Queue.prototype.cancel = function(opts, callback) {
  if (typeof opts !== 'object') {
    opts = { number: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'queue', 'cancel'], opts);

  var req = { name: 'queue.cancel' };

  utils.options(req, opts);

  try {
    if (!opts.number) throw new Error('number required');

    req.path = '/queue/item/{number}/cancelQueue';
    req.params = { number: opts.number };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.require302('failed to cancel: ' + opts.number),
    middleware.empty,
    callback
  );
};

/**
 * Module exports.
 */

exports.Queue = Queue;
