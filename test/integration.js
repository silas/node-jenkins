'use strict';

/**
 * Module dependencies.
 */

var should = require('should');

var assets = require('./assets');

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
  var jenkins = require('../lib')(url);

  describe('job', function() {
    it('should not exist', function(done) {
      jenkins.job.exists(job, function(err, exists) {
        should.ifError(err);
        should.strictEqual(exists, false);
        done();
      });
    });

    it('should be created', function(done) {
      jenkins.job.create(job, assets.job.create, function(err) {
        should.ifError(err);
        done();
      });
    });

    it('should exist after being created', function(done) {
      jenkins.job.exists(job, function(err, exists) {
        should.ifError(err);
        should.strictEqual(exists, true);
        done();
      });
    });

    it('should get', function(done) {
      jenkins.job.get(job, function(err, data) {
        should.ifError(err);
        should.equal(data.name, job);
        should.equal(data.description, 'before');
        done();
      });
    });

    it('should build', function(done) {
      jenkins.job.build(job, function(err) {
        should.ifError(err);
        jenkins.job.get(job, function(err, data) {
          should.ifError(err);
          should.ok(data.builds.length > 0 || data.queueItem);
          done();
        });
      });
    });

    it('should copy', function(done) {
      var job2 = job + 'copy';
      jenkins.job.exists(job2, function(err, exists) {
        should.ifError(err);
        should.ok(!exists);
        jenkins.job.copy(job, job2, function(err) {
          should.ifError(err);
          jenkins.job.exists(job2, function(err, exists) {
            should.ifError(err);
            should.ok(exists);
            jenkins.job.delete(job2, function(err) {
              should.ifError(err);
              done();
            });
          });
        });
      });
    });

    it('should list', function(done) {
      jenkins.job.list(function(err, data) {
        should.ifError(err);
        should.ok(data.some(function(d) { return d.name === job; }));
        done();
      });
    });

    it('should update config', function(done) {
      jenkins.job.config(job, assets.job.update, function(err) {
        should.ifError(err);
        done();
      });
    });

    it('should change after update', function(done) {
      jenkins.job.get(job, function(err, data) {
        should.ifError(err);
        should.strictEqual(data.name, job);
        should.strictEqual(data.description, 'after');
        done();
      });
    });

    it('should get config', function(done) {
      jenkins.job.config(job, function(err, data) {
        should.ifError(err);
        should.ok(data.match(/<canRoam>/));
        done();
      });
    });

    it('should disable', function(done) {
      jenkins.job.disable(job, function(err) {
        should.ifError(err);
        jenkins.job.get(job, function(err, data) {
          should.ifError(err);
          should.ok(!data.buildable);
          done();
        });
      });
    });

    it('should enable', function(done) {
      jenkins.job.enable(job, function(err) {
        should.ifError(err);
        jenkins.job.get(job, function(err, data) {
          should.ifError(err);
          should.ok(data.buildable);
          done();
        });
      });
    });

    it('should delete', function(done) {
      jenkins.job.delete(job, function(err) {
        should.ifError(err);
        done();
      });
    });

    it('should not exist after delete', function(done) {
      jenkins.job.exists(job, function(err, exists) {
        should.ifError(err);
        should.strictEqual(exists, false);
        done();
      });
    });
  });

  describe('node', function() {
    it('should not exist', function(done) {
      jenkins.node.exists(node, function(err, exists) {
        should.ifError(err);
        should.strictEqual(exists, false);
        done();
      });
    });

    it('should be created', function(done) {
      jenkins.node.create(node, function(err) {
        should.ifError(err);
        done();
      });
    });

    it('should exist after being created', function(done) {
      jenkins.node.exists(node, function(err, exists) {
        should.ifError(err);
        should.strictEqual(exists, true);
        done();
      });
    });

    it('should get', function(done) {
      jenkins.node.get(node, function(err, data) {
        should.ifError(err);
        should.equal(data.displayName, node);
        done();
      });
    });

    it('should list', function(done) {
      jenkins.node.list(function(err, data) {
        should.ifError(err);
        should.ok(data.computer.some(function(d) { return d.displayName === node; }));
        done();
      });
    });

    it('should disable', function(done) {
      jenkins.node.disable(node, 'test', function(err) {
        should.ifError(err);
        jenkins.node.get(node, function(err, data) {
          should.ifError(err);
          should.ok(data.temporarilyOffline);
          done();
        });
      });
    });

    it('should enable', function(done) {
      jenkins.node.enable(node, function(err) {
        should.ifError(err);
        jenkins.node.get(node, function(err, data) {
          should.ifError(err);
          should.ok(!data.temporarilyOffline);
          done();
        });
      });
    });

    it('should delete', function(done) {
      jenkins.node.delete(node, function(err) {
        should.ifError(err);
        done();
      });
    });

    it('should not exist after delete', function(done) {
      jenkins.node.exists(node, function(err, exists) {
        should.ifError(err);
        should.strictEqual(exists, false);
        done();
      });
    });
  });
});
