'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');

/**
 * Variables.
 */

var rootPath = __dirname + '/fixtures';

var fixtures = {};

/**
 * Load data.
 */

fs.readdirSync(rootPath).forEach(function(fileName) {
  var parts = fileName.split('.');
  var name = parts[0];
  var ext = parts[parts.length - 1];

  if (fixtures[name]) {
    throw new Error('fixtures conflict: ' + fileName);
  }

  var filePath = path.join(rootPath, fileName);
  var data;

  switch (ext) {
    case 'json':
      data = require(filePath);
      break;
    default:
      data = fs.readFileSync(filePath, { encoding: 'utf8' });
      break;
  }

  fixtures[name] = data;
});

/**
 * Module exports.
 */

module.exports = fixtures;
