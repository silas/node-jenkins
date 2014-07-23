/**
 * Node client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');

/**
 * Initialize a new `Node` client.
 */

function Node(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Create node
 */

Node.prototype.create = function(opts, callback) {
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

  opts.type = opts.type || 'hudson.slaves.DumbSlave$DescriptorImpl';
  opts.retentionStrategy = opts.retentionStrategy ||
    { 'stapler-class': 'hudson.slaves.RetentionStrategy$Always' };
  opts.nodeProperties = opts.nodeProperties || { 'stapler-class-bag': 'true' };
  opts.launcher = opts.launcher ||
    { 'stapler-class': 'hudson.slaves.JNLPLauncher' };
  opts.numExecutors = opts.hasOwnProperty('numExecutors') ?
    opts.numExecutors : 2;
  opts.remoteFS = opts.remoteFS || '/var/lib/jenkins';
  opts.mode = opts.mode || (opts.exclusive ? 'EXCLUSIVE' : 'NORMAL');

  this.jenkins._log(['debug', 'node', 'create'], opts);

  var req;

  try {
    if (!opts.name) throw new Error('name required');

    req = {
      name: 'node.create',
      path: '/computer/doCreateItem',
      query: {
        name: opts.name,
        type: opts.type,
        json: JSON.stringify({
          name: opts.name,
          nodeDescription: opts.nodeDescription,
          numExecutors: opts.numExecutors,
          remoteFS: opts.remoteFS,
          labelString: opts.labelString,
          mode: opts.mode,
          type: opts.type,
          retentionStrategy: opts.retentionStrategy,
          nodeProperties: opts.nodeProperties,
          launcher: opts.launcher,
        }),
      },
    };
  } catch (err) {
    req = err;
  }

  return this.jenkins._post(
    req,
    middleware.require302('failed to create: ' + opts.name),
    middleware.empty,
    callback
  );
};

/**
 * Destroy node
 */

Node.prototype.destroy = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'node', 'destroy'], opts);

  var req;

  try {
    if (!opts.name) throw new Error('name required');

    req = {
      name: 'node.destroy',
      path: '/computer/{name}/doDelete',
      params: { name: opts.name },
    };
  } catch (err) {
    req = err;
  }

  return this.jenkins._post(
    req,
    middleware.notFound(opts.name),
    middleware.require302('failed to delete: ' + opts.name),
    middleware.empty,
    callback
  );
};

Node.prototype['delete'] = Node.prototype.destroy;

/**
 * Toggle offline
 */

Node.prototype.toggleOffline = function(opts, callback) {
  opts = opts || {};

  this.jenkins._log(['debug', 'node', 'toggleOffline'], opts);

  var req;

  try {
    if (!opts.name) throw new Error('name required');

    req = {
      name: 'node.offlineOffline',
      path: '/computer/{name}/toggleOffline',
      params: { name: opts.name },
      query: { offlineMessage: opts.message || '' },
    };
  } catch (err) {
    req = err;
  }

  return this.jenkins._post(
    req,
    middleware.notFound(opts.name),
    middleware.require302('failed to toggle offline: ' + opts.name),
    middleware.empty,
    callback
  );
};

/**
 * Offline cause reason
 */

Node.prototype.offlineCauseReason = function(opts, callback) {
  opts = opts || {};

  opts.message = opts.message || '';

  this.jenkins._log(['debug', 'node', 'offlineCauseReason'], opts);

  var req;

  try {
    if (!opts.name) throw new Error('name required');

    req = {
      name: 'node.toggleOffline',
      path: '/computer/{name}/toggleOffline',
      params: { name: opts.name },
      type: 'form',
      body: {
        offlineMessage: opts.message,
        json: JSON.stringify({
          offlineMessage: opts.message,
        }),
        Submit: 'Mark this node temporarily offline',
      },
    };
  } catch (err) {
    req = err;
  }

  return this.jenkins._post(req, middleware.empty, callback);
};

/**
 * Disable node
 */

Node.prototype.disable = function(opts, callback) {
  var self = this;

  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];

  if (arg0 === 'string' && arg1 === 'string') {
    opts = {
      name: arguments[0],
      message: arguments[1],
    };
    callback = arguments[2];
  } else if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  self.jenkins._log(['debug', 'node', 'disable'], opts);

  if (!opts.name) return callback(new Error('name required'));

  self.get(opts.name, function(err, node) {
    if (err) return callback(err);

    if (node && node.temporarilyOffline) {
      if (node.offlineCauseReason !== opts.message) {
        return self.node._offlineCauseReason({
          name: opts.name,
          message: opts.message,
        }, callback);
      }

      return callback();
    }

    self.toggleOffline({ name: opts.name, message: opts.message }, function(err) {
      if (err) return callback(err);

      callback();
    });
  });
};

/**
 * Enable node
 */

Node.prototype.enable = function(opts, callback) {
  var self = this;

  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  self.jenkins._log(['debug', 'node', 'enable'], opts);

  if (!opts.name) return callback(new Error('name required'));

  self.get(opts.name, function(err, node) {
    if (err) return callback(err);

    if (!node.temporarilyOffline) return callback();

    self.toggleOffline({ name: opts.name, message: '' }, function(err) {
      if (err) callback(err);

      callback();
    });
  });
};

/**
 * Node exists
 */

Node.prototype.exists = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'build', 'exists'], opts);

  var req;

  try {
    if (!opts.name) throw new Error('name required');

    req = {
      name: 'node.exists',
      path: '/computer/{name}/api/json',
      params: {
        name: opts.name === 'master' ? '(master)' : opts.name,
      },
      query: { depth: 0 },
    };
  } catch (err) {
    req = err;
  }

  return this.jenkins._head(req, middleware.exists, callback);
};

/**
 * Node details
 */

Node.prototype.get = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'node', 'get'], opts);

  var req;

  try {
    if (!opts.name) throw new Error('name required');

    req = {
      name: 'node.get',
      path: '/computer/{name}/api/json',
      params: {
        name: opts.name === 'master' ? '(master)' : opts.name,
      },
      query: { depth: opts.depth },
    };
  } catch (err) {
    req = err;
  }

  return this.jenkins._get(
    req,
    middleware.notFound(opts.name),
    middleware.body,
    callback
  );
};

/**
 * List nodes
 */

Node.prototype.list = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else {
    opts = opts || {};
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'node', 'list'], opts);

  var req = {
    name: 'node.list',
    path: '/computer/api/json',
    query: { depth: opts.depth },
  };

  return this.jenkins._get(req, middleware.body, callback);
};

/**
 * Module exports.
 */

exports.Node = Node;
