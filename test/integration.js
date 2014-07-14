'use strict';

/**
 * Module dependencies.
 */

var async = require('async');
var should = require('should');

var assets = require('./assets');
var jenkins = require('../lib');

/**
 * Variables.
 */

var url = process.env.JENKINS_TEST_URL || assets.url;
var job = assets.job.get.name;
var node = assets.node.slave.displayName;

/**
 * Tests.
 */

describe('jenkins', function() {
  before(function() {
    this.jenkins = jenkins(url);
  });

  describe('job', function() {
    it('should not exist', function(done) {
      this.jenkins.job.exists(job, function(err, exists) {
        should.not.exist(err);

        should.strictEqual(exists, false);

        done();
      });
    });

    it('should be created', function(done) {
      this.jenkins.job.create(job, assets.job.create, function(err) {
        should.not.exist(err);

        done();
      });
    });

    it('should exist after being created', function(done) {
      this.jenkins.job.exists(job, function(err, exists) {
        should.not.exist(err);

        should.strictEqual(exists, true);

        done();
      });
    });

    it('should get', function(done) {
      this.jenkins.job.get(job, function(err, data) {
        should.not.exist(err);

        should.equal(data.name, job);
        should.equal(data.description, 'before');

        done();
      });
    });

    it('should build', function(done) {
      var self = this;

      var jobs = [];

      jobs.push(function(cb) {
        self.jenkins.job.build(job, function(err) {
          should.not.exist(err);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.job.get(job, function(err, data) {
          should.not.exist(err);

          should.ok(data.builds.length > 0 || data.queueItem);

          cb();
        });
      });

      async.series(jobs, done);
    });

    it('should copy', function(done) {
      var self = this;

      var job2 = job + 'copy';

      var jobs = [];

      jobs.push(function(cb) {
        self.jenkins.job.exists(job2, function(err, exists) {
          should.not.exist(err);

          exists.should.equal(false);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.job.copy(job, job2, function(err) {
          should.not.exist(err);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.job.exists(job2, function(err, exists) {
          should.not.exist(err);

          exists.should.equal(true);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.job.delete(job2, function(err) {
          should.not.exist(err);

          cb();
        });
      });

      async.series(jobs, done);
    });

    it('should list', function(done) {
      this.jenkins.job.list(function(err, data) {
        should.not.exist(err);

        var jobs = data.map(function(job) {
          return job.name === job;
        });

        jobs.should.not.eql([]);

        done();
      });
    });

    it('should update config', function(done) {
      this.jenkins.job.config(job, assets.job.update, function(err) {
        should.not.exist(err);

        done();
      });
    });

    it('should change after update', function(done) {
      this.jenkins.job.get(job, function(err, data) {
        should.not.exist(err);

        data.name.should.eql(job);
        data.description.should.eql('after');

        done();
      });
    });

    it('should get config', function(done) {
      this.jenkins.job.config(job, function(err, data) {
        should.not.exist(err);

        data.should.match(/<canRoam>/);

        done();
      });
    });

    it('should disable', function(done) {
      var self = this;

      var jobs = [];

      jobs.push(function(cb) {
        self.jenkins.job.disable(job, function(err) {
          should.not.exist(err);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.job.disable(job, function(err) {
          should.not.exist(err);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.job.get(job, function(err, data) {
          should.not.exist(err);

          data.buildable.should.equal(false);

          cb();
        });
      });

      async.series(jobs, done);
    });

    it('should enable', function(done) {
      var self = this;

      var jobs = [];

      jobs.push(function(cb) {
        self.jenkins.job.enable(job, function(err) {
          should.not.exist(err);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.job.get(job, function(err, data) {
          should.not.exist(err);

          data.buildable.should.equal(true);

          cb();
        });
      });

      async.series(jobs, done);
    });

    it('should delete', function(done) {
      this.jenkins.job.delete(job, function(err) {
        should.not.exist(err);

        done();
      });
    });

    it('should not exist after delete', function(done) {
      this.jenkins.job.exists(job, function(err, exists) {
        should.not.exist(err);

        exists.should.equal(false);

        done();
      });
    });
  });

  describe('node', function() {
    it('should not exist', function(done) {
      this.jenkins.node.exists(node, function(err, exists) {
        should.not.exist(err);

        exists.should.equal(false);

        done();
      });
    });

    it('should be created', function(done) {
      this.jenkins.node.create(node, function(err) {
        should.not.exist(err);

        done();
      });
    });

    it('should exist after being created', function(done) {
      this.jenkins.node.exists(node, function(err, exists) {
        should.not.exist(err);

        exists.should.equal(true);

        done();
      });
    });

    it('should get', function(done) {
      this.jenkins.node.get(node, function(err, data) {
        should.not.exist(err);

        data.displayName.should.eql(node);

        done();
      });
    });

    it('should list', function(done) {
      this.jenkins.node.list(function(err, data) {
        should.not.exist(err);

        var nodes = data.computer.map(function(node) {
          return node.displayName === node;
        });

        nodes.should.not.eql([]);

        done();
      });
    });

    it('should disable', function(done) {
      var self = this;

      var jobs = [];

      jobs.push(function(cb) {
        self.jenkins.node.disable(node, 'test', function(err) {
          should.not.exist(err);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.node.get(node, function(err, data) {
          should.not.exist(err);

          data.temporarilyOffline.should.equal(true);

          cb();
        });
      });

      async.series(jobs, done);
    });

    it('should enable', function(done) {
      var self = this;

      var jobs = [];

      jobs.push(function(cb) {
        self.jenkins.node.enable(node, function(err) {
          should.not.exist(err);

          cb();
        });
      });

      jobs.push(function(cb) {
        self.jenkins.node.get(node, function(err, data) {
          should.not.exist(err);

          data.temporarilyOffline.should.equal(false);

          cb();
        });
      });

      async.series(jobs, done);
    });

    it('should delete', function(done) {
      this.jenkins.node.delete(node, function(err) {
        should.not.exist(err);

        done();
      });
    });

    it('should not exist after delete', function(done) {
      this.jenkins.node.exists(node, function(err, exists) {
        should.not.exist(err);

        exists.should.equal(false);

        done();
      });
    });
  });
});
