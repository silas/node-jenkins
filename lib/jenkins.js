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
var CrumbIssuer = require('./crumb_issuer').CrumbIssuer;
var Job = require('./job').Job;
var Node = require('./node').Node;
var Queue = require('./queue').Queue;
var View = require('./view').View;
var middleware = require('./middleware');
var utils = require('./utils');

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

  if (typeof opts.crumbIssuer === 'function') {
    this._crumbIssuer = opts.crumbIssuer;
  } else if (opts.crumbIssuer === true) {
    this._crumbIssuer = utils.crumbIssuer;
  }

  papi.Client.call(this, opts);

  this._ext('onCreate', this._onCreate);
  this._ext('onResponse', this._onResponse);

  this.build = new Jenkins.Build(this);
  this.crumbIssuer = new Jenkins.CrumbIssuer(this);
  this.job = new Jenkins.Job(this);
  this.node = new Jenkins.Node(this);
  this.queue = new Jenkins.Queue(this);
  this.view = new Jenkins.View(this);

  try {
    if (opts.promisify) {
      if (typeof opts.promisify === 'function') {
        papi.tools.promisify(this, opts.promisify);
      } else {
        papi.tools.promisify(this);
      }
    }
  } catch (err) {
    err.message = 'promisify: ' + err.message;
    throw err;
  }
}

util.inherits(Jenkins, papi.Client);

Jenkins.Build = Build;
Jenkins.CrumbIssuer = CrumbIssuer;
Jenkins.Job = Job;
Jenkins.Node = Node;
Jenkins.Queue = Queue;
Jenkins.View = View;

/**
 * Object meta
 */

Jenkins.meta = {};

/**
 * Inject CSRF Protection crumb into POST requests
 */

Jenkins.prototype._onCreate = function(ctx, next) {
  if (!this._crumbIssuer || ctx.opts.method !== 'POST') return next();

  this._crumbIssuer(this, function(err, data) {
    if (err) return next(err);

    if (data.headerName && data.headerValue) {
      if (!ctx.opts.headers) ctx.opts.headers = {};
      ctx.opts.headers[data.headerName] = data.headerValue;
    }

    next();
  });
};

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

Jenkins.prototype.info = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  this._log(['debug', 'info'], opts);

  var req = {
    name: 'info',
    path: '/api/json',
  };

  utils.options(req, opts);

  return this._get(req, middleware.body, callback);
};

Jenkins.prototype.get = Jenkins.prototype.info;

/**
 * Walk methods
 */

Jenkins.meta.walk = { type: 'sync' };

Jenkins.walk = Jenkins.prototype.walk = function() {
  return papi.tools.walk(Jenkins);
};

/**
 * Module exports.
 */

exports.Jenkins = Jenkins;
