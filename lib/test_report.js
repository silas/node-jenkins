/**
 * Test Report client
 */

'use strict';

/**
 * Module dependencies.
 */

var LogStream = require('./log_stream').LogStream;
var middleware = require('./middleware');
var utils = require('./utils');

/**
 * Initialize a new `TestReport` client.
 */

function TestReport(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Object meta
 */

TestReport.meta = {};

/**
 * TestReport details
 */

TestReport.prototype.get = function(opts, callback) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];
  var arg3 = typeof arguments[3];

  if (arg0 === 'string' && (arg1 === 'string' || arg1 === 'number')) {
    if (arg2 === 'object') {
      opts = arguments[2];
      callback = arg3 === 'function' ? arguments[3] : undefined;
    } else {
      opts = {};
      callback = arg2 === 'function' ? arguments[2] : undefined;
    }

    opts.name = arguments[0];
    opts.number = arguments[1];
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'testReport', 'get'], opts);

  var req = { name: 'build.get' };

  utils.options(req, opts);

  try {
    var folder = utils.FolderPath(opts.name);

    if (folder.isEmpty()) throw new Error('name required');
    if (!opts.number) throw new Error('number required');

    req.path = '{folder}/{number}/testReport/api/json';
    req.params = {
      folder: folder.path(),
      number: opts.number,
    };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._get(
    req,
    middleware.notFound(opts.name + ' ' + opts.number),
    middleware.body,
    callback
  );
};

/**
* Get log stream
*/

TestReport.meta.logStream = { type: 'eventemitter' };

TestReport.prototype.logStream = function(opts) {
  var arg0 = typeof arguments[0];
  var arg1 = typeof arguments[1];
  var arg2 = typeof arguments[2];

  if (arg0 === 'string' && (arg1 === 'string' || arg1 === 'number')) {
    if (arg2 === 'object') {
      opts = arguments[2];
    } else {
      opts = {};
    }

    opts.name = arguments[0];
    opts.number = arguments[1];
  } else {
    opts = opts || {};
  }

  return new LogStream(this.jenkins, opts);
};

/**
 * Module exports.
 */

exports.TestReport = TestReport;
