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
 * Path for folder plugin
 */

function FolderPath(value) {
  if (!(this instanceof FolderPath)) {
    return new FolderPath(value);
  }
  if (Array.isArray(value)) {
    this.value = value;
  } else {
    this.value = (value || '').split('/').filter(Boolean);
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
 * Module exports
 */

exports.options = options;
exports.FolderPath = FolderPath;
