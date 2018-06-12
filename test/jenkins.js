'use strict';

/* jshint expr: true */

/**
 * Module dependencies.
 */

var async = require('async');
var bluebird = require('bluebird');
var fixtures = require('fixturefiles');
var lodash = require('lodash');
var nock = require('nock');
var papi = require('papi');
var should = require('should');
var sinon = require('sinon');
var uuid = require('node-uuid');

var helper = require('./helper');
var jenkins = require('../lib');

var Jenkins = jenkins;

var ndescribe = helper.ndescribe;
var nit = helper.nit;

/**
 * Tests.
 */

describe('jenkins', function() {

  beforeEach(function() {
    this.sinon = sinon.createSandbox();

    this.url = helper.config.url;
    this.nock = nock(this.url);
    this.jenkins = jenkins({
      baseUrl: this.url,
      crumbIssuer: helper.config.crumbIssuer,
    });
  });

  afterEach(function(done) {
    this.sinon.restore();

    helper.teardown({ test: this }, done);
  });

  after(function(done) {
    helper.cleanup({ test: this }, done);
  });

  describe('exports', function() {
    it('should support new on module', function() {
      var j = new Jenkins(this.url);

      should(j).be.an.instanceof(jenkins.Jenkins);
    });
  });

  describe('build', function() {
    beforeEach(function(done) {
      helper.setup({ job: true, test: this }, done);
    });

    describe('get', function() {
      it('should return build details', function(done) {
        var self = this;

        var jobs = [];

        self.nock
          .post('/job/' + self.jobName + '/build')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/1/' })
          .get('/job/' + self.jobName + '/1/api/json')
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

      it('should return build log', function(done) {
        var self = this;

        var jobs = [];

        self.nock
          .post('/job/' + self.jobName + '/build')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/1/' })
          .post('/job/' + self.jobName + '/1/logText/progressiveText')
          .reply(200, fixtures.consoleText, { 'Content-Type': 'text/plain;charset=UTF-8' });

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
              self.jenkins.build.log(self.jobName, 1, function(err, data) {
                if (err) return setTimeout(function() { return next(err); }, 100);
                data.should.be.String().and.containEql('Started by user');

                next();
              });
            },
            next
          );

        });

        async.series(jobs, done);
      });

      nit('should get with options', function(done) {
        this.nock
          .get('/job/test/1/api/json?tree=%5B*%5B*%5D%5D')
          .reply(200, fixtures.buildGet);

        this.jenkins.build.get('test', 1, { tree: '[*[*]]' }, function(err, data) {
          should.not.exist(err);

          data.should.have.property('number');

          done();
        });
      });

      nit('should return error when it does not exist', function(done) {
        this.nock
          .get('/job/test/2/api/json')
          .reply(404);

        this.jenkins.build.get('test', 2, function(err, data) {
          should.exist(err);
          should.equal(err.message, 'jenkins: build.get: test 2 not found');

          should.not.exist(data);

          done();
        });
      });
    });

    describe('stop', function() {
      it('should stop build', function(done) {
        var self = this;

        var jobs = [];

        self.nock
          .post('/job/' + self.jobName + '/build')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/1/' })
          .post('/job/' + self.jobName + '/1/stop')
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
    beforeEach(function(done) {
      helper.setup({ job: true, test: this }, done);
    });

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

      nit('should work with parameters', function(done) {
        this.nock
          .post('/job/test/buildWithParameters', { hello: 'world' })
          .reply(201);

        var opts = { parameters: { hello: 'world' } };

        this.jenkins.job.build('test', opts, function(err) {
          should.not.exist(err);

          done();
        });
      });

      nit('should work with a token and parameters', function(done) {
        this.nock
          .post('/job/test/buildWithParameters?token=secret', { hello: 'world' })
          .reply(201);

        var opts = {
          parameters: { hello: 'world' },
          token: 'secret',
        };

        this.jenkins.job.build('test', opts, function(err) {
          should.not.exist(err);

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

        jobs.update = ['before', function(results, next) {
          var config = results.before.replace(
            '<description>before</description>',
            '<description>after</description>'
          );

          self.jenkins.job.config(self.jobName, config, next);
        }];

        jobs.after = ['update', function(results, next) {
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
          .head('/job/' + name + '/api/json')
          .reply(404)
          .post('/createItem?name=' + name + '&from=' + self.jobName + '&mode=copy')
          .reply(302)
          .head('/job/' + name + '/api/json')
          .reply(200);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.exists(name, next);
        };

        jobs.copy = ['before', function(results, next) {
          self.jenkins.job.copy(self.jobName, name, next);
        }];

        jobs.after = ['copy', function(results, next) {
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
          .head('/job/' + name + '/api/json')
          .reply(404)
          .post('/createItem?name=' + name, fixtures.jobCreate)
          .reply(200)
          .head('/job/' + name + '/api/json')
          .reply(200);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.exists(name, next);
        };

        jobs.create = ['before', function(results, next) {
          self.jenkins.job.create(name, fixtures.jobCreate, next);
        }];

        jobs.after = ['create', function(results, next) {
          self.jenkins.job.exists(name, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.equal(false);
          results.after.should.equal(true);

          done();
        });
      });

      nit('should return an error if it already exists', function(done) {
        var error = 'a job already exists with the name "nodejs-jenkins-test"';

        this.nock
          .post('/createItem?name=test', fixtures.jobCreate)
          .reply(400, '', { 'x-error': error });

        this.jenkins.job.create('test', fixtures.jobCreate, function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: job.create: a job already exists with the name ' +
                                 '"nodejs-jenkins-test"');

          done();
        });
      });
    });

    describe('destroy', function() {
      it('should delete job', function(done) {
        var self = this;

        self.nock
          .head('/job/' + self.jobName + '/api/json')
          .reply(200)
          .post('/job/' + self.jobName + '/doDelete')
          .reply(302)
          .head('/job/' + self.jobName + '/api/json')
          .reply(404);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.exists(self.jobName, next);
        };

        jobs.create = ['before', function(results, next) {
          self.jenkins.job.destroy(self.jobName, next);
        }];

        jobs.after = ['create', function(results, next) {
          self.jenkins.job.exists(self.jobName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.equal(true);
          results.after.should.equal(false);

          done();
        });
      });

      nit('should return error on failure', function(done) {
        this.nock
          .post('/job/test/doDelete')
          .reply(200);

        this.jenkins.job.destroy('test', function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: job.destroy: failed to delete: test');

          done();
        });
      });
    });

    describe('disable', function() {
      it('should disable job', function(done) {
        var self = this;

        self.nock
          .get('/job/' + self.jobName + '/api/json')
          .reply(200, fixtures.jobGet)
          .post('/job/' + self.jobName + '/disable')
          .reply(302)
          .get('/job/' + self.jobName + '/api/json')
          .reply(200, fixtures.jobGetDisabled);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.job.get(self.jobName, next);
        };

        jobs.create = ['before', function(results, next) {
          self.jenkins.job.disable(self.jobName, next);
        }];

        jobs.after = ['create', function(results, next) {
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
          .get('/job/' + self.jobName + '/api/json')
          .reply(200, fixtures.jobGetDisabled)
          .post('/job/' + self.jobName + '/enable')
          .reply(302)
          .get('/job/' + self.jobName + '/api/json')
          .reply(200, fixtures.jobGet);

        var jobs = {};

        jobs.setup = function(next) {
          self.jenkins.job.disable(self.jobName, next);
        };

        jobs.before = ['setup', function(results, next) {
          self.jenkins.job.get(self.jobName, next);
        }];

        jobs.enable = ['before', function(results, next) {
          self.jenkins.job.enable(self.jobName, next);
        }];

        jobs.after = ['enable', function(results, next) {
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
          .head('/job/' + name + '/api/json')
          .reply(404);

        this.jenkins.job.exists(name, function(err, exists) {
          should.not.exist(err);

          exists.should.equal(false);

          done();
        });
      });

      it('should find job', function(done) {
        this.nock
          .head('/job/' + this.jobName + '/api/json')
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
          .get('/job/' + name + '/api/json')
          .reply(404);

        this.jenkins.job.get(name, function(err, data) {
          should.exist(err);
          should.not.exist(data);

          done();
        });
      });

      it('should get job', function(done) {
        this.nock
          .get('/job/' + this.jobName + '/api/json')
          .reply(200, fixtures.jobGet);

        this.jenkins.job.get(this.jobName, function(err, data) {
          should.not.exist(err);

          should.exist(data);

          data.should.properties('name', 'url');

          done();
        });
      });

      nit('should work with options', function(done) {
        this.nock
          .get('/job/test/api/json?depth=1')
          .reply(200, fixtures.jobCreate);

        this.jenkins.job.get('test', { depth: 1 }, function(err) {
          should.not.exist(err);

          done();
        });
      });

      nit('should return error when not found', function(done) {
        this.nock
          .get('/job/test/api/json')
          .reply(404);

        this.jenkins.job.get('test', function(err, data) {
          should.exist(err);
          should.equal(err.message, 'jenkins: job.get: test not found');

          should.not.exist(data);

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

      nit('should handle corrupt responses', function(done) {
        var data = '"trash';

        this.nock
          .get('/api/json')
          .reply(200, data);

        this.jenkins.job.list(function(err) {
          should.exist(err);
          should.exist(err.message);

          err.message.should.eql('jenkins: job.list: returned bad data');

          done();
        });
      });
    });
  });

  describe('node', function() {
    beforeEach(function(done) {
      helper.setup({ node: true, test: this }, done);
    });

    describe('config', function() {
      it('should error on master update', function(done) {
        this.jenkins.node.config('master', 'xml', function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: node.config: master not supported');

          done();
        });
      });
    });

    describe('create', function() {
      it('should create node', function(done) {
        var name = 'test-node-' + uuid.v4();

        this.nock
          .post('/computer/doCreateItem?' + fixtures.nodeCreateQuery.replace(/{name}/g, name))
          .reply(302, '', { location: 'http://localhost:8080/computer/' });

        this.jenkins.node.create(name, function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('destroy', function() {
      it('should delete node', function(done) {
        var self = this;

        self.nock
          .head('/computer/' + self.nodeName + '/api/json')
          .reply(200)
          .post('/computer/' + self.nodeName + '/doDelete')
          .reply(302, '')
          .head('/computer/' + self.nodeName + '/api/json')
          .reply(404);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.node.exists(self.nodeName, function(err, exists) {
            should.not.exist(err);

            next(null, exists);
          });
        };

        jobs.destroy = ['before', function(results, next) {
          self.jenkins.node.destroy(self.nodeName, next);
        }];

        jobs.after = ['destroy', function(results, next) {
          self.jenkins.node.exists(self.nodeName, function(err, exists) {
            should.not.exist(err);

            next(null, exists);
          });
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
      it('should disable node', function(done) {
        var self = this;

        self.nock
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGet)
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGet)
          .post('/computer/' + self.nodeName + '/toggleOffline?offlineMessage=away')
          .reply(302, '')
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGetTempOffline)
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGetTempOffline)
          .post('/computer/' + self.nodeName + '/changeOfflineCause',
            'offlineMessage=update&json=%7B%22offlineMessage%22%3A%22update%22%7D&' +
            'Submit=Update%20reason')
          .reply(302, '')
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGetTempOfflineUpdate);

        var jobs = {};

        jobs.beforeDisable = function(next) {
          self.jenkins.node.get(self.nodeName, function(err, node) {
            should.not.exist(err);

            next(null, node);
          });
        };

        jobs.disable = ['beforeDisable', function(results, next) {
          self.jenkins.node.disable(self.nodeName, 'away', next);
        }];

        jobs.afterDisable = ['disable', function(results, next) {
          self.jenkins.node.get(self.nodeName, function(err, node) {
            should.not.exist(err);

            next(null, node);
          });
        }];

        jobs.update = ['afterDisable', function(results, next) {
          self.jenkins.node.disable(self.nodeName, 'update', next);
        }];

        jobs.afterUpdate = ['update', function(results, next) {
          self.jenkins.node.get(self.nodeName, function(err, node) {
            should.not.exist(err);

            next(null, node);
          });
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.beforeDisable.temporarilyOffline.should.equal(false);
          results.afterDisable.temporarilyOffline.should.equal(true);
          results.afterDisable.offlineCauseReason.should.equal('away');
          results.afterUpdate.temporarilyOffline.should.equal(true);
          results.afterUpdate.offlineCauseReason.should.equal('update');

          done();
        });
      });
    });

    describe('enable', function() {
      it('should enable node', function(done) {
        var self = this;

        self.nock
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGet)
          .post('/computer/' + self.nodeName + '/toggleOffline?offlineMessage=away')
          .reply(302, '')
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGetTempOffline)
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGetTempOffline)
          .get('/computer/' + self.nodeName + '/api/json')
          .reply(200, fixtures.nodeGet)
          .post('/computer/' + self.nodeName + '/toggleOffline?offlineMessage=')
          .reply(302, '');

        var jobs = {};

        jobs.disable = function(next) {
          self.jenkins.node.disable(self.nodeName, 'away', next);
        };

        jobs.before = ['disable', function(results, next) {
          self.jenkins.node.get(self.nodeName, function(err, node) {
            should.not.exist(err);

            next(null, node);
          });
        }];

        jobs.enable = ['before', function(results, next) {
          self.jenkins.node.enable(self.nodeName, next);
        }];

        jobs.after = ['enable', function(results, next) {
          self.jenkins.node.get(self.nodeName, function(err, node) {
            should.not.exist(err);

            next(null, node);
          });
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.temporarilyOffline.should.equal(true);
          results.after.temporarilyOffline.should.equal(false);

          done();
        });
      });
    });

    describe('disconnect', function() {
      it('should disconnect node', function(done) {
        var self = this;

        self.nock
            .get('/computer/' + self.nodeName + '/api/json')
            .reply(200, fixtures.nodeGetOnline)
            .get('/computer/' + self.nodeName + '/api/json')
            .reply(200, fixtures.nodeGetOnline)
            .post('/computer/' + self.nodeName + '/doDisconnect?offlineMessage=away')
            .reply(302, '')
            .get('/computer/' + self.nodeName + '/api/json')
            .reply(200, fixtures.nodeGetOffline)
            .get('/computer/' + self.nodeName + '/api/json')
            .reply(200, fixtures.nodeGetOffline)
            .post('/computer/' + self.nodeName + '/toggleOffline?offlineMessage=update')
            .reply(302, '')
            .get('/computer/' + self.nodeName + '/api/json')
            .reply(200, fixtures.nodeGetOfflineUpdate);

        var jobs = {};

        jobs.beforeDisconnect = function(next) {
          async.retry(
            1000,
            function(next) {
              self.jenkins.node.get(self.nodeName, function(err, node) {
                if (err) return next(err);
                if (!node || node.offline) return next(new Error('node offline'));
                next(null, node);
              });
            },
            next
          );
        };

        jobs.disconnect = ['beforeDisconnect', function(results, next) {
          self.jenkins.node.disconnect(self.nodeName, 'away', next);
        }];

        jobs.afterDisconnect = ['disconnect', function(results, next) {
          self.jenkins.node.get(self.nodeName, function(err, node) {
            should.not.exist(err);

            next(null, node);
          });
        }];

        jobs.update = ['afterDisconnect', function(results, next) {
          self.jenkins.node.disconnect(self.nodeName, 'update', next);
        }];

        jobs.afterUpdate = ['update', function(results, next) {
          self.jenkins.node.get(self.nodeName, function(err, node) {
            should.not.exist(err);

            next(null, node);
          });
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.beforeDisconnect.offline.should.equal(false);
          results.afterDisconnect.offline.should.equal(true);
          results.afterDisconnect.offlineCauseReason.should.equal('away');
          results.afterUpdate.offline.should.equal(true);
          results.afterUpdate.offlineCauseReason.should.equal('update');

          done();
        });
      });
    });

    describe('exists', function() {
      it('should not find node', function(done) {
        var name = this.nodeName + '-nope';

        this.nock
          .head('/computer/' + name + '/api/json')
          .reply(404);

        this.jenkins.node.exists(name, function(err, exists) {
          should.not.exist(err);

          exists.should.equal(false);

          done();
        });
      });

      it('should find node', function(done) {
        this.nock
          .head('/computer/' + this.nodeName + '/api/json')
          .reply(200);

        this.jenkins.node.exists(this.nodeName, function(err, exists) {
          should.not.exist(err);

          exists.should.equal(true);

          done();
        });
      });
    });

    describe('get', function() {
      it('should get node details', function(done) {
        this.nock
          .get('/computer/' + this.nodeName + '/api/json')
          .reply(200, fixtures.nodeGet);

        this.jenkins.node.get(this.nodeName, function(err, node) {
          should.not.exist(err);

          should.exist(node);

          node.should.have.properties('displayName');

          done();
        });
      });

      it('should get master', function(done) {
        this.nock
          .get('/computer/(master)/api/json')
          .reply(200, fixtures.nodeGet);

        this.jenkins.node.get('master', function(err, node) {
          should.not.exist(err);

          should.exist(node);

          node.should.have.properties('displayName');

          done();
        });
      });
    });

    describe('list', function() {
      it('should list nodes', function(done) {
        this.nock
          .get('/computer/api/json')
          .reply(200, fixtures.nodeList);

        this.jenkins.node.list(function(err, nodes) {
          should.not.exist(err);

          should.exist(nodes);

          nodes.should.be.instanceof(Array);
          nodes.should.not.be.empty;

          done();
        });
      });

      it('should include extra metadata', function(done) {
        this.nock
          .get('/computer/api/json')
          .reply(200, fixtures.nodeList);

        var opts = { full: true };

        this.jenkins.node.list(opts, function(err, info) {
          should.not.exist(err);

          should.exist(info);

          info.should.have.properties(
            'busyExecutors',
            'computer',
            'displayName',
            'totalExecutors'
          );

          done();
        });
      });
    });
  });

  describe('queue', function() {
    beforeEach(function(done) {
      helper.setup({ job: true, test: this }, done);
    });

    describe('list', function() {
      it('should list queue', function(done) {
        var self = this;

        self.nock
          .get('/queue/api/json')
          .reply(200, fixtures.queueList)
          .post('/job/' + self.jobName + '/build')
          .reply(201, '', { location: 'http://localhost:8080/queue/item/124/' });

        var jobs = {};
        var stop = false;

        jobs.list = function(next) {
          async.retry(
            1000,
            function(next) {
              self.jenkins.queue.list(function(err, queue) {
                if (!err && queue && !queue.length) {
                  err = new Error('no queue');
                }
                if (err) return next(err);

                stop = true;

                queue.should.be.instanceof(Array);

                next();
              });
            },
            next
          );
        };

        jobs.builds = function(next) {
          async.retry(
            1000,
            function(next) {
              if (stop) return next();

              self.jenkins.job.build(self.jobName, function(err) {
                if (err) return next(err);
                if (!stop) return next(new Error('queue more'));

                next();
              });
            },
            next
          );
        };

        async.parallel(jobs, function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('item', function() {
      nit('should return a queue item', function(done) {
        this.nock
          .get('/queue/item/130/api/json')
          .reply(200, fixtures.queueItem);

        this.jenkins.queue.item(130, function(err, data) {
          if (err) return done(err);
          data.should.have.property('id');
          data.id.should.equal(130);

          done();
        });
      });

      it('should require a number', function(done) {
        this.jenkins.queue.item(null, function(err, data) {
          should.not.exist(data);
          should.exist(err);
          done();
        });
      });
    });

    describe('get', function() {
      nit('should work', function(done) {
        this.nock
          .get('/computer/(master)/api/json')
          .reply(200, fixtures.nodeGet);

        this.jenkins.node.get('master', function(err, data) {
          should.not.exist(err);

          should.exist(data);

          done();
        });
      });

      it('should work with options', function(done) {
        this.nock
          .get('/queue/api/json?depth=1')
          .reply(200, fixtures.queueList);

        this.jenkins.queue.get({ depth: 1 }, function(err, data) {
          should.not.exist(err);

          should.exist(data);

          done();
        });
      });
    });

    ndescribe('cancel', function() {
      it('should work', function(done) {
        this.nock
          .post('/queue/item/1/cancelQueue', '')
          .reply(302);

        this.jenkins.queue.cancel(1, function(err) {
          should.not.exist(err);

          done();
        });
      });

      it('should return error on failure', function(done) {
        this.nock
          .post('/queue/item/1/cancelQueue', '')
          .reply(500);

        this.jenkins.queue.cancel(1, function(err) {
          should.exist(err);

          done();
        });
      });
    });
  });

  describe('view', function() {
    beforeEach(function(done) {
      helper.setup({ job: true, view: true, test: this }, done);
    });

    describe('create', function() {
      it('should create view', function(done) {
        var self = this;

        var name = self.viewName + '-new';

        self.nock
          .head('/view/' + name + '/api/json')
          .reply(404)
          .post('/createView', JSON.parse(
            JSON.stringify(fixtures.viewCreate).replace(/test-view/g, name)
          ))
          .reply(302)
          .head('/view/' + name + '/api/json')
          .reply(200);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.view.exists(name, next);
        };

        jobs.create = ['before', function(results, next) {
          self.jenkins.view.create(name, 'list', next);
        }];

        jobs.after = ['create', function(results, next) {
          self.jenkins.view.exists(name, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.equal(false);
          results.after.should.equal(true);

          done();
        });
      });

      nit('should return an error if it already exists', function(done) {
        var error = 'A view already exists with the name "test-view"';

        this.nock
          .post('/createView', fixtures.viewCreate)
          .reply(400, '', { 'x-error': error });

        this.jenkins.view.create(this.viewName, 'list', function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: view.create: A view already exists ' +
                                 'with the name "test-view"');

          done();
        });
      });
    });

    describe('config', function() {
      it('should return xml', function(done) {
        this.nock
          .get('/view/' + this.viewName + '/config.xml')
          .reply(200, fixtures.viewConfig);

        this.jenkins.view.config(this.viewName, function(err, config) {
          should.not.exist(err);

          config.should.be.type('string');
          config.should.containEql('<hudson.model.ListView>');

          done();
        });
      });

      it('should update config xml', function(done) {
        var self = this;

        var src = '<filterQueue>false</filterQueue>';
        var dst = '<filterQueue>true</filterQueue>';

        self.nock
          .get('/view/' + self.viewName + '/config.xml')
          .reply(200, fixtures.viewConfig)
          .post('/view/' + self.viewName + '/config.xml')
          .reply(200)
          .get('/view/' + self.viewName + '/config.xml')
          .reply(200, fixtures.viewConfig.replace(src, dst));

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.view.config(self.viewName, next);
        };

        jobs.config = ['before', function(results, next) {
          var config = fixtures.viewConfig.replace(src, dst);

          self.jenkins.view.config(self.viewName, config, next);
        }];

        jobs.after = ['config', function(results, next) {
          self.jenkins.view.config(self.viewName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.containEql(src);
          results.after.should.containEql(dst);

          done();
        });
      });
    });

    describe('destroy', function() {
      it('should delete view', function(done) {
        var self = this;

        self.nock
          .head('/view/' + self.viewName + '/api/json')
          .reply(200)
          .post('/view/' + self.viewName + '/doDelete')
          .reply(302)
          .head('/view/' + self.viewName + '/api/json')
          .reply(404);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.view.exists(self.viewName, next);
        };

        jobs.create = ['before', function(results, next) {
          self.jenkins.view.destroy(self.viewName, next);
        }];

        jobs.after = ['create', function(results, next) {
          self.jenkins.view.exists(self.viewName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.should.equal(true);
          results.after.should.equal(false);

          done();
        });
      });

      nit('should return error on failure', function(done) {
        this.nock
          .post('/view/test/doDelete')
          .reply(200);

        this.jenkins.view.destroy('test', function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: view.destroy: failed to delete: test');

          done();
        });
      });
    });

    describe('get', function() {
      it('should not get view', function(done) {
        var name = this.viewName + '-nope';

        this.nock
          .get('/view/' + name + '/api/json')
          .reply(404);

        this.jenkins.view.get(name, function(err, data) {
          should.exist(err);
          should.not.exist(data);

          done();
        });
      });

      it('should get view', function(done) {
        this.nock
          .get('/view/' + this.viewName + '/api/json')
          .reply(200, fixtures.viewGet);

        this.jenkins.view.get(this.viewName, function(err, data) {
          should.not.exist(err);

          should.exist(data);

          data.should.properties('name', 'url');

          done();
        });
      });

      nit('should work with options', function(done) {
        this.nock
          .get('/view/test/api/json?depth=1')
          .reply(200, fixtures.viewCreate);

        this.jenkins.view.get('test', { depth: 1 }, function(err) {
          should.not.exist(err);

          done();
        });
      });

      nit('should return error when not found', function(done) {
        this.nock
          .get('/view/test/api/json')
          .reply(404);

        this.jenkins.view.get('test', function(err, data) {
          should.exist(err);
          should.equal(err.message, 'jenkins: view.get: test not found');

          should.not.exist(data);

          done();
        });
      });
    });

    describe('list', function() {
      it('should list views', function(done) {
        var self = this;

        self.nock
          .get('/api/json')
          .reply(200, fixtures.viewList);

        self.jenkins.view.list(function(err, data) {
          should.not.exist(err);

          should.exist(data);

          data.should.not.be.empty;

          data.forEach(function(view) {
            view.should.have.properties('name');
          });

          done();
        });
      });

      nit('should handle corrupt responses', function(done) {
        var data = '"trash';

        this.nock
          .get('/api/json')
          .reply(200, data);

        this.jenkins.view.list(function(err) {
          should.exist(err);
          should.exist(err.message);

          err.message.should.eql('jenkins: view.list: returned bad data');

          done();
        });
      });
    });

    describe('add', function() {
      it('should add job to view', function(done) {
        var self = this;

        var before = fixtures.viewGetListView;
        before.jobs = [];

        self.nock
          .get('/view/' + self.viewName + '/api/json')
          .reply(200, before)
          .post('/view/' + self.viewName + '/addJobToView?name=' + self.jobName)
          .reply(200)
          .get('/view/' + self.viewName + '/api/json')
          .reply(200, fixtures.viewGetListView);

        var jobs = {};

        jobs.before = function(next) {
          self.jenkins.view.get(self.viewName, next);
        };

        jobs.add = ['before', function(results, next) {
          self.jenkins.view.add(self.viewName, self.jobName, next);
        }];

        jobs.after = ['add', function(results, next) {
          self.jenkins.view.get(self.viewName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.jobs.should.be.empty;
          results.after.jobs.should.not.be.empty;

          done();
        });
      });
    });

    describe('remove', function() {
      it('should remove job from view', function(done) {
        var self = this;

        var after = fixtures.viewGetListView;
        after.jobs = [];

        self.nock
          .post('/view/' + self.viewName + '/addJobToView?name=' + self.jobName)
          .reply(200)
          .get('/view/' + self.viewName + '/api/json')
          .reply(200, fixtures.viewGetListView)
          .post('/view/' + self.viewName + '/removeJobFromView?name=' + self.jobName)
          .reply(200)
          .get('/view/' + self.viewName + '/api/json')
          .reply(200, after);

        var jobs = {};

        jobs.add = function(next) {
          self.jenkins.view.add(self.viewName, self.jobName, next);
        };

        jobs.before = ['add', function(results, next) {
          self.jenkins.view.get(self.viewName, next);
        }];

        jobs.remove = ['before', function(results, next) {
          self.jenkins.view.remove(self.viewName, self.jobName, next);
        }];

        jobs.after = ['remove', function(results, next) {
          self.jenkins.view.get(self.viewName, next);
        }];

        async.auto(jobs, function(err, results) {
          should.not.exist(err);

          results.before.jobs.should.not.be.empty;
          results.after.jobs.should.be.empty;

          done();
        });
      });
    });
  });

  describe('walk', function() {
    it('should work', function() {
      var setup = function(tree, depth, data) {
        data = data || [];

        var prefix = lodash.repeat(' ', depth);

        data.push(prefix + tree.name);

        lodash.each(tree.methods, function(method) {
          data.push(prefix + ' - ' + method.name + ' (' + method.type + ')');
        });

        lodash.each(tree.objects, function(tree) {
          setup(tree, depth + 1, data);
        });

        return data;
      };

      setup(jenkins.Jenkins.walk(), 0).should.eql([
        'Jenkins',
        ' - info (callback)',
        ' - get (callback)',
        ' - walk (sync)',
        ' Build',
        '  - get (callback)',
        '  - stop (callback)',
        '  - log (callback)',
        '  - logStream (eventemitter)',
        ' CrumbIssuer',
        '  - get (callback)',
        ' Job',
        '  - build (callback)',
        '  - config (callback)',
        '  - copy (callback)',
        '  - create (callback)',
        '  - destroy (callback)',
        '  - delete (alias)',
        '  - disable (callback)',
        '  - enable (callback)',
        '  - exists (callback)',
        '  - get (callback)',
        '  - list (callback)',
        ' Node',
        '  - config (callback)',
        '  - create (callback)',
        '  - destroy (callback)',
        '  - delete (alias)',
        '  - doDisconnect (callback)',
        '  - toggleOffline (callback)',
        '  - changeOfflineCause (callback)',
        '  - disconnect (callback)',
        '  - disable (callback)',
        '  - enable (callback)',
        '  - exists (callback)',
        '  - get (callback)',
        '  - list (callback)',
        ' Queue',
        '  - list (callback)',
        '  - item (callback)',
        '  - get (callback)',
        '  - cancel (callback)',
        ' View',
        '  - create (callback)',
        '  - config (callback)',
        '  - destroy (callback)',
        '  - delete (alias)',
        '  - exists (callback)',
        '  - get (callback)',
        '  - list (callback)',
        '  - add (callback)',
        '  - remove (callback)',
      ]);
    });
  });

  describe('promisify', function() {
    before(function() {
      this.jenkins = jenkins({
        baseUrl: this.url,
        promisify: bluebird.fromCallback,
      });
    });

    it('should prefix error message', function() {
      var self = this;

      self.sinon.stub(papi.tools, 'promisify').callsFake(function() {
        throw new Error('test');
      });

      should(function() {
        jenkins({ baseUrl: self.url, promisify: true });
      }).throw('promisify: test');
    });

    describe('default', function() {
      it('should work', function() {
        var self = this;

        if (global.Promise) {
          jenkins({ baseUrl: self.url, promisify: true });
        } else {
          should(function() {
            jenkins({ baseUrl: self.url, promisify: true });
          }).throw('promisify: wrapper required');
        }
      });
    });

    ndescribe('callback', function() {
      it('should work', function(done) {
        this.nock
          .get('/api/json')
          .reply(200, { ok: true });

        this.jenkins.info(function(err, data) {
          should.not.exist(err);

          should(data).eql({ ok: true });

          done();
        });
      });

      it('should get error', function(done) {
        this.nock
          .get('/api/json')
          .reply(500);

        this.jenkins.info(function(err) {
          should(err).have.property('message', 'jenkins: info: internal server error');

          done();
        });
      });
    });

    ndescribe('promise', function() {
      it('should work', function(done) {
        this.nock
          .get('/api/json')
          .reply(200, { ok: true });

        this.jenkins.info().then(function(data) {
          should(data).eql({ ok: true });

          done();
        });
      });

      it('should get error', function(done) {
        this.nock
          .get('/api/json')
          .reply(500);

        this.jenkins.info().catch(function(err) {
          should(err).have.property('message', 'jenkins: info: internal server error');

          done();
        });
      });
    });
  });
});
