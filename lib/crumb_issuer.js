/**
 * CrumbIssuer client
 */

'use strict';

/**
 * Module dependencies.
 */

var middleware = require('./middleware');
var utils = require('./utils');

/**
 * Initialize a new `CrumbIssuer` client.
 */

function CrumbIssuer(jenkins) {
  this.jenkins = jenkins;
}

/**
 * Object meta
 */

CrumbIssuer.meta = {};

/**
 * Get crumb
 */

CrumbIssuer.prototype.get = function(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  this.jenkins._log(['debug', 'crumbIssuer', 'get'], opts);

  var req = {
    name: 'crumbIssuer.get',
    path: '/crumbIssuer/api/json',
  };

  utils.options(req, opts);

  return this.jenkins._get(req, middleware.body, callback);
};

/**
 * Module exports.
 */

exports.CrumbIssuer = CrumbIssuer;
