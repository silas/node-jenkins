'use strict';

/**
 * Module dependencies.
 */

var async = require('async');
var nock = require('nock');
var should = require('should');
var uuid = require('node-uuid');

var assets = require('./assets');
var jenkins = require('../lib');

/**
 * Tests.
 */

describe('jenkins', function() {
  var nockRec = process.env.NOCK_REC === 'true';
  var nockOff = process.env.NOCK_OFF === 'true' || nockRec;

  before(function() {
    if (!nockOff) nock.disableNetConnect();
    if (nockRec) nock.recorder.rec();
  });

  beforeEach(function(done) {
    var self = this;

    this.url = process.env.JENKINS_TEST_URL || assets.url;

    this.nock = nock(this.url);

    this.jenkins = jenkins(this.url);

    this.jobName = 'test-' + uuid.v4();

    if (!nockOff) return done();

    var jobs = {};

    jobs.job = function(next) {
      self.jenkins.job.create(self.jobName, assets.job.create, function(err) {
        should.not.exist(err);

        next();
      });
    };

    async.auto(jobs, done);
  });

  after(function(done) {
    var self = this;

    this.jobName = 'test-' + uuid.v4();

    if (!nockOff) {
      nock.enableNetConnect();
      return done();
    }

    var jobs = {};

    jobs.list = function(next) {
      self.jenkins.job.list(next);
    };

    jobs.destroy = ['list', function(next, results) {
      var names = results.list.map(function(job) {
        return job.name;
      }).filter(function(name) {
        return name.match(/^test-/);
      });

      async.map(names, function(name, next) {
        self.jenkins.job.destroy(name, next);
      }, next);
    }];

    async.auto(jobs, done);
  });

  describe('job', function() {
    describe('config', function() {
      it('should get job config', function(done) {
        this.nock
          .get('/job/' + this.jobName + '/config.xml')
          .reply(200, assets.job.create);

        this.jenkins.job.config(this.jobName, function(err, config) {
          should.not.exist(err);

          config.should.be.type('string');
          config.should.containEql('<project>');

          done();
        });
      });

      it('should update config', function(done) {
        var self = this;

        this.nock
          .get('/job/' + self.jobName + '/config.xml')
          .reply(200, assets.job.create)
          .post('/job/' + self.jobName + '/config.xml')
          .reply(200)
          .get('/job/' + self.jobName + '/config.xml')
          .reply(200, assets.job.update);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.config(self.jobName, next);
        };

        jobs.update = ['before', function(next, results) {
          var config = results.before.replace(
            '<description>before</description>',
            '<description>after</description>'
          );

          self.jenkins.job.config(self.jobName, config, next);
        }];

        jobs.after = ['update', function(next) {
          self.jenkins.job.config(self.jobName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.not.eql(results.after);
          results.after.should.containEql('<description>after</description>');

          done();
        });
      });
    });

    describe('copy', function() {
      it('should copy job', function(done) {
        var self = this;

        var name = self.jobName + '-new';

        this.nock
          .head('/job/' + name + '/api/json?depth=0')
          .reply(404)
          .post('/createItem?name=' + name + '&from=' + self.jobName + '&mode=copy')
          .reply(302)
          .head('/job/' + name + '/api/json?depth=0')
          .reply(200);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.exists(name, next);
        };

        jobs.copy = ['before', function(next) {
          self.jenkins.job.copy(self.jobName, name, next);
        }];

        jobs.after = ['copy', function(next) {
          self.jenkins.job.exists(name, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.equal(false);
          results.after.should.equal(true);

          done();
        });
      });
    });

    describe('exists', function() {
      it('should not find job', function(done) {
        var name = this.jobName + '-nope';

        this.nock
          .head('/job/' + name + '/api/json?depth=0')
          .reply(404);

        this.jenkins.job.exists(name, function(err, exists) {
          should.not.exist(err);

          exists.should.equal(false);

          done();
        });
      });

      it('should find job', function(done) {
        this.nock
          .head('/job/' + this.jobName + '/api/json?depth=0')
          .reply(200);

        this.jenkins.job.exists(this.jobName, function(err, exists) {
          should.not.exist(err);

          exists.should.equal(true);

          done();
        });
      });
    });
  });
});
