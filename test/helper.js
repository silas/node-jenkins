'use strict';

/**
 * Module dependencies.
 */

require('should');

var async = require('async');
var nock = require('nock');
var uuid = require('node-uuid');

var fixtures = require('./fixtures');

/**
 * Variables.
 */

var NOCK_REC = process.env.NOCK_REC === 'true';
var NOCK_OFF = process.env.NOCK_OFF === 'true' || NOCK_REC;

/**
 * Setup.
 */

function setup(opts, done) {
  var test = opts.test;
  var jenkins = test.jenkins;

  test.jobName = 'test-job-' + uuid.v4();
  test.nodeName = 'test-node-' + uuid.v4();

  if (!NOCK_OFF) {
    nock.disableNetConnect();
    return done();
  }

  var jobs = {};

  if (opts.job) {
    jobs.createJob = function(next) {
      jenkins.job.create(test.jobName, fixtures.jobCreate, next);
    };
  }

  if (opts.node) {
    jobs.createNode = function(next) {
      jenkins.node.create(test.nodeName, next);
    };
  }

  async.auto(jobs, function(err) {
    if (err) return done(err);

    if (NOCK_REC) nock.recorder.rec();

    done();
  });
}

/**
 * Teardown.
 */

function teardown(opts, done) {
  if (NOCK_REC) nock.restore();

  done();
}

/**
 * Cleanup.
 */

function cleanup(opts, done) {
  var test = opts.test;

  if (!NOCK_OFF) {
    nock.enableNetConnect();
    return done();
  }

  var jobs = {};

  jobs.listJobs = function(next) {
    test.jenkins.job.list(next);
  };

  jobs.listNodes = function(next) {
    test.jenkins.node.list(next);
  };

  jobs.destroyJobs = ['listJobs', function(next, results) {
    var names = results.listJobs.map(function(job) {
      return job.name;
    }).filter(function(name) {
      return name.match(/^test-job-/);
    });

    async.map(names, function(name, next) {
      test.jenkins.job.destroy(name, next);
    }, next);
  }];

  jobs.destroyNodes = ['listNodes', function(next, results) {
    var names = results.listNodes.map(function(node) {
      return node.displayName;
    }).filter(function(name) {
      return name.match(/^test-node-/);
    });

    async.map(names, function(name, next) {
      test.jenkins.node.destroy(name, next);
    }, next);
  }];

  async.auto(jobs, done);
}

/**
 * Module exports.
 */

exports.cleanup = cleanup;
exports.ndescribe = NOCK_OFF ? describe.skip : describe;
exports.nit = NOCK_OFF ? it.skip : it;
exports.setup = setup;
exports.teardown = teardown;
