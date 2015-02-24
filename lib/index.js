/**
 * Module index
 */

'use strict';

/**
 * Module dependencies.
 */

var Jenkins = require('./jenkins').Jenkins;

/**
 * Module exports.
 */

var m = function() {
  return m.Jenkins.apply(this, arguments);
};

m.Jenkins = Jenkins;

module.exports = m;
