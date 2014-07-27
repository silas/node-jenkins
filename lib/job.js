/**
 * Job client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');

/**
 * Initialize a new `Job` client.
 */

function Job(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Trigger job build
 */

Job.prototype.build = function(opts, callback) {
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
  }

  opts = opts || {};

  this.jenkins._log(['debug', 'job', 'build'], opts);

  var req = { name: 'job.build' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/job/{name}/build';
    req.params = { name: opts.name };
    req.query = {};

    if (opts.parameters) {
      req.path += 'WithParameters';
      req.query = opts.parameters;
    }

    if (opts.token) req.query.token = opts.token;
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.notFound(opts.name),
    middleware.queueLocation,
    callback
  );
};

/**
 * Get or update config
 */

Job.prototype.config = function(opts, callback) {
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

  this.jenkins._log(['debug', 'job', 'config'], opts);

  var req = { name: 'job.config' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/job/{name}/config.xml';
    req.params = { name: opts.name };

    if (opts.xml) {
      req.method = 'POST';
      req.headers = { 'content-type': 'text/xml' };
      req.body = new Buffer(opts.xml);
    } else {
      req.method = 'GET';
    }
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._request(
    req,
    middleware.notFound('build ' + opts.name),
    function(ctx, next) {
      if (ctx.err || opts.xml) return middleware.empty(ctx, next);

      next(false, null, ctx.res.body.toString('utf8'));
    },
    callback
  );
};

/**
 * Copy job
 */

Job.prototype.copy = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string' && arg1 === 'string') {
    opts = {
      from: arguments[0],
      name: arguments[1],
    };
    callback = arg2 === 'function' ? arguments[2] : undefined;
  }

  opts = opts || {};

  this.jenkins._log(['debug', 'job', 'copy'], opts);

  var req = { name: 'job.copy' };

  try {
    if (!opts.name) throw new Error('name required');
    if (!opts.from) throw new Error('from required');

    req.path = '/createItem';
    req.headers = { 'content-type': 'text/xml' };
    req.query = {
      name: opts.name,
      from: opts.from,
      mode: 'copy',
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
 * Create new job from xml
 */

Job.prototype.create = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string' && arg1 === 'string') {
    opts = {
      name: arguments[0],
      xml: arguments[1],
    };
    callback = arg2 === 'function' ? arguments[2] : undefined;
  }

  opts = opts || {};

  this.jenkins._log(['debug', 'job', 'create'], opts);

  var req = { name: 'job.create' };

  try {
    if (!opts.name) throw new Error('name required');
    if (!opts.xml) throw new Error('xml required');

    req.path = '/createItem';
    req.headers = { 'content-type': 'text/xml' };
    req.query = { name: opts.name };
    req.body = new Buffer(opts.xml);
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(req, middleware.empty, callback);
};

/**
 * Destroy job
 */

Job.prototype.destroy = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'job', 'destroy'], opts);

  var req = { name: 'job.destroy' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/job/{name}/doDelete';
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

Job.prototype['delete'] = Job.prototype.destroy;

/**
 * Disable job
 */

Job.prototype.disable = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'job', 'disable'], opts);

  var req = { name: 'job.disable' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/job/{name}/disable';
    req.params = { name: opts.name };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.notFound(opts.name),
    middleware.require302('failed to disable: ' + opts.name),
    middleware.empty,
    callback
  );
};

/**
 * Enable job
 */

Job.prototype.enable = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'job', 'enable'], opts);

  var req = { name: 'job.enable' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/job/{name}/enable';
    req.params = { name: opts.name };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._post(
    req,
    middleware.notFound(opts.name),
    middleware.require302('failed to enable: ' + opts.name),
    middleware.empty,
    callback
  );
};

/**
 * Job exists
 */

Job.prototype.exists = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'job', 'exists'], opts);

  var req = { name: 'job.exists' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/job/{name}/api/json';
    req.params = { name: opts.name };
    req.query = { depth: opts.depth };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._head(req, middleware.exists, callback);
};

/**
 * Job details
 */

Job.prototype.get = function(opts, callback) {
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

  this.jenkins._log(['debug', 'job', 'exists'], opts);

  var req = { name: 'job.get' };

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/job/{name}/api/json';
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
 * List jobs
 */

Job.prototype.list = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'job', 'list'], opts);

  var req = {
    name: 'job.list',
    path: '/api/json',
  };

  return this.jenkins._get(
    req,
    function(ctx, next) {
      if (ctx.err) return next();

      if (!ctx.res.body || !Array.isArray(ctx.res.body.jobs)) {
        ctx.err = new Error('returned bad data');
      }

      next();
    },
    middleware.bodyItem('jobs'),
    callback
  );
};

/**
 * Module exports.
 */

exports.Job = Job;
