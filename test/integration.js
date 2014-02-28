'use strict';

var assert = require('assert')
var assets = require('./assets')

var url = process.env.JENKINS_TEST_URL || assets.url
var job = assets.job.get.name
var node = assets.node.slave.displayName

var jenkins = require('../jenkins')(url)

describe('jenkins', function() {
  describe('job', function() {
    it('should not exist', function(done) {
      jenkins.job.exists(job, function(err, exists) {
        assert.ifError(err)
        assert.strictEqual(exists, false)
        done()
      })
    })

    it('should be created', function(done) {
      jenkins.job.create(job, assets.job.create, function(err) {
        assert.ifError(err)
        done()
      })
    })

    it('should exist after being created', function(done) {
      jenkins.job.exists(job, function(err, exists) {
        assert.ifError(err)
        assert.strictEqual(exists, true)
        done()
      })
    })

    it('should get', function(done) {
      jenkins.job.get(job, function(err, data) {
        assert.ifError(err)
        assert.equal(data.name, job)
        assert.equal(data.description, 'before')
        done()
      })
    })

    it('should build', function(done) {
      jenkins.job.build(job, function(err) {
        assert.ifError(err)
        jenkins.job.get(job, function(err, data) {
          assert.ifError(err)
          assert.ok(data.builds.length > 0 || data.queueItem)
          done()
        })
      })
    })

    it('should copy', function(done) {
      var job2 = job + 'copy'
      jenkins.job.exists(job2, function(err, exists) {
        assert.ifError(err)
        assert.ok(!exists)
        jenkins.job.copy(job, job2, function(err) {
          assert.ifError(err)
          jenkins.job.exists(job2, function(err, exists) {
            assert.ifError(err)
            assert.ok(exists)
            jenkins.job.delete(job2, function(err) {
              assert.ifError(err)
              done()
            })
          })
        })
      })
    })

    it('should list', function(done) {
      jenkins.job.list(function(err, data) {
        assert.ifError(err)
        assert.ok(data.some(function(d) { return d.name === job }))
        done()
      })
    })

    it('should update config', function(done) {
      jenkins.job.config(job, assets.job.config, function(err) {
        assert.ifError(err)
        done()
      })
    })

    it('should change after update', function(done) {
      jenkins.job.get(job, function(err, data) {
        assert.ifError(err)
        assert.strictEqual(data.name, job)
        assert.strictEqual(data.description, 'after')
        done()
      })
    })

    it('should get config', function(done) {
      jenkins.job.config(job, function(err, data) {
        assert.ifError(err)
        assert.ok(data.match(/<canRoam>/))
        done()
      })
    })

    it('should disable', function(done) {
      jenkins.job.disable(job, function(err) {
        assert.ifError(err)
        jenkins.job.get(job, function(err, data) {
          assert.ifError(err)
          assert.ok(!data.buildable)
          done()
        })
      })
    })

    it('should enable', function(done) {
      jenkins.job.enable(job, function(err) {
        assert.ifError(err)
        jenkins.job.get(job, function(err, data) {
          assert.ifError(err)
          assert.ok(data.buildable)
          done()
        })
      })
    })

    it('should delete', function(done) {
      jenkins.job.delete(job, function(err) {
        assert.ifError(err)
        done()
      })
    })

    it('should not exist after delete', function(done) {
      jenkins.job.exists(job, function(err, exists) {
        assert.ifError(err)
        assert.strictEqual(exists, false)
        done()
      })
    })
  })

  describe('node', function() {
    it('should not exist', function(done) {
      jenkins.node.exists(node, function(err, exists) {
        assert.ifError(err)
        assert.strictEqual(exists, false)
        done()
      })
    })

    it('should be created', function(done) {
      jenkins.node.create(node, function(err) {
        assert.ifError(err)
        done()
      })
    })

    it('should exist after being created', function(done) {
      jenkins.node.exists(node, function(err, exists) {
        assert.ifError(err)
        assert.strictEqual(exists, true)
        done()
      })
    })

    it('should get', function(done) {
      jenkins.node.get(node, function(err, data) {
        assert.ifError(err)
        assert.equal(data.displayName, node)
        done()
      })
    })

    it('should list', function(done) {
      jenkins.node.list(function(err, data) {
        assert.ifError(err)
        assert.ok(data.computer.some(function(d) { return d.displayName === node }))
        done()
      })
    })

    it('should disable', function(done) {
      jenkins.node.disable(node, 'test', function(err) {
        assert.ifError(err)
        jenkins.node.get(node, function(err, data) {
          assert.ifError(err)
          assert.ok(data.temporarilyOffline)
          done()
        })
      })
    })

    it('should enable', function(done) {
      jenkins.node.enable(node, function(err) {
        assert.ifError(err)
        jenkins.node.get(node, function(err, data) {
          assert.ifError(err)
          assert.ok(!data.temporarilyOffline)
          done()
        })
      })
    })

    it('should delete', function(done) {
      jenkins.node.delete(node, function(err) {
        assert.ifError(err)
        done()
      })
    })

    it('should not exist after delete', function(done) {
      jenkins.node.exists(node, function(err, exists) {
        assert.ifError(err)
        assert.strictEqual(exists, false)
        done()
      })
    })
  })
})
