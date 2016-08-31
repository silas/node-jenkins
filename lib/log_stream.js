/**
 * Log stream.
 */

'use strict';

/**
 * Module dependencies.
 */

var events = require('events');
var util = require('util');

/**
 * Initialize a new `LogStream` instance.
 */

function LogStream(jenkins, opts) {
  var self = this;

  events.EventEmitter.call(self);

  self._jenkins = jenkins;

  opts = opts || {};

  self._delay = opts.delay || 1000;
  delete opts.delay;

  self._opts = {};
  for (var key in opts) {
    if (opts.hasOwnProperty(key)) {
      self._opts[key] = opts[key];
    }
  }
  self._opts.meta = true;

  process.nextTick(function() { self._run(); });
}

util.inherits(LogStream, events.EventEmitter);

/**
 * Object meta
 */

LogStream.meta = {};

/**
 * End watch
 */

LogStream.meta.end = { type: 'sync' };

LogStream.prototype.end = function() {
  clearTimeout(this._timeoutId);

  if (this._end) return;
  this._end = true;

  this.emit('end');
};

/**
 * Error helper
 */

LogStream.prototype._err = function(err) {
  if (this._end) return;

  this.emit('error', err);

  this.end();
};

/**
 * Run
 */

LogStream.prototype._run = function() {
  var self = this;

  if (self._end) return;

  try {
    self._jenkins.build.log(self._opts, function(err, data) {
      if (self._end) return;
      if (err) return self._err(err);

      if (typeof data.text === 'string') self.emit('data', data.text);

      if (!data.more) return self.end();
      if (data.size) self._opts.start = data.size;

      self._timeoutId = setTimeout(function() { self._run(); }, self._delay);
    });
  } catch (err) {
    self._err(err);
  }
};

/**
 * Module exports.
 */

exports.LogStream = LogStream;
