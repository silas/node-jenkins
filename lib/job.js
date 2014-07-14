/**
 * Job client
 */

'use strict';

/**
 * Module dependencies.
 */

var utils = require('./utils');

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
  // pre-4.x
  if (arguments.length === 3) {
    opts = arguments[1];
    opts.name = arguments[0];
    callback = arguments[2];
  }

  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  this.jenkins._log(['debug', 'job', 'build'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var path = '/job/{name}/build';
  var req = {
    query: {},
    path: { name: opts.name },
  };

  if (opts.parameters) {
    path += 'WithParameters';
    req.query = opts.parameters;
  }

  if (opts.token) req.query.token = opts.token;

  this.jenkins._post(path, req, function(err, res) {
    if (err) {
      utils.notFound(err, res, 'job', opts.name);
      return callback(err);
    }

    callback();
  });
};

/**
 * Get or update config
 */

Job.prototype.config = function(opts, callback) {
  // pre-4.x
  if (arguments.length === 3) {
    opts = {
      name: arguments[0],
      xml: arguments[1],
    };
    callback = arguments[2];
  }

  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  this.jenkins._log(['debug', 'job', 'config'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
  };

  if (opts.xml) {
    req.method = 'POST';
    req.headers = { 'content-type': 'text/xml' };
    req.body = new Buffer(opts.xml);
  } else {
    req.method = 'GET';
  }

  this.jenkins._request('/job/{name}/config.xml', req, function(err, res) {
    if (err) {
      utils.notFound(err, res, 'job', opts.name);
      return callback(err);
    }

    if (opts.xml) return callback();

    callback(null, res.body.toString('utf8'));
  });
};

/**
 * Copy job
 */

Job.prototype.copy = function(opts, callback) {
  // pre-4.x
  if (arguments.length === 3) {
    opts = {
      from: arguments[0],
      name: arguments[1],
    };
    callback = arguments[2];
  }

  this.jenkins._log(['debug', 'job', 'copy'], opts);

  if (!opts.name) return callback(new Error('name required'));
  if (!opts.from) return callback(new Error('from required'));

  var req = {
    headers: { 'content-type': 'text/xml' },
    query: {
      name: opts.name,
      from: opts.from,
      mode: 'copy',
    },
  };

  this.jenkins._post('/createItem', req, function(err, res) {
    if (res && res.statusCode === 302) {
      return callback();
    }

    if (!err) {
      err = new Error();
      err.res = res;
    }

    err.message = 'Failed to create job via copy: ' + opts.name;

    callback();
  });
};

/**
 * Create new job from xml
 */

Job.prototype.create = function(opts, callback) {
  // pre-4.x
  if (arguments.length === 3) {
    opts = {
      name: arguments[0],
      xml: arguments[1],
    };
    callback = arguments[2];
  }

  this.jenkins._log(['debug', 'job', 'create'], opts);

  if (!opts.name) return callback(new Error('name required'));
  if (!opts.xml) return callback(new Error('xml required'));

  var req = {
    headers: { 'content-type': 'text/xml' },
    query: { name: opts.name },
    body: new Buffer(opts.xml),
  };

  this.jenkins._post('/createItem', req, function(err) {
    if (err) return callback(err);

    callback();
  });
};

/**
 * Destroy job
 */

Job.prototype.destroy = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  this.jenkins._log(['debug', 'job', 'destroy'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
  };

  this.jenkins._post('/job/{name}/doDelete', req, function(err, res) {
    if (res) {
      if (res.statusCode === 302) return callback();

      if (res.statusCode === 404) {
        utils.notFound(err, res, 'job', opts.name);

        return callback(err);
      }

      if (res.headers['x-error'] && err) {
        return callback(err);
      }
    }

    if (!err) {
      err = new Error();
      err.res = res;
    }

    err.message = 'Failed to delete job: ' + opts.name;

    callback(err);
  });
};

Job.prototype['delete'] = Job.prototype.destroy;

/**
 * Disable job
 */

Job.prototype.disable = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  this.jenkins._log(['debug', 'job', 'disable'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
  };

  this.jenkins._post('/job/{name}/disable', req, function(err, res) {
    if (res && res.statusCode === 302) {
      return callback();
    }

    if (!err) {
      err = new Error();
      err.res = res;
    }

    err.message = 'Failed to disable job: ' + opts.name;

    callback(err);
  });
};

/**
 * Enable job
 */

Job.prototype.enable = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  this.jenkins._log(['debug', 'job', 'enable'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
  };

  this.jenkins._post('/job/{name}/enable', req, function(err, res) {
    if (res && res.statusCode === 302) {
      return callback();
    }

    if (!err) {
      err = new Error();
      err.res = res;
    }

    err.message = 'Failed to disable job: ' + opts.name;

    callback(err);
  });
};

/**
 * Job exists
 */

Job.prototype.exists = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'job', 'exists'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
    query: { depth: opts.depth },
  };

  this.jenkins._head('/job/{name}/api/json', req, function(err, res) {
    if (res && res.statusCode === 404) {
      return callback(null, false);
    }

    if (err) return callback(err);

    callback(null, true);
  });
};

/**
 * Job details
 */

Job.prototype.get = function(opts, callback) {
  // pre-4.x
  if (arguments.length === 3) {
    opts = arguments[1];
    opts.name = arguments[0];
    callback = arguments[2];
  }

  if (typeof opts === 'string') {
    opts = { name: opts };
  }

  opts.depth = opts.depth || 0;

  this.jenkins._log(['debug', 'job', 'exists'], opts);

  if (!opts.name) return callback(new Error('name required'));

  var req = {
    path: { name: opts.name },
    query: { depth: opts.depth },
  };

  this.jenkins._get('/job/{name}/api/json', req, function(err, res) {
    if (err) {
      utils.notFound(err, res, 'job', opts.name);

      return callback(err);
    }

    callback(null, res.body);
  });
};

/**
 * List jobs
 */

Job.prototype.list = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  this.jenkins._log(['debug', 'job', 'list'], opts);

  this.jenkins._get('/api/json', function(err, res) {
    if (err) return callback(err);

    if (!res.body || !Array.isArray(res.body.jobs)) {
      err = new Error('job list returned bad data');
      err.res = res;
      return callback(err);
    }

    callback(null, res.body.jobs);
  });
};

/**
 * Module Exports.
 */

exports.Job = Job;
