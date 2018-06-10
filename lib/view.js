/**
 * View client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');
var utils = require('./utils');

/**
 * Initialize a new `View` client.
 */

function View(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Object meta
 */

View.meta = {};

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

  utils.options(req, opts);

  var shortcuts = {
    list: 'hudson.model.ListView',
    my: 'hudson.model.MyView',
  };

  try {
    var folder = utils.FolderPath(opts.name);
    var mode = shortcuts[opts.type] || opts.type;

    if (folder.isEmpty()) throw new Error('name required');
    if (!opts.type) throw new Error('type required');

    req.path = '{dir}/createView';
    req.type = 'form';
    req.params = { dir: folder.dir() };
    req.body = {
      name: folder.name(),
      mode: mode,
      json: JSON.stringify({
        name: folder.name(),
        mode: mode,
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
 * Config list view
 */

View.prototype.config = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string') {
    opts = { name: arguments[0] };
    if (arg1 === 'string') {
      opts.xml = arguments[1];
      callback = arg2 === 'function' ? arguments[2] : undefined;
    } else {
      callback = arg1 === 'function' ? arguments[1] : undefined;
    }
  }

  opts = opts || {};

  this.jenkins._log(['debug', 'view', 'config'], opts);

  var req = {
    path: '{dir}/view/{name}/config.xml',
    name: 'view.config',
  };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');

    req.params = { dir: folder.dir(), name: folder.name() };

    if (opts.xml) {
      req.method = 'POST';
      req.headers = { 'content-type': 'text/xml; charset=utf-8' };
      req.body = Buffer.from(opts.xml);
    } else {
      req.method = 'GET';
    }
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._request(
    req,
    middleware.notFound('view ' + opts.name),
    function(ctx, next) {
      if (ctx.err || opts.xml) return middleware.empty(ctx, next);

      next(false, null, ctx.res.body.toString('utf8'));
    },
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

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');

    req.path = '{dir}/view/{name}/doDelete';
    req.params = { dir: folder.dir(), name: folder.name() };
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

View.meta.delete = { type: 'alias' };

View.prototype.delete = View.prototype.destroy;

/**
 * View exists
 */

View.prototype.exists = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'view', 'exists'], opts);

  var req = { name: 'view.exists' };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');

    req.path = '{dir}/view/{name}/api/json';
    req.params = { dir: folder.dir(), name: folder.name() };
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

  this.jenkins._log(['debug', 'view', 'get'], opts);

  var req = { name: 'view.get' };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');

    req.path = '{dir}/view/{name}/api/json';
    req.params = { dir: folder.dir(), name: folder.name() };
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
  } else if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'view', 'list'], opts);

  var req = {
    name: 'view.list',
    path: '{folder}/api/json',
  };

  try {
    var folder = utils.FolderPath(opts.name);

    req.params = { folder: folder.path() };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  utils.options(req, opts);

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
 * Add job
 */

View.prototype.add = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string' && arg1 === 'string') {
    opts = {
      name: arguments[0],
      job: arguments[1],
    };
    callback = arg2 === 'function' ? arguments[2] : undefined;
  }

  opts = opts || {};

  this.jenkins._log(['debug', 'view', 'add'], opts);

  var req = {
    path: '{dir}/view/{name}/addJobToView',
    query: { name: opts.job },
    type: 'form',
    name: 'view.add',
    body: {},
  };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');
    if (!opts.job) throw new Error('job required');

    req.params = { dir: folder.dir(), name: folder.name() };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.empty,
    callback
  );
};

/**
 * Remove job
 */

View.prototype.remove = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string' && arg1 === 'string') {
    opts = {
      name: arguments[0],
      job: arguments[1],
    };
    callback = arg2 === 'function' ? arguments[2] : undefined;
  }

  opts = opts || {};

  this.jenkins._log(['debug', 'view', 'remove'], opts);

  var req = {
    path: '{dir}/view/{name}/removeJobFromView',
    query: { name: opts.job },
    type: 'form',
    name: 'view.remove',
    body: {},
  };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');
    if (!opts.job) throw new Error('job required');

    req.params = { dir: folder.dir(), name: folder.name() };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.empty,
    callback
  );
};

/**
 * Module exports.
 */

exports.View = View;
