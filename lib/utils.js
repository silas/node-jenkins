/**
 * Helper functions
 */

'use strict';

/**
 * Common options
 */

function options(req, opts) {
  if (!req.query) req.query = {};

  if (typeof opts.depth === 'number') {
    req.query.depth = opts.depth;
  }

  return opts;
}

/**
 * Raw path param
 */

function RawParam(value) {
  this.encode = false;
  this.value = value;
}

RawParam.prototype.toString = function() {
  return this.value;
};

/**
 * Parse folder plugin path
 */

function parsePath(value) {
  value = value || '';

  if (value[0] === '/') value = value.slice(1);

  var parts = value.split('/');

  var results = { name: parts[parts.length - 1] };

  if (parts.length > 1) {
    var sep = '/job/';

    var folderPath = parts.slice(0, parts.length - 1)
      .map(encodeURIComponent)
      .join(sep);

    results.folder = new RawParam(sep + folderPath);
    results.full = new RawParam(folderPath + sep + results.name);
  } else {
    results.folder = '';
    results.full = results.name;
  }

  return results;
}

/**
 * Module exports
 */

exports.options = options;
exports.parsePath = parsePath;
