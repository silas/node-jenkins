/**
 * Label client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');
var utils = require('./utils');

/**
 * Initialize a new `Label` client.
 */

function Label(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Object meta
 */

Label.meta = {};

/**
 * Label details
 */

Label.prototype.get = function(opts, callback) {
  if (typeof opts === 'string') {
    opts = { name: opts };
  } else {
    opts = opts || {};
  }

  this.jenkins._log(['debug', 'label', 'get'], opts);

  var req = { name: 'label.get' };

  utils.options(req, opts);

  try {
    if (!opts.name) throw new Error('name required');

    req.path = '/label/{name}/api/json';
    req.params = {
      name: opts.name,
    };
  } catch (err) {
    return callback(this.jenkins._err(err, req));
  }

  return this.jenkins._get(
    req,
    middleware.body,
    callback
  );
};

/**
 * Module exports.
 */

exports.Label = Label;
