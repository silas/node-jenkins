/**
 * CrumbIssuer client
 */

'use strict';

/**
 * Module dependencies.
 */

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

  return this.jenkins._get(req, function(ctx, next) {
    if (ctx.err) return next(ctx.err);

    var data = ctx.res.body;

    if (data && data._class === 'hudson.security.csrf.DefaultCrumbIssuer') {
      var cookies = ctx.res.headers['set-cookie'];

      if (cookies && cookies.length) {
        data.cookies = [];

        for (var i = 0; i < cookies.length; i++) {
          data.cookies.push(cookies[i].split(';')[0]);
        }
      }
    }

    next(false, null, data);
  }, callback);
};

/**
 * Module exports.
 */

exports.CrumbIssuer = CrumbIssuer;
