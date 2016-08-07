'use strict';

/**
 * Module dependencies.
 */

require('should');

var async = require('async');
var fixtures = require('fixturefiles');
var nock = require('nock');
var uuid = require('node-uuid');

/**
 * Variables.
 */

var NOCK_REC = process.env.NOCK_REC === 'true';
var NOCK_OFF = process.env.NOCK_OFF === 'true' || NOCK_REC;

var URL = process.env.JENKINS_TEST_URL || 'http://localhost:8080';
var CRUMB_ISSUER = NOCK_OFF && process.env.CRUMB_ISSUER === 'true';

/**
 * Setup.
 */

function setup(opts, done) {
  var test = opts.test;
  var jenkins = test.jenkins;

  var unique = function(name) {
    if (NOCK_OFF) {
      name += '-' + uuid.v4();
    }
    return 'test-' + name;
  };

  test.jobName = unique('job');
  test.nodeName = unique('node');
  test.viewName = unique('view');

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
      var opts = {
        name: test.nodeName,
        launcher: {
          'stapler-class': 'hudson.slaves.CommandLauncher',
          command: 'java -jar /var/jenkins_home/war/WEB-INF/slave.jar',
        },
      };
      jenkins.node.create(opts, next);
    };
  }

  if (opts.view) {
    jobs.createView = function(next) {
      jenkins.view.create(test.viewName, next);
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

  jobs.listViews = function(next) {
    test.jenkins.view.list(next);
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

  jobs.destroyViews = ['listViews', function(next, results) {
    var names = results.listViews.map(function(node) {
      return node.name;
    }).filter(function(name) {
      return name.match(/^test-view-/);
    });

    async.map(names, function(name, next) {
      test.jenkins.view.destroy(name, next);
    }, next);
  }];

  async.auto(jobs, done);
}

/**
 * Module exports.
 */

exports.cleanup = cleanup;
exports.config = { url: URL, crumbIssuer: CRUMB_ISSUER };
exports.nock = { on: !NOCK_OFF, off: NOCK_OFF };
exports.ndescribe = NOCK_OFF ? describe.skip : describe;
exports.nit = NOCK_OFF ? it.skip : it;
exports.setup = setup;
exports.teardown = teardown;
