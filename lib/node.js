/**
 * Node client
 */

'use strict';

/**
 * Module dependencies.
 */

var utils = require('./utils');

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
  // pre-4.x
  if (arguments.length === 3) {
    opts = arguments[1];
    opts.name = arguments[0];
    callback = arguments[2];
  }

  if (typeof opts === 'string') {
    opts = { name: opts };
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

  if (!opts.name) return callback(new Error('name required'));

  var req = {
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
      })
    },
  };

  this.jenkins._post('/computer/doCreateItem', req, function(err, res) {
    if (res && res.statusCode === 302) {
      return callback();
    }

    if (!err) {
      err = new Error();
      err.message = 'Failed to create node: ' + opts.name;
      err.res = res;
    }

    callback(err);
  });
};

/**
 * Destroy node
 */

Node.prototype.destroy = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  this.jenkins._log(['debug', 'node', 'destroy'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
  };

  this.jenkins._post('/computer/{name}/doDelete', req, function(err, res) {
    if (res && res.statusCode === 302) {
      return callback();
    }

    if (!err) {
      err = new Error();
      err.res = res;
    }

    err.message = 'Failed to delete node: ' + opts.name;

    callback(err);
  });
};

Node.prototype['delete'] = Node.prototype.destroy;

/**
 * Toggle offline
 */

Node.prototype._toggleOffline = function(opts, callback) {
  // pre-4.x
  if (arguments.length === 3) {
    opts = {
      name: arguments[0],
      message: arguments[1],
    };
    callback = arguments[2];
  }

  this.jenkins._log(['debug', 'node', 'toggleOffline'], opts);

  if (!opts.name) return callback(new Error('name required'));
  if (!opts.hasOwnProperty('message')) {
    return callback(new Error('message required'));
  }

  var req = {
    path: { name: opts.name },
    query: { offlineMessage: opts.message },
  };

  this.jenkins._post('/computer/{name}/toggleOffline', req, function(err, res) {
    if (res && res.statusCode === 302) {
      return callback();
    }

    if (!err) {
      err = new Error();
      err.res = res;
    }

    err.message = 'Failed to set node offline message: ' + opts.name;

    callback(err);
  });
};

/**
 * Mark offline
 */

Node.prototype._markOffline = function(opts, callback) {
  opts = opts || {};

  this.jenkins._log(['debug', 'node', 'markOffline'], opts);

  if (!opts.name) return callback(new Error('name required'));
  if (!opts.hasOwnProperty('message')) {
    return callback(new Error('message required'));
  }

  var req = {
    path: { name: opts.name },
    type: 'form',
    body: {
      offlineMessage: opts.message,
      json: JSON.stringify({
        offlineMessage: opts.message,
      }),
      Submit: 'Mark this node temporarily offline',
    },
  };

  this.jenkins._post('/computer/{name}/markOffline', req, function(err) {
    if (err) return callback(err);

    callback();
  });
};

/**
 * Offline cause reason
 */

Node.prototype._offlineCauseReason = function(opts, callback) {
  // pre-4.x
  if (arguments.length === 3) {
    opts = {
      name: arguments[0],
      message: arguments[1],
    };
    callback = arguments[2];
  }

  this.jenkins._log(['debug', 'node', 'offlineCauseReason'], opts);

  if (!opts.name) return callback(new Error('name required'));
  if (!opts.hasOwnProperty('message')) {
    return callback(new Error('message required'));
  }

  var req = {
    path: { name: opts.name },
    type: 'form',
    body: {
      offlineMessage: opts.message,
      json: JSON.stringify({
        offlineMessage: opts.message,
      }),
      Submit: 'Mark this node temporarily offline',
    },
  };

  this.jenkins._post('/computer/{name}/toggleOffline', req, function(err) {
    if (err) return callback(err);

    callback();
  });
};

/**
 * Disable node
 */

Node.prototype.disable = function(opts, callback) {
  var self = this;

  // pre-4.x
  if (arguments.length === 3) {
    opts = {
      name: arguments[0],
      message: arguments[1],
    };
    callback = arguments[2];
  }

  if (typeof opts === 'string') {
    opts = { name: opts };
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

    self._toggleOffline({ name: opts.name, message: opts.message }, function(err) {
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
  }

  self.jenkins._log(['debug', 'node', 'enable'], opts);

  if (!opts.name) return callback(new Error('name required'));

  self.get(opts.name, function(err, node) {
    if (err) return callback(err);

    if (!node.temporarilyOffline) return callback();

    self._toggleOffline({ name: opts.name, message: '' }, function(err) {
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
  }

  if (opts.name === 'master') opts.name = '(master)';

  this.jenkins._log(['debug', 'build', 'exists'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
    query: { depth: 0 },
  };

  this.jenkins._head('/computer/{name}/api/json', req, function(err, res) {
    if (res && res.statusCode === 404) {
      return callback(null, false);
    }

    if (err) return callback(err);

    callback(null, true);
  });
};

/**
 * Node details
 */

Node.prototype.get = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  if (opts.name === 'master') opts.name = '(master)';

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'node', 'get'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
    query: { depth: opts.depth },
  };

  this.jenkins._get('/computer/{name}/api/json', req, function(err, res) {
    if (err) {
      utils.notFound(err, res, 'node', opts.name);

      return callback(err);
    }

    callback(null, res.body);
  });
};

/**
 * List nodes
 */

Node.prototype.list = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'node', 'list'], opts);

  var req = {
    query: { depth: opts.depth },
  };

  this.jenkins._get('/computer/api/json', req, function(err, res) {
    if (err) return callback(err);

    callback(null, res.body);
  });
};

/**
 * Module exports.
 */

exports.Node = Node;
