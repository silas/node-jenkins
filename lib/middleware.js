/**
 * Format Papi responses
 */

'use strict';

/**
 * Body
 */

function body(ctx, next) {
  if (ctx.err) return next(ctx.err);

  next(false, null, ctx.res.body);
}

/**
 * Body item
 */

function bodyItem(key) {
  return function(ctx, next) {
    if (ctx.err) return next(ctx.err);

    next(false, null, ctx.res.body[key]);
  };
}

/**
 * Empty
 */

function empty(ctx, next) {
  if (ctx.err) return next(ctx.err);

  next(false);
}

/**
 * Exists
 */

function exists(ctx, next) {
  if (ctx.res && ctx.res.statusCode === 404) {
    return next(false, null, false);
  }

  if (ctx.err) return next(ctx.err);

  next(false, null, true);
}

/**
 * Require 302 or error
 */

function require302(message) {
  return function(ctx, next) {
    if (ctx.res && ctx.res.statusCode === 302) {
      return next(false);
    } else if (ctx.res) {
      if (ctx.err) {
        if (!ctx.res.headers['x-error']) ctx.err.message = message;
      } else {
        ctx.err = new Error(message);
      }

      return next(ctx.err);
    }

    next();
  };
}

/**
 * Not found
 */

function notFound(value) {
  return function(ctx, next) {
    if (ctx.res && ctx.res.statusCode === 404) {
      var err = new Error(value + ' not found');
      err.notFound = true;

      return next(err);
    }

    next();
  };
}

/**
 * Queue location
 */

function queueLocation(ctx, next) {
  if (ctx.err) return next(ctx.err);

  try {
    // Get queue number from location header
    var parts = ctx.res.headers.location.split('/');

    return next(false, null, parseInt(parts[parts.length - 2], 10));
  } catch (err) {
    // ignore errors
  }

  next();
}

/**
 * Module exports
 */

exports.body = body;
exports.bodyItem = bodyItem;
exports.empty = empty;
exports.exists = exists;
exports.notFound = notFound;
exports.queueLocation = queueLocation;
exports.require302 = require302;
