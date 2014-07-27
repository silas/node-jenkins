/**
 * Queue client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');

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

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'build', 'list'], opts);

  var req = {
    name: 'queue.list',
    path: '/queue/api/json',
    query: { depth: opts.depth },
  };

  return this.jenkins._get(req, middleware.bodyItem('items'), callback);
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

  try {
    if (!opts.number) throw new Error('number required');

    req.path = '/queue/items/{number}/cancelQueue';
    req.params = { number: opts.number };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(req, middleware.empty, callback);
};

/**
 * Module exports.
 */

exports.Queue = Queue;
