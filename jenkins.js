/*jshint node: true */
(function () {
  'use strict';

  /**
   * Module dependencies.
   */

  var request = require('request'),
      util    = require('util');

  /**
   * JenkinsError contains error message and response status code.
   */

  function JenkinsError(err, res) {
    this.name = 'JenkinsError';

    if (err instanceof Error) {
      this.message = err.message;
    } else {
      this.message = err || 'unknown error';
    }

    if (typeof res === 'object') {
      this.code = res.statusCode;
    }

    Error.captureStackTrace(this, JenkinsError);
  }
  util.inherits(JenkinsError, Error);

  /**
   * Error helpers.
   */

  var error = function(message, res) {
    return new JenkinsError(message, res);
  };

  var notFound = function(type, name, res) {
    return error(type + ' "' + name + '" does not exist', res);
  };

  /**
   * Encode and join path components.
   */

  function path() {
    var args = Array.prototype.slice.call(arguments);
    return '/' + args.map(encodeURIComponent).join('/');
  }

  /**
   * Expose Jenkins client.
   */

  module.exports = function(opts) {
    // normalize and validate options
    if (typeof opts === 'string') {
      opts = { url: opts };
    }
    if (typeof opts !== 'object') {
      throw error('opts must be an object');
    }
    if (typeof opts.url !== 'string' || opts.url.length < 1){
      throw error('url required');
    }
    if (opts.url[opts.url.length - 1] === '/') {
      opts.url = opts.url.substring(0, opts.url.length - 1);
    }

    // create api object, this is what the users gets when calling the module
    var api = { Error: JenkinsError, url: opts.url };

    // allow user to pass in default request
    var defaultRequest = opts.request || request;

    // api.request is used for making http requests to jenkins
    api.request = function(path, opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }

      // setup opts

      var defaults = function(name, value) {
        if (!opts.hasOwnProperty(name)) {
          opts[name] = value;
        }
      };
      defaults('url', api.url + path);

      if (!opts.method) {
        if (opts.hasOwnProperty('body') || opts.hasOwnProperty('body')) {
          opts.method = 'POST';
        } else {
          opts.method = 'GET';
          defaults('json', true);
        }
      }

      opts.headers = opts.headers || {};
      opts.headers.referer = api.url + '/';

      // make request and handle common errors
      defaultRequest(opts, function(err, res) {
        if (err) {
          cb(error(err, res));
        }
        if ([401, 403, 500].indexOf(res.statusCode) >= 0) {
          cb(error('Request failed, possibly authentication issue (' + res.statusCode + ')', res));
          return;
        }
        cb(err, res);
      });
    };

    //
    // general
    //

    api.get = function(cb) {
      api.request('/api/json', function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, res.body);
      });
    };

    //
    // build
    //

    api.build = {};

    api.build.get = function(name, number, opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
      opts.depth = opts.depth || 0;
      var p = path('job', name, number, 'api', 'json');
      var o = { qs: { depth: opts.depth } };
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        if (res.statusCode === 404) {
          cb(error('job "' + name + '" build "' + number + '" does not exist', res));
          return;
        }
        cb(null, res.body);
      });
    };

    api.build.stop = function(name, number, cb) {
      api.request(path('job', name, number, 'stop'), function(err) {
        if (err) {
          cb(err);
        }
        cb();
      });
    };

    //
    // job
    //

    api.job = {};

    api.job.build = function(name, opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = null;
      }
      opts = opts || {};
      var p = path('job', name) + '/build';
      var o = { method: 'POST' };
      if (opts.parameters) {
        o.qs = opts.parameters;
        p += 'WithParameters';
      }
      if (opts.token) {
        if (o.qs) {
          o.qs.token = opts.token;
        } else {
          o.qs = { token: opts.token };
        }
      }
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        if (res.statusCode === 404) {
          cb(notFound('job', name, res));
          return;
        }
        cb();
      });
    };

    api.job.config = function(name, xml, cb) {
      var p = path('job', name, 'config.xml');
      if (typeof xml === 'function') {
        cb = xml;
        api.request(p, function(err, res) {
          if (err) {
            cb(err);
            return;
          }
          if (res.statusCode === 404) {
            cb(notFound('job', name, res));
            return;
          }
          cb(null, res.body);
        });
      } else {
        var o = {
          headers: { 'content-type': 'text/xml' },
          body: xml,
        };
        api.request(p, o, function(err, res) {
          if (err) {
            cb(err);
            return;
          }
          if (res.statusCode === 404)  {
            cb(notFound('job', name, res));
            return;
          }
          cb();
        });
      }
    };

    api.job.copy = function(srcName, dstName, cb) {
      api.job.get(srcName, function(err) {
        if (err) {
          cb(err);
          return;
        }
        var o = {
          headers: { 'content-type': 'text/xml' },
          qs: { name: dstName, from: srcName, mode: 'copy' },
        };
        api.request('/createItem', o, function(err) {
          if (err) {
            cb(err);
            return;
          }
          api.job.exists(dstName, function(err, exists) {
            if (err) {
              cb(err);
              return;
            }
            if (!exists) {
              cb(error('create "' + dstName + '" failed'));
              return;
            }
            cb();
          });
        });
      });
    };

    api.job.create = function(name, xml, cb) {
      api.job.exists(name, function(err, exists) {
        if (err) {
          cb(err);
          return;
        }
        if (exists) {
          cb(error('job "' + name + '" already exists'));
          return;
        }
        var o = {
          headers: { 'content-type': 'text/xml' },
          body: xml,
          qs: { name: name },
        };
        api.request('/createItem', o, function(err) {
          if (err) {
            cb(err);
            return;
          }
          api.job.exists(name, function(err, exists) {
            if (err) {
              cb(err);
              return;
            }
            if (!exists) {
              cb(error('create "' + name + '" failed'));
              return;
            }
            cb();
          });
        });
      });
    };

    api.job.delete = function(name, cb) {
      var p = path('job', name, 'doDelete');
      var o = { body: '' };
      api.request(p, o, function(err) {
        if (err) {
          cb(err);
          return;
        }
        api.job.exists(name, function(err, exists) {
          if (err) {
            cb(err);
            return;
          }
          if (exists) {
            cb(error('delete "' + name + '" failed'));
            return;
          }
          cb();
        });
      });
    };

    api.job.disable = function(name, cb) {
      var p = path('job', name, 'disable');
      var o = { body: '' };
      api.request(p, o, function(err) {
        if (err) {
          cb(err);
          return;
        }
        cb();
      });
    };

    api.job.enable = function(name, cb) {
      var p = path('job', name, 'enable');
      var o = { body: '' };
      api.request(p, o, function(err) {
        if (err) {
          cb(err);
          return;
        }
        cb();
      });
    };

    api.job.exists = function(name, cb) {
      api.job.get(name, function(err) {
        if (err) {
          if (err.code === 404) {
            cb(null, false);
            return;
          }
          cb(err);
        } else {
          cb(null, true);
        }
      });
    };

    api.job.get = function(name, opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
      opts.depth = opts.depth || 0;
      var p = path('job', name, 'api', 'json');
      var o = { qs: { depth: opts.depth } };
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        if (res.statusCode === 404) {
          cb(notFound('job', name, res));
          return;
        }
        cb(null, res.body);
      });
    };

    api.job.list = function(cb) {
      api.get(function(err, data) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, data.jobs);
      });
    };

    //
    // node
    //

    api.node = {};

    api.node.create = function(name, opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
      opts = opts || {};
      api.node.exists(name, function(err, exists) {
        if (err) {
          cb(err);
          return;
        }
        if (exists) {
          cb(error('node already exists'));
          return;
        }
        var p = path('computer', 'doCreateItem');
        var o = { body: '', qs: {} };
        o.qs.name = name;
        o.qs.type = 'hudson.slaves.DumbSlave$DescriptorImpl';
        o.qs.json = JSON.stringify({
          name: name,
          nodeDescription: opts.nodeDescription,
          numExecutors: opts.hasOwnProperty('numExecutors') ? opts.numExecutors : 2,
          remoteFS: opts.remoteFS || '/var/lib/jenkins',
          labelString: opts.labelString,
          mode: opts.exclusive ? 'EXCLUSIVE' : 'NORMAL',
          type: o.qs.type,
          retentionStrategy: opts.retentionStrategy || { 'stapler-class': 'hudson.slaves.RetentionStrategy$Always' },
          nodeProperties: opts.nodeProperties || { 'stapler-class-bag': 'true' },
          launcher: opts.launcher || { 'stapler-class': 'hudson.slaves.JNLPLauncher' }
        });
        api.request(p, o, function(err, res) {
          if (err) {
            cb(err);
            return;
          }
          if (res.statusCode !== 302) {
            cb(error('failed to create node', res));
            return;
          }
          cb();
        });
      });
    };

    api.node.delete = function(name, cb) {
      api.node.get(name, function(err, node) {
        if (err) {
          cb(err);
          return;
        }
        if (node.name === 'master') {
          cb(error('cannot delete master node'));
          return;
        }
        var p = path('computer', name, 'doDelete');
        var o = { body: '' };
        api.request(p, o, function(err, res) {
          if (err) {
            cb(err);
            return;
          }
          if (res.statusCode !== 302) {
            cb(error('failed to delete node', res));
            return;
          }
          cb();
        });
      });
    };

    api.node._toggleOffline = function(name, message, cb) {
      var p = path('computer', name, 'toggleOffline');
      var o = { body: '', qs: { offlineMessage: message } };
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, res);
      });
    };

    api.node._offlineCauseReason = function(name, message, cb) {
      var p = path('computer', name, 'changeOfflineCause');
      var o = { body: '', qs: { offlineMessage: message } };
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        if (res.statusCode !== 302) {
          cb(error('failed to set node offline message', res));
          return;
        }
        cb();
      });
    };

    api.node.disable = function(name, message, cb) {
      var setMessage = true;
      if (typeof message === 'function') {
        cb = message;
        message = '';
        setMessage = false;
      }
      api.node.get(name, function(err, node) {
        if (err) {
          cb(err);
          return;
        }
        if (node.temporarilyOffline) {
          if (setMessage && node.offlineCauseReason !== message) {
            api.node._offlineCauseReason(name, message, cb);
            return;
          }
          cb();
          return;
        }
        api.node._toggleOffline(name, message, function(err, res) {
          if (err) {
            cb(err);
            return;
          }
          if (res.statusCode !== 302) {
            cb(error('failed to disable node', res));
            return;
          }
          cb();
        });
      });
    };

    api.node.enable = function(name, cb) {
      api.node.get(name, function(err, node) {
        if (err) {
          cb(err);
          return;
        }
        if (!node.temporarilyOffline) {
          cb();
          return;
        }
        api.node._toggleOffline(name, '', function(err, res) {
          if (err) {
            cb(err);
            return;
          }
          if (res.statusCode !== 302) {
            cb(error('failed to enable node', res));
            return;
          }
          cb();
        });
      });
    };

    api.node.exists = function(name, cb) {
      api.node.get(name, function(err) {
        if (err) {
          if (err.code === 404) {
            cb(null, false);
            return;
          }
          cb(err);
        } else {
          cb(null, true);
        }
      });
    };

    api.node.get = function(name, cb) {
      name = name === 'master' ? '(master)' : name;
      var p = path('computer', name, 'api', 'json');
      var o = { qs: { depth: 0 } };
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        if (res.statusCode === 404) {
          cb(notFound('node', name, res));
        }
        cb(null, res.body);
      });
    };

    api.node.list = function(cb) {
      var p = path('computer', 'api', 'json');
      var o = { qs: { depth: 0 } };
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, res.body);
      });
    };

    //
    // queue
    //

    api.queue = {};

    api.queue.get = function(opts, cb) {
      if (typeof opts === 'function') {
        cb = opts;
        opts = {};
      }
      opts.depth = opts.depth || 0;
      var p = path('queue', 'api', 'json');
      var o = { qs: { depth: opts.depth } };
      api.request(p, o, function(err, res) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, res.body);
      });
    };

    api.queue.cancel = function(number, cb) {
      var p = path('queue', 'items', number, 'cancelQueue');
      var o = { body: '' };
      api.request(p, o, function(err) {
        if (err) {
          cb(err);
          return;
        }
        cb();
      });
    };

    return api;
  };

})();