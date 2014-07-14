/**
 * Job client
 */

'use strict';

/**
 * Initialize a new `Job` client.
 */

function notFound(err, res, type, value) {
  if (!err) return;
  if (res && res.statusCode === 404) {
    err.message = type + ' ' + value + ' not found';
    err.notFound = true;
  }
}

/**
 * Module exports.
 */

exports.notFound = notFound;
