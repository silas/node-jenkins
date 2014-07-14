/**
 * Jenkins client (rapi)
 */

'use strict';

/**
 * Module dependencies.
 */

var rapi = require('rapi');
var util = require('util');

var Build = require('./build').Build;
var Job = require('./job').Job;
var Node_ = require('./node').Node;
var Queue = require('./queue').Queue;

/**
 * Initialize a new `Jenkins` client.
 */

function Jenkins(opts) {
  if (!(this instanceof Jenkins)) {
    return new Jenkins(opts);
  }

  if (typeof opts === 'string') {
    opts = { baseUrl: opts };
  } else {
    opts = opts || {};
  }

  if (!opts.baseUrl) {
    if (opts.url) {
      opts.baseUrl = opts.url;
      delete opts.url;
    } else {
      throw new Error('baseUrl required');
    }
  }

  if (!opts.headers) {
    opts.headers = {};
  }
  if (!opts.headers.referer) {
    opts.headers.referer = opts.baseUrl + '/';
  }

  if (opts.request) {
    throw new Error('request not longer supported');
  }

  rapi.Client.call(this, opts);

  this.build = new Build(this);
  this.job = new Job(this);
  this.node = new Node_(this);
  this.queue = new Queue(this);
}

util.inherits(Jenkins, rapi.Client);

/**
 * After request.
 */

Jenkins.prototype._after = function(ctx, next) {
  var err = ctx.args[0];
  var res = ctx.args[1];

  if (err) {
    if (res && res.headers && res.headers['x-error']) {
      err.message = res.headers['x-error'].replace(/\?/g, '"');
    }
    err.res = res;
  }

  next();
};

/**
 * Jenkins info
 */

Jenkins.prototype.info = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  this._log(['debug', 'get'], opts);

  this._get('/api/json', function(err, res) {
    if (err) return callback(err);

    callback(null, res.body);
  });
};

Jenkins.prototype.get = Jenkins.prototype.info;

/**
 * Module Exports.
 */

exports.Jenkins = Jenkins;
