/**
 * View client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');

/**
 * Initialize a new `View` client.
 */

function View(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Create new view
 */

View.prototype.create = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string' && arg1 === 'string') {
    opts = {
      name: arguments[0],
      type: arguments[1],
    };
    callback = arg2 === 'function' ? arguments[2] : undefined;
  } else if (arg0 === 'string') {
    opts = {
      name: arguments[0],
      type: 'list',
    };
  }

  opts = opts || {};

  this.jenkins._log(['debug', 'view', 'create'], opts);

  var req = { name: 'view.create' };

  var mode = {
    list: 'hudson.model.ListView',
    my: 'hudson.model.MyView',
  };

  try {
    if (!opts.name) throw new Error('name required');
    if (!opts.type) throw new Error('type required');
    if (!mode[opts.type]) throw new Error('type unknown: ' + opts.type);

    req.path = '/createView';
    req.type = 'form';
    req.body = {
      name: opts.name,
      mode: mode[opts.type],
      json: JSON.stringify({
        name: opts.name,
        mode: mode[opts.type],
      }),
    };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.require302('failed to create: ' + opts.name),
    middleware.empty,
    callback
  );
};

/**
 * Destroy view
 */

View.prototype.destroy = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'view', 'destroy'], opts);

  var req = { name: 'view.destroy' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/view/{name}/doDelete';
    req.params = { name: opts.name };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.notFound(opts.name),
    middleware.require302('failed to delete: ' + opts.name),
    middleware.empty,
    callback
  );
};

View.prototype['delete'] = View.prototype.destroy;

/**
 * View exists
 */

View.prototype.exists = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'view', 'exists'], opts);

  var req = { name: 'view.exists' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/view/{name}/api/json';
    req.params = { name: opts.name };
    req.query = { depth: opts.depth };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._head(req, middleware.exists, callback);
};

/**
 * View details
 */

View.prototype.get = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string') {
    if (arg1 === 'object') {
      opts = arguments[1];
      callback = arg2 === 'function' ? arguments[2] : undefined;
    } else {
      opts = {};
      callback = arg1 === 'function' ? arguments[1] : undefined;
    }
    opts.name = arguments[0];
  } else {
    opts = opts || {};
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'view', 'get'], opts);

  var req = { name: 'view.get' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/view/{name}/api/json';
    req.params = { name: opts.name };
    req.query = { depth: opts.depth };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._get(
    req,
    middleware.notFound(opts.name),
    middleware.body,
    callback
  );
};

/**
 * List views
 */

View.prototype.list = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'view', 'list'], opts);

  var req = {
    name: 'view.list',
    path: '/api/json',
  };

  return this.jenkins._get(
    req,
    function(ctx, next) {
      if (ctx.err) return next();

      if (!ctx.res.body || !Array.isArray(ctx.res.body.views)) {
        ctx.err = new Error('returned bad data');
      }

      next();
    },
    middleware.bodyItem('views'),
    callback
  );
};

/**
 * Module exports.
 */

exports.View = View;
