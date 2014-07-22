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
 * Tests
 */

describe('jenkins', function() {
  before(function() {
    this.jenkins = jenkins(assets.url + '/');
  });

  it('should get', function(done) {
    nock(assets.url)
      .get('/api/json')
      .reply(200, assets.get);

    this.jenkins.get(function(err, data) {
      should.not.exist(err);

      should(data).have.properties('nodeDescription');

      data.nodeDescription.should.eql('the master Jenkins node');

      done();
    });
  });

  describe('build', function() {
    it('should get', function(done) {
      nock(assets.url)
        .get('/job/nodejs-jenkins-test/1/api/json?depth=0')
        .reply(200, assets.build.get);

      this.jenkins.build.get('nodejs-jenkins-test', 1, function(err, data) {
        should.not.exist(err);

        data.duration.should.equal(138);

        done();
      });
    });

    it('should get with options', function(done) {
      nock(assets.url)
        .get('/job/nodejs-jenkins-test/1/api/json?depth=1')
        .reply(200, assets.build.get);

      this.jenkins.build.get('nodejs-jenkins-test', 1, { depth: 1 }, function(err, data) {
        should.not.exist(err);

        data.duration.should.equal(138);

        done();
      });
    });

    it('should return error when it does not exist', function(done) {
      nock(assets.url)
        .get('/job/nodejs-jenkins-test/2/api/json?depth=0')
        .reply(404);

      this.jenkins.build.get('nodejs-jenkins-test', 2, function(err, data) {
        should.exist(err);
        should.equal(err.message, 'jenkins: build.get: nodejs-jenkins-test 2 not found');

        should.not.exist(data);

        done();
      });
    });

    it('should stop build', function(done) {
      nock(assets.url)
        .get('/job/nodejs-jenkins-test/1/stop')
        .reply(302, assets.url + '/job/nodejs-jenkins-test/1');

      this.jenkins.build.stop('nodejs-jenkins-test', 1, function(err) {
        should.not.exist(err);

        done();
      });
    });
  });

  describe('job', function() {
    describe('build', function() {
      it('should work', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/build')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build('nodejs-jenkins-test', function(err) {
          should.not.exist(err);

          done();
        });
      });

      it('should work with a token', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/build?token=secret')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build('nodejs-jenkins-test', { token: 'secret' }, function(err) {
          should.not.exist(err);

          done();
        });
      });

      it('should work with parameters', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/buildWithParameters?hello=world')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build(
          'nodejs-jenkins-test',
          { parameters: { hello: 'world' } },
          function(err) {
            should.not.exist(err);

            done();
          }
        );
      });

      it('should work with a token and parameters', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/buildWithParameters?hello=world&token=secret')
          .reply(201, assets.url + '/job/nodejs-jenkins-test');

        this.jenkins.job.build(
          'nodejs-jenkins-test',
          { parameters: { hello: 'world' }, token: 'secret' },
          function(err) {
            should.not.exist(err);

            done();
          }
        );
      });
    });

    describe('config', function() {
      it('should return xml', function(done) {
        nock(assets.url)
          .get('/job/nodejs-jenkins-test/config.xml')
          .reply(200, assets.job.create);

        this.jenkins.job.config('nodejs-jenkins-test', function(err, xml) {
          should.not.exist(err);

          xml.should.eql(assets.job.create);

          done();
        });
      });

      it('should update xml', function(done) {
        nock(assets.url)
          .matchHeader('content-type', 'text/xml')
          .post('/job/nodejs-jenkins-test/config.xml', assets.job.update)
          .reply(200);

        this.jenkins.job.config('nodejs-jenkins-test', assets.job.update, function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('copy', function() {
      it('should work', function(done) {
        nock(assets.url)
          .post('/createItem?name=nodejs-jenkins-test-copy&from=' +
                'nodejs-jenkins-test&mode=copy')
          .reply(302);

        this.jenkins.job.copy(
          'nodejs-jenkins-test',
          'nodejs-jenkins-test-copy',
          function(err) {
            should.not.exist(err);

            done();
          }
        );
      });
    });

    describe('create', function() {
      it('should work', function(done) {
        nock(assets.url)
          .post('/createItem?name=nodejs-jenkins-test', assets.job.create)
          .matchHeader('content-type', 'text/xml')
          .reply(200);

        this.jenkins.job.create('nodejs-jenkins-test', assets.job.create, function(err) {
          should.not.exist(err);

          done();
        });
      });

      it('should return an error if it already exists', function(done) {
        var error = 'a job already exists with the name "nodejs-jenkins-test"';

        nock(assets.url)
          .post('/createItem?name=nodejs-jenkins-test', assets.job.create)
          .reply(400, '', { 'x-error': error });

        this.jenkins.job.create('nodejs-jenkins-test', assets.job.create, function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: job.create: a job already exists with the name ' +
                                 '"nodejs-jenkins-test"');

          done();
        });
      });
    });

    describe('delete', function() {
      it('should work', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/doDelete')
          .reply(302);

        this.jenkins.job.delete('nodejs-jenkins-test', function(err) {
          should.not.exist(err);

          done();
        });
      });

      it('should return error on failure', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/doDelete')
          .reply(200);

        this.jenkins.job.delete('nodejs-jenkins-test', function(err) {
          should.exist(err);

          err.message.should.eql('jenkins: job.destroy: failed to delete: nodejs-jenkins-test');

          done();
        });
      });
    });

    describe('disable', function() {
      it('should work', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/disable')
          .reply(302);

        this.jenkins.job.disable('nodejs-jenkins-test', function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('enable', function() {
      it('should work', function(done) {
        nock(assets.url)
          .post('/job/nodejs-jenkins-test/enable')
          .reply(302);

        this.jenkins.job.enable('nodejs-jenkins-test', function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('exists', function() {
      it('should return true', function(done) {
        nock(assets.url)
          .head('/job/nodejs-jenkins-test/api/json?depth=0')
          .reply(200);

        this.jenkins.job.exists('nodejs-jenkins-test', function(err, data) {
          should.not.exist(err);

          data.should.equal(true);

          done();
        });
      });

      it('should return false', function(done) {
        nock(assets.url)
          .head('/job/nodejs-jenkins-test/api/json?depth=0')
          .reply(404);

        this.jenkins.job.exists('nodejs-jenkins-test', function(err, data) {
          should.not.exist(err);

          data.should.equal(false);

          done();
        });
      });
    });

    describe('get', function() {
      it('should work', function(done) {
        nock(assets.url)
          .get('/job/nodejs-jenkins-test/api/json?depth=0')
          .reply(200, assets.job.get);

        this.jenkins.job.get('nodejs-jenkins-test', function(err, data) {
          should.not.exist(err);

          data.displayName.should.eql('nodejs-jenkins-test');

          done();
        });
      });

      it('should work with options', function(done) {
        nock(assets.url)
          .get('/job/nodejs-jenkins-test/api/json?depth=1')
          .reply(200, assets.job.get);

        this.jenkins.job.get('nodejs-jenkins-test', { depth: 1 }, function(err, data) {
          should.not.exist(err);

          data.displayName.should.eql('nodejs-jenkins-test');

          done();
        });
      });

      it('should return error when not found', function(done) {
        nock(assets.url)
          .get('/job/nodejs-jenkins-test/api/json?depth=0')
          .reply(404);

        this.jenkins.job.get('nodejs-jenkins-test', function(err, data) {
          should.exist(err);
          should.equal(err.message, 'jenkins: job.get: nodejs-jenkins-test not found');

          should.not.exist(data);

          done();
        });
      });
    });

    describe('list', function() {
      it('should work', function(done) {
        nock(assets.url)
          .get('/api/json')
          .reply(200, assets.get);

        this.jenkins.job.list(function(err, data) {
          should.not.exist(err);

          should.exist(data);
          should.exist(data[0]);

          data[0].should.have.property('name');
          data[0].name.should.eql('nodejs-jenkins-test');

          done();
        });
      });

      it('should handle corrupt responses', function(done) {
        var data = '"trash';

        nock(assets.url)
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

        nock(assets.url)
          .post('/computer/doCreateItem?' + querystring.stringify(query))
          .reply(302);

        this.jenkins.node.create('slave', function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('delete', function() {
      it('should run', function(done) {
        nock(assets.url)
          .post('/computer/slave/doDelete')
          .reply(302);

        this.jenkins.node.delete('slave', function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('disable', function() {
      it('should work', function(done) {
        nock(assets.url)
          .get('/computer/slave/api/json?depth=0')
          .reply(200, assets.node.slave)
          .post('/computer/slave/toggleOffline?offlineMessage=test')
          .reply(302);

        this.jenkins.node.disable('slave', 'test', function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('enable', function() {
      it('should work', function(done) {
        var slave = lodash.cloneDeep(assets.node.slave);

        slave.temporarilyOffline = true;

        nock(assets.url)
          .get('/computer/slave/api/json?depth=0')
          .reply(200, slave)
          .post('/computer/slave/toggleOffline?offlineMessage=')
          .reply(302);

        this.jenkins.node.enable('slave', function(err) {
          should.not.exist(err);

          done();
        });
      });
    });

    describe('exists', function() {
      it('should return true', function(done) {
        nock(assets.url)
          .head('/computer/(master)/api/json?depth=0')
          .reply(200);

        this.jenkins.node.exists('master', function(err, data) {
          should.not.exist(err);

          data.should.equal(true);

          done();
        });
      });

      it('should return false', function(done) {
        nock(assets.url)
          .head('/computer/slave/api/json?depth=0')
          .reply(404);

        this.jenkins.node.exists('slave', function(err, data) {
          should.not.exist(err);

          data.should.equal(false);

          done();
        });
      });
    });

    describe('get', function() {
      it('should work', function(done) {
        nock(assets.url)
          .get('/computer/(master)/api/json?depth=0')
          .reply(200, assets.node.get);

        this.jenkins.node.get('master', function(err, data) {
          should.not.exist(err);

          should.exist(data);

          data.should.have.property('displayName');
          data.displayName.should.eql('master');

          done();
        });
      });
    });

    describe('list', function() {
      it('should work', function(done) {
        nock(assets.url)
          .get('/computer/api/json?depth=0')
          .reply(200, assets.node.list);

        this.jenkins.node.list(function(err, data) {
          should.not.exist(err);

          data.computer[0].displayName.should.eql('master');

          done();
        });
      });
    });
  });

  describe('queue', function() {
    describe('get', function() {
      it('should work', function(done) {
        nock(assets.url)
          .get('/queue/api/json?depth=0')
          .reply(200, assets.queue.get);

        this.jenkins.queue.get(function(err, data) {
          should.not.exist(err);

          data.items[0].why.should.eql('Build #3 is already in progress (ETA:N/A)');

          done();
        });
      });

      it('should work with options', function(done) {
        nock(assets.url)
          .get('/queue/api/json?depth=1')
          .reply(200, assets.queue.get);

        this.jenkins.queue.get({ depth: 1 }, function(err, data) {
          should.not.exist(err);

          data.items[0].why.should.eql('Build #3 is already in progress (ETA:N/A)');

          done();
        });
      });
    });

    describe('cancel', function() {
      it('should work', function(done) {
        nock(assets.url)
          .post('/queue/items/1/cancelQueue', '')
          .reply(200);

        this.jenkins.queue.cancel(1, function(err) {
          should.not.exist(err);

          done();
        });
      });

      it('should return error on failure', function(done) {
        nock(assets.url)
          .post('/queue/items/1/cancelQueue', '')
          .reply(500);

        this.jenkins.queue.cancel(1, function(err) {
          should.exist(err);

          done();
        });
      });
    });
  });
});
