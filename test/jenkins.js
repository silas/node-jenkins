'use strict';

/* jshint expr: true */

/**
 * Module dependencies.
 */

var async = require('async');
var nock = require('nock');
var should = require('should');
var uuid = require('node-uuid');

var fixtures = require('./fixtures');
var jenkins = require('../lib');

/**
 * Tests.
 */

describe('jenkins', function() {
  var nockRec = process.env.NOCK_REC === 'true';
  var nockOff = process.env.NOCK_OFF === 'true' || nockRec;

  before(function() {
    if (!nockOff) nock.disableNetConnect();
  });

  beforeEach(function(done) {
    var self = this;

    self.url = process.env.JENKINS_TEST_URL || 'http://localhost:8080';

    self.nock = nock(self.url);

    self.jenkins = jenkins(self.url);

    self.jobName = 'test-' + uuid.v4();

    if (!nockOff) return done();

    var jobs = {};

    jobs.job = function(next) {
      self.jenkins.job.create(self.jobName, fixtures.jobCreate, function(err) {
        should.not.exist(err);

        next();
      });
    };

    async.auto(jobs, function(err) {
      should.not.exist(err);

      if (nockRec) nock.recorder.rec();

      done();
    });
  });

  afterEach(function() {
    if (nockRec) nock.restore();
  });

  after(function(done) {
    var self = this;

    self.jobName = 'test-' + uuid.v4();

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

  describe('build', function() {
    describe('get', function() {
      it('should return build details', function(done) {
        var self = this;

        var jobs = [];

        self.nock
          .post('/job/' + self.jobName + '/build')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/1/' })
          .get('/job/' + self.jobName + '/1/api/json?depth=0')
          .reply(200, fixtures.buildGet);

        jobs.push(function(next) {
          self.jenkins.job.build(self.jobName, function(err, number) {
            should.not.exist(err);

            next(null, number);
          });
        });

        jobs.push(function(next) {
          async.retry(
            100,
            function(next) {
              self.jenkins.build.get(self.jobName, 1, function(err, data) {
                if (err) return setTimeout(function() { return next(err); }, 100);

                data.should.have.property('number');
                data.number.should.equal(1);

                next();
              });
            },
            next
          );

        });

        async.series(jobs, done);
      });
    });

    describe('stop', function() {
      it('should stop build', function(done) {
        var self = this;

        var jobs = [];

        self.nock
          .post('/job/' + self.jobName + '/build')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/1/' })
          .get('/job/' + self.jobName + '/1/stop')
          .reply(302);

        jobs.push(function(next) {
          self.jenkins.job.build(self.jobName, function(err, number) {
            should.not.exist(err);

            next(null, number);
          });
        });

        jobs.push(function(next) {
          async.retry(
            100,
            function(next) {
              self.jenkins.build.stop(self.jobName, 1, function(err) {
                if (err) return setTimeout(function() { return next(err); }, 100);

                next();
              });
            },
            next
          );

        });

        async.series(jobs, done);
      });
    });
  });

  describe('job', function() {
    describe('build', function() {
      it('should start build', function(done) {
        this.nock
          .post('/job/' + this.jobName + '/build')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/5/' });

        this.jenkins.job.build(this.jobName, function(err, number) {
          should.not.exist(err);

          number.should.be.type('number');
          number.should.be.above(0);

          done();
        });
      });

      it('should start build with token', function(done) {
        this.nock
          .post('/job/' + this.jobName + '/build?token=secret')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/5/' });

        this.jenkins.job.build(this.jobName, { token: 'secret' }, function(err, number) {
          should.not.exist(err);

          number.should.be.type('number');
          number.should.be.above(0);

          done();
        });
      });
    });

    describe('config', function() {
      it('should get job config', function(done) {
        this.nock
          .get('/job/' + this.jobName + '/config.xml')
          .reply(200, fixtures.jobCreate);

        this.jenkins.job.config(this.jobName, function(err, config) {
          should.not.exist(err);

          config.should.be.type('string');
          config.should.containEql('<project>');

          done();
        });
      });

      it('should update config', function(done) {
        var self = this;

        self.nock
          .get('/job/' + self.jobName + '/config.xml')
          .reply(200, fixtures.jobCreate)
          .post('/job/' + self.jobName + '/config.xml')
          .reply(200)
          .get('/job/' + self.jobName + '/config.xml')
          .reply(200, fixtures.jobUpdate);

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

        self.nock
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

    describe('create', function() {
      it('should create job', function(done) {
        var self = this;

        var name = self.jobName + '-new';

        self.nock
          .head('/job/' + name + '/api/json?depth=0')
          .reply(404)
          .post('/createItem?name=' + name, fixtures.jobCreate)
          .reply(200)
          .head('/job/' + name + '/api/json?depth=0')
          .reply(200);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.exists(name, next);
        };

        jobs.create = ['before', function(next) {
          self.jenkins.job.create(name, fixtures.jobCreate, next);
        }];

        jobs.after = ['create', function(next) {
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

    describe('destroy', function() {
      it('should delete job', function(done) {
        var self = this;

        self.nock
          .head('/job/' + self.jobName + '/api/json?depth=0')
          .reply(200)
          .post('/job/' + self.jobName + '/doDelete')
          .reply(302)
          .head('/job/' + self.jobName + '/api/json?depth=0')
          .reply(404);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.exists(self.jobName, next);
        };

        jobs.create = ['before', function(next) {
          self.jenkins.job.destroy(self.jobName, next);
        }];

        jobs.after = ['create', function(next) {
          self.jenkins.job.exists(self.jobName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.equal(true);
          results.after.should.equal(false);

          done();
        });
      });
    });

    describe('disable', function() {
      it('should disable job', function(done) {
        var self = this;

        self.nock
          .get('/job/' + self.jobName + '/api/json?depth=0')
          .reply(200, fixtures.jobGet)
          .post('/job/' + self.jobName + '/disable')
          .reply(302)
          .get('/job/' + self.jobName + '/api/json?depth=0')
          .reply(200, fixtures.jobGetDisabled);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.get(self.jobName, next);
        };

        jobs.create = ['before', function(next) {
          self.jenkins.job.disable(self.jobName, next);
        }];

        jobs.after = ['create', function(next) {
          self.jenkins.job.get(self.jobName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.buildable.should.equal(true);
          results.after.buildable.should.equal(false);

          done();
        });
      });
    });

    describe('enable', function() {
      it('should enable job', function(done) {
        var self = this;

        self.nock
          .post('/job/' + self.jobName + '/disable')
          .reply(302)
          .get('/job/' + self.jobName + '/api/json?depth=0')
          .reply(200, fixtures.jobGetDisabled)
          .post('/job/' + self.jobName + '/enable')
          .reply(302)
          .get('/job/' + self.jobName + '/api/json?depth=0')
          .reply(200, fixtures.jobGet);

        var jobs = {};

        jobs.setup = function(next) {
          self.jenkins.job.disable(self.jobName, next);
        };

        jobs.before = ['setup', function(next) {
          self.jenkins.job.get(self.jobName, next);
        }];

        jobs.enable = ['before', function(next) {
          self.jenkins.job.enable(self.jobName, next);
        }];

        jobs.after = ['enable', function(next) {
          self.jenkins.job.get(self.jobName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.buildable.should.equal(false);
          results.after.buildable.should.equal(true);

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

    describe('get', function() {
      it('should not get job', function(done) {
        var name = this.jobName + '-nope';

        this.nock
          .get('/job/' + name + '/api/json?depth=0')
          .reply(404);

        this.jenkins.job.get(name, function(err, data) {
          should.exist(err);
          should.not.exist(data);

          done();
        });
      });

      it('should get job', function(done) {
        this.nock
          .get('/job/' + this.jobName + '/api/json?depth=0')
          .reply(200, fixtures.jobGet);

        this.jenkins.job.get(this.jobName, function(err, data) {
          should.not.exist(err);

          should.exist(data);

          data.should.properties('name', 'url');

          done();
        });
      });
    });

    describe('list', function() {
      it('should list jobs', function(done) {
        var self = this;

        self.nock
          .get('/api/json')
          .reply(200, fixtures.jobList);

        self.jenkins.job.list(function(err, data) {
          should.not.exist(err);

          should.exist(data);

          data.should.not.be.empty;

          data.forEach(function(job) {
            job.should.have.properties('name');
          });

          done();
        });
      });
    });
  });

  describe('node', function() {
    describe('config', function() {
      it('should get master config', function(done) {
        this.nock
          .get('/computer/(master)/config.xml')
          .reply(200, fixtures.nodeConfigMaster);

        this.jenkins.node.config('master', function(err, data) {
          should.not.exist(err);

          data.should.containEql('numExecutors');

          done();
        });
      });

      it('should error on master update', function(done) {
        this.jenkins.node.config('master', 'xml', function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: master not supported');

          done();
        });
      });
    });
  });
});
