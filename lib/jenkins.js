/**
 * Jenkins client (papi)
 */

'use strict';

/**
 * Module dependencies.
 */

var papi = require('papi');
var util = require('util');

var Build = require('./build').Build;
var Job = require('./job').Job;
var Node_ = require('./node').Node;
var Queue = require('./queue').Queue;
var middleware = require('./middleware');

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

  opts.name = 'jenkins';

  papi.Client.call(this, opts);

  this._ext('onResponse', this._onResponse);

  this.build = new Build(this);
  this.job = new Job(this);
  this.node = new Node_(this);
  this.queue = new Queue(this);
}

util.inherits(Jenkins, papi.Client);

/**
 * Handle responses.
 */

Jenkins.prototype._onResponse = function(ctx, next) {
  if (ctx.err) {
    if (ctx.res && ctx.res.headers && ctx.res.headers['x-error']) {
      ctx.err.message = ctx.res.headers['x-error'].replace(/\?/g, '"');
    }
    ctx.err.res = ctx.res;
  }

  next();
};

/**
 * Jenkins info
 */

Jenkins.prototype.info = function(callback) {
  this._log(['debug', 'info']);

  var req = {
    name: 'info',
    path: '/api/json',
  };

  return this._get(req, middleware.body, callback);
};

Jenkins.prototype.get = Jenkins.prototype.info;

/**
 * Module exports.
 */

exports.Jenkins = Jenkins;
