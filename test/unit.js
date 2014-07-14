'use strict';

/**
 * Module dependencies.
 */

var lodash = require('lodash');
var nock = require('nock');
var querystring = require('querystring');
var should = require('should');

var assets = require('./assets');
var jenkins = require('../lib');

/**
 * Helpers.
 */

var test = function(done) {
  var n = nock(assets.url);

  if (done) {
    var nDone = n.done;
    n.done = function() {
      nDone();
      done();
    };
  }

  return n;
};

/**
 * Tests
 */

describe('jenkins', function() {
  before(function() {
    this.jenkins = jenkins(assets.url + '/');
  });

  it('should get', function(done) {
    var api = test(done)
      .get('/api/json')
      .reply(200, assets.get);

    this.jenkins.get(function(err, data) {
      should.not.exist(err);

      should(data).have.properties('nodeDescription');

      data.nodeDescription.should.eql('the master Jenkins node');

      api.done();
    });
  });

  describe('build', function() {
    it('should get', function(done) {
      var api = test(done)
        .get('/job/nodejs-jenkins-test/1/api/json?depth=0')
        .reply(200, assets.build.get);

      this.jenkins.build.get('nodejs-jenkins-test', 1, function(err, data) {
        should.ifError(err);
        should.equal(data.duration, 138);
        api.done();
      });
    });

    it('should get with options', function(done) {
      var api = test(done)
        .get('/job/nodejs-jenkins-test/1/api/json?depth=1')
        .reply(200, assets.build.get);

      this.jenkins.build.get('nodejs-jenkins-test', 1, { depth: 1 }, function(err, data) {
        should.ifError(err);
        should.equal(data.duration, 138);
        api.done();
      });
    });

    it('should return error when it does not exist', function(done) {
      var api = test(done)
        .get('/job/nodejs-jenkins-test/2/api/json?depth=0')
        .reply(404);

      this.jenkins.build.get('nodejs-jenkins-test', 2, function(err, data) {
        should.equal(err.message, 'build nodejs-jenkins-test 2 not found');
        should.ok(!data);
        api.done();
      });
    });

    it('should stop build', function(done) {
      var api = test(done)
        .get('/job/nodejs-jenkins-test/1/stop')
        .reply(302, assets.url + '/job/nodejs-jenkins-test/1');

      this.jenkins.build.stop('nodejs-jenkins-test', 1, function(err) {
        should.ifError(err);
        api.done();
      });
    });
  });

  describe('job', function() {
    describe('build', function() {
      it('should work', function(done) {
        var api = test(done)
          .post('/job/nodejs-jenkins-test/build')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build('nodejs-jenkins-test', function(err) {
          should.ifError(err);
          api.done();
        });
      });

      it('should work with a token', function(done) {
        var api = test(done)
          .post('/job/nodejs-jenkins-test/build?token=secret')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build('nodejs-jenkins-test', { token: 'secret' }, function(err) {
          should.ifError(err);
          api.done();
        });
      });

      it('should work with parameters', function(done) {
        var api = test(done)
          .post('/job/nodejs-jenkins-test/buildWithParameters?hello=world')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build(
          'nodejs-jenkins-test',
          { parameters: { hello: 'world' } },
          function(err) {
            should.ifError(err);
            api.done();
          }
        );
      });

      it('should work with a token and parameters', function(done) {
        var api = test(done)
          .post('/job/nodejs-jenkins-test/buildWithParameters?hello=world&token=secret')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build(
          'nodejs-jenkins-test',
          { parameters: { hello: 'world' }, token: 'secret' },
          function(err) {
            should.ifError(err);
            api.done();
          }
        );
      });
    });

    describe('config', function() {
      it('should return xml', function(done) {
        var api = test(done)
          .get('/job/nodejs-jenkins-test/config.xml')
          .reply(200, assets.job.create);

        this.jenkins.job.config('nodejs-jenkins-test', function(err, xml) {
          should.ifError(err);
          should.equal(xml, assets.job.create);
          api.done();
        });
      });

      it('should update xml', function(done) {
        var api = test(done)
          .matchHeader('content-type', 'text/xml')
          .post('/job/nodejs-jenkins-test/config.xml', assets.job.update)
          .reply(200);

        this.jenkins.job.config('nodejs-jenkins-test', assets.job.update, function(err) {
          should.ifError(err);
          api.done();
        });
      });
    });

    describe('copy', function() {
      it('should work', function(done) {
        var api = test(done)
          .post('/createItem?name=nodejs-jenkins-test-copy&from=' +
                'nodejs-jenkins-test&mode=copy')
          .reply(200);

        this.jenkins.job.copy(
          'nodejs-jenkins-test',
          'nodejs-jenkins-test-copy',
          function(err) {
            should.ifError(err);
            api.done();
          }
        );
      });
    });

    describe('copy', function() {
      it('should work', function(done) {
        var api = test(done)
          .post('/createItem?name=nodejs-jenkins-test', assets.job.create)
          .matchHeader('content-type', 'text/xml')
          .reply(200);

        this.jenkins.job.create('nodejs-jenkins-test', assets.job.create, function(err) {
          should.ifError(err);
          api.done();
        });
      });

      it('should return an error if it already exists', function(done) {
        var error = 'A job already exists with the name "nodejs-jenkins-test"';
        var api = test(done)
          .post('/createItem?name=nodejs-jenkins-test', assets.job.create)
          .reply(400, '', { 'x-error': error });

        this.jenkins.job.create('nodejs-jenkins-test', assets.job.create, function(err) {
          should.equal(err.message, 'A job already exists with the name ' +
            '"nodejs-jenkins-test"');
          api.done();
        });
      });
    });

    describe('delete', function() {
      it('should work', function(done) {
        var api = test(done)
                      .post('/job/nodejs-jenkins-test/doDelete')
                      .reply(302);
        this.jenkins.job.delete('nodejs-jenkins-test', function(err) {
          should.ifError(err);
          api.done();
        });
      });

      it('should return error on failure', function(done) {
        var api = test(done)
                      .post('/job/nodejs-jenkins-test/doDelete')
                      .reply(200);
        this.jenkins.job.delete('nodejs-jenkins-test', function(err) {
          should.equal(err.message, 'Failed to delete job: nodejs-jenkins-test');
          api.done();
        });
      });
    });

    describe('disable', function() {
      it('should work', function(done) {
        var api = test(done)
                      .post('/job/nodejs-jenkins-test/disable', '')
                      .reply(302);
        this.jenkins.job.disable('nodejs-jenkins-test', function(err) {
          should.ifError(err);
          api.done();
        });
      });
    });

    describe('enable', function() {
      it('should work', function(done) {
        var api = test(done)
                      .post('/job/nodejs-jenkins-test/enable', '')
                      .reply(302);
        this.jenkins.job.enable('nodejs-jenkins-test', function(err) {
          should.ifError(err);
          api.done();
        });
      });
    });

    describe('exists', function() {
      it('should return true', function(done) {
        var api = test(done)
                      .head('/job/nodejs-jenkins-test/api/json?depth=0')
                      .reply(200);
        this.jenkins.job.exists('nodejs-jenkins-test', function(err, data) {
          should.ifError(err);
          should.strictEqual(data, true);
          api.done();
        });
      });

      it('should return false', function(done) {
        var api = test(done)
                      .head('/job/nodejs-jenkins-test/api/json?depth=0')
                      .reply(404);
        this.jenkins.job.exists('nodejs-jenkins-test', function(err, data) {
          should.ifError(err);
          should.strictEqual(data, false);
          api.done();
        });
      });
    });

    describe('get', function() {
      it('should work', function(done) {
        var api = test(done)
                      .get('/job/nodejs-jenkins-test/api/json?depth=0')
                      .reply(200, assets.job.get);
        this.jenkins.job.get('nodejs-jenkins-test', function(err, data) {
          should.ifError(err);
          should.equal(data.displayName, 'nodejs-jenkins-test');
          api.done();
        });
      });

      it('should work with options', function(done) {
        var api = test(done)
                      .get('/job/nodejs-jenkins-test/api/json?depth=1')
                      .reply(200, assets.job.get);
        this.jenkins.job.get('nodejs-jenkins-test', { depth: 1 }, function(err, data) {
          should.ifError(err);
          should.equal(data.displayName, 'nodejs-jenkins-test');
          api.done();
        });
      });

      it('should return error when not found', function(done) {
        var api = test(done)
                      .get('/job/nodejs-jenkins-test/api/json?depth=0')
                      .reply(404);
        this.jenkins.job.get('nodejs-jenkins-test', function(err, data) {
          should.equal(err.message, 'job nodejs-jenkins-test not found');
          should.ok(!data);
          api.done();
        });
      });
    });

    describe('list', function() {
      it('should work', function(done) {
        var api = test(done)
                      .get('/api/json')
                      .reply(200, assets.get);
        this.jenkins.job.list(function(err, data) {
          should.ifError(err);
          should.equal(data[0].name, 'nodejs-jenkins-test');
          api.done();
        });
      });

      it('should handle corrupt responses', function(done) {
        var data = '"trash';
        var api = test(done)
                      .get('/api/json')
                      .reply(200, data);
        this.jenkins.job.list(function(err) {
          should.equal(err.message, 'job list returned bad data');
          api.done();
        });
      });
    });
  });

  describe('node', function() {
    describe('create', function() {
      it('should work', function(done) {
        var query = {};
        query.name = 'slave';
        query.type = 'hudson.slaves.DumbSlave$DescriptorImpl';
        query.json = JSON.stringify({
          name: query.name,
          nodeDescription: undefined,
          numExecutors: 2,
          remoteFS: '/var/lib/jenkins',
          labelString: undefined,
          mode: 'NORMAL',
          type: query.type,
          retentionStrategy: { 'stapler-class': 'hudson.slaves.RetentionStrategy$Always' },
          nodeProperties: { 'stapler-class-bag': 'true' },
          launcher: { 'stapler-class': 'hudson.slaves.JNLPLauncher' },
        });

        var api = test(done)
          .post('/computer/doCreateItem?' + querystring.stringify(query))
          .reply(302);

        this.jenkins.node.create('slave', function(err) {
          should.ifError(err);
          api.done();
        });
      });
    });

    describe('delete', function() {
      it('should run', function(done) {
        var api = test(done)
                      .post('/computer/slave/doDelete')
                      .reply(302);
        this.jenkins.node.delete('slave', function(err) {
          should.ifError(err);
          api.done();
        });
      });
    });

    describe('disable', function() {
      it('should work', function(done) {
        var api = test(done)
                      .get('/computer/slave/api/json?depth=0')
                      .reply(200, assets.node.slave)
                      .post('/computer/slave/toggleOffline?offlineMessage=test')
                      .reply(302);
        this.jenkins.node.disable('slave', 'test', function(err) {
          should.ifError(err);
          api.done();
        });
      });
    });

    describe('enable', function() {
      it('should work', function(done) {
        var slave = lodash.cloneDeep(assets.node.slave);
        slave.temporarilyOffline = true;
        var api = test(done)
                      .get('/computer/slave/api/json?depth=0')
                      .reply(200, slave)
                      .post('/computer/slave/toggleOffline?offlineMessage=')
                      .reply(302);
        this.jenkins.node.enable('slave', function(err) {
          should.ifError(err);
          api.done();
        });
      });
    });

    describe('exists', function() {
      it('should return true', function(done) {
        var api = test(done)
                      .head('/computer/(master)/api/json?depth=0')
                      .reply(200);
        this.jenkins.node.exists('master', function(err, data) {
          should.ifError(err);
          should.strictEqual(data, true);
          api.done();
        });
      });

      it('should return false', function(done) {
        var api = test(done)
                      .head('/computer/slave/api/json?depth=0')
                      .reply(404);
        this.jenkins.node.exists('slave', function(err, data) {
          should.ifError(err);
          should.strictEqual(data, false);
          api.done();
        });
      });
    });

    describe('get', function() {
      it('should work', function(done) {
        var api = test(done)
                      .get('/computer/(master)/api/json?depth=0')
                      .reply(200, assets.node.get);
        this.jenkins.node.get('master', function(err, data) {
          should.ifError(err);
          should.equal(data.displayName, 'master');
          api.done();
        });
      });
    });

    describe('list', function() {
      it('should work', function(done) {
        var api = test(done)
                      .get('/computer/api/json?depth=0')
                      .reply(200, assets.node.list);
        this.jenkins.node.list(function(err, data) {
          should.ifError(err);
          should.equal(data.computer[0].displayName, 'master');
          api.done();
        });
      });
    });
  });

  describe('queue', function() {
    describe('get', function() {
      it('should work', function(done) {
        var api = test(done)
                      .get('/queue/api/json?depth=0')
                      .reply(200, assets.queue.get);
        this.jenkins.queue.get(function(err, data) {
          should.ifError(err);
          should.equal(data.items[0].why, 'Build #3 is already in progress (ETA:N/A)');
          api.done();
        });
      });

      it('should work with options', function(done) {
        var api = test(done)
                      .get('/queue/api/json?depth=1')
                      .reply(200, assets.queue.get);
        this.jenkins.queue.get({ depth: 1 }, function(err, data) {
          should.ifError(err);
          should.equal(data.items[0].why, 'Build #3 is already in progress (ETA:N/A)');
          api.done();
        });
      });
    });

    describe('cancel', function() {
      it('should work', function(done) {
        var api = test(done)
                      .post('/queue/items/1/cancelQueue', '')
                      .reply(200);
        this.jenkins.queue.cancel(1, function(err) {
          should.ifError(err);
          api.done();
        });
      });

      it('should return error on failure', function(done) {
        var api = test(done)
                      .post('/queue/items/1/cancelQueue', '')
                      .reply(500);
        this.jenkins.queue.cancel(1, function(err) {
          should.ok(err);
          api.done();
        });
      });
    });
  });
});
