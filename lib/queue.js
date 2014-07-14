/**
 * Queue client
 */

'use strict';

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
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'build', 'list'], opts);

  var req = {
    query: { depth: opts.depth },
  };

  this.jenkins._get('/queue/api/json', req, function(err, res) {
    if (err) return callback(err);

    callback(null, res.body.items);
  });
};

/**
 * Deprecated
 */

Queue.prototype.get = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
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
  }

  this.jenkins._log(['debug', 'queue', 'cancel'], opts);

  if (!opts.hasOwnProperty('number')) {
    return callback(new Error('number required'));
  }

  var req = {
    path: { number: opts.number },
  };

  this.jenkins._post('/queue/items/{number}/cancelQueue', req, function(err) {
    if (err) return callback(err);

    callback();
  });
};

/**
 * Module exports.
 */

exports.Queue = Queue;
