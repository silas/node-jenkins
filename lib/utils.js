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
 * Module exports
 */

exports.options = options;
