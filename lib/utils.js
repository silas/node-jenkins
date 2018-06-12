/**
 * Helper functions
 */

'use strict';

/**
 * Module dependencies.
 */

var urlParse = require('url').parse;

/**
 * Common options
 */

function options(req, opts) {
  if (!req.query) req.query = {};

  if (typeof opts.depth === 'number') {
    req.query.depth = opts.depth;
  }

  if (typeof opts.tree === 'string') {
    req.query.tree = opts.tree;
  }

  return opts;
}

/**
 * Raw path param
 */

function RawParam(value) {
  this.encode = false;
  this.value = value || '';
}

RawParam.prototype.toString = function() {
  return this.value;
};

/**
 * Parse job name from URL
 */

function parseName(value) {
  var jobParts = [];

  var pathParts = (urlParse(value).pathname || '').split('/').filter(Boolean);
  var state = 0;
  var part;

  // iterate until we find our first job, then collect the continuous job parts
  //   ['foo', 'job', 'a', 'job', 'b', 'bar', 'job', 'c'] => ['a', 'b']
  loop:
  for (var i = 0; i < pathParts.length; i++) {
    part = pathParts[i];

    switch (state) {
      case 0:
        if (part === 'job') state = 2;
        break;
      case 1:
        if (part !== 'job') break loop;
        state = 2;
        break;
      case 2:
        jobParts.push(part);
        state = 1;
        break;
    }
  }

  return jobParts.map(decodeURIComponent);
}

/**
 * Path for folder plugin
 */

function FolderPath(value) {
  if (!(this instanceof FolderPath)) {
    return new FolderPath(value);
  }
  if (Array.isArray(value)) {
    this.value = value;
  } else if (typeof value === 'string') {
    if (value.match('^https?:\/\/')) {
      this.value = parseName(value);
    } else {
      this.value = value.split('/').filter(Boolean);
    }
  } else {
    this.value = [];
  }
}

FolderPath.SEP = '/job/';

FolderPath.prototype.isEmpty = function() {
  return !this.value.length;
};

FolderPath.prototype.name = function() {
  return this.value[this.value.length - 1] || '';
};

FolderPath.prototype.path = function() {
  if (this.isEmpty()) return new RawParam();
  return new RawParam(FolderPath.SEP + this.value.map(encodeURIComponent).join(FolderPath.SEP));
};

FolderPath.prototype.parent = function() {
  return new FolderPath(this.value.slice(0, Math.max(0, this.value.length - 1)));
};

FolderPath.prototype.dir = function() {
  return this.parent().path();
};

/**
 * Default crumb issuser
 */

function crumbIssuer(jenkins, callback) {
  jenkins.crumbIssuer.get(function(err, data) {
    if (err) return callback(err);
    if (!data || !data.crumbRequestField || !data.crumb) {
      return callback(new Error('Failed to get crumb'));
    }

    callback(null, {
      headerName: data.crumbRequestField,
      headerValue: data.crumb,
    });
  });
}

/**
 * Check if object is file like
 */

function isFileLike(v) {
  return Buffer.isBuffer(v) ||
    typeof v === 'object' &&
    typeof v.pipe === 'function' &&
    v.readable !== false;
}

/**
 * Module exports
 */

exports.options = options;
exports.FolderPath = FolderPath;
exports.crumbIssuer = crumbIssuer;
exports.isFileLike = isFileLike;
