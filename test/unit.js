var assert = require('assert')
  , nock = require('nock')
  , assets = require('./assets')
  , jenkins = require('../jenkins')(assets.url + '/')

var test = function(done) {
  var n = nock(assets.url)
  if (done) {
    var nDone = n.done
    n.done = function() {
      nDone()
      done()
    }
  }
  return n
}

describe('jenkins', function() {

  describe('initialize', function() {
    it('should normalize url', function() {
      assert.equal(jenkins.url, assets.url)
    })
  })

  describe('request', function() {
    it('should get', function(done) {
      var api = test(done)
                    .matchHeader('accept', 'application/json')
                    .matchHeader('referer', assets.url + '/')
                    .get('/test')
                    .reply(404)
      jenkins.request('/test', function(err, res) {
        assert.equal(res.statusCode, 404)
        api.done()
      })
    })

    it('should post', function(done) {
      var api = test(done)
                    .matchHeader('referer', assets.url + '/')
                    .post('/test', 'something')
                    .reply(202)
      jenkins.request('/test', { body: 'something' }, function(err, res) {
        assert.equal(res.statusCode, 202)
        api.done()
      })
    })

    var testRequestCode = function(code) {
      return function(done) {
        var api = test(done)
                      .get('/test')
                      .reply(code)
        jenkins.request('/test', function(err, res) {
          assert.ok(err instanceof jenkins.Error)
          assert.equal(err.code, code)
          assert.equal(err.message, 'Request failed, possibly authentication ' +
                       'issue (' + code + ')')
          api.done()
        })
      }
    }
    it('should return error on 401', testRequestCode(401))
    it('should return error on 403', testRequestCode(403))
    it('should return error on 500', testRequestCode(500))
  })

  it('should get', function(done) {
    var api = test(done)
                  .get('/api/json')
                  .reply(200, assets.get)
    jenkins.get(function(err, data) {
      assert.ifError(err)
      assert.equal(data.nodeDescription, 'the master Jenkins node')
      api.done()
    })
  })

  describe('build', function() {
    it('should get', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/1/api/json?depth=0')
                    .reply(200, assets.build.get)
      jenkins.build.get('nodejs-jenkins-test', 1, function(err, data) {
        assert.ifError(err)
        assert.equal(data.duration, 138)
        api.done()
      })
    })

    it('should return error on 404', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/2/api/json?depth=0')
                    .reply(404)
      jenkins.build.get('nodejs-jenkins-test', 2, function(err, data) {
        assert.ok(err instanceof jenkins.Error)
        assert.equal(err.message, 'job "nodejs-jenkins-test" build "2" does not exist')
        assert.ok(!data)
        api.done()
      })
    })

    it('should stop', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/1/stop')
                    .reply(302, assets.url + '/job/nodejs-jenkins-test/1')
      jenkins.build.stop('nodejs-jenkins-test', 1, function(err) {
        assert.ifError(err)
        api.done()
      })
    })
  })

  describe('job', function() {
    it('should build', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/build')
                    .reply(302, assets.url + '/job/nodejs-jenkins-test')
      jenkins.job.build('nodejs-jenkins-test', function(err) {
        assert.ifError(err)
        api.done()
      })
    })

    it('should build with token', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/build?token=secret')
                    .reply(302, assets.url + '/job/nodejs-jenkins-test')
      jenkins.job.build('nodejs-jenkins-test', { token: 'secret' }, function(err) {
        assert.ifError(err)
        api.done()
      })
    })

    it('should build with parameters', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/buildWithParameters?hello=world')
                    .reply(302, assets.url + '/job/nodejs-jenkins-test')
      jenkins.job.build('nodejs-jenkins-test', { parameters: { hello: 'world' } }, function(err) {
        assert.ifError(err)
        api.done()
      })
    })

    it('should build with token and parameters', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/buildWithParameters?hello=world&token=secret')
                    .reply(302, assets.url + '/job/nodejs-jenkins-test')
      jenkins.job.build('nodejs-jenkins-test', { parameters: { hello: 'world' }, token: 'secret' }, function(err) {
        assert.ifError(err)
        api.done()
      })
    })

    it('should return config', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/config.xml')
                    .reply(200, assets.job.create)
      jenkins.job.config('nodejs-jenkins-test', function(err, xml) {
        assert.ifError(err)
        assert.equal(xml, assets.job.create)
        api.done()
      })
    })

    it('should update config', function(done) {
      var api = test(done)
                    .matchHeader('content-type', 'text/xml')
                    .post('/job/nodejs-jenkins-test/config.xml', assets.job.update)
                    .reply(200)
      jenkins.job.config('nodejs-jenkins-test', assets.job.update, function(err, xml) {
        assert.ifError(err)
        api.done()
      })
    })

    it('should copy', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/api/json?depth=0')
                    .reply(200)
                    .get('/createItem?name=nodejs-jenkins-test-copy&from=nodejs-jenkins-test&mode=copy')
                    .reply(200)
                    .get('/job/nodejs-jenkins-test-copy/api/json?depth=0')
                    .reply(200)
      jenkins.job.copy('nodejs-jenkins-test', 'nodejs-jenkins-test-copy', function(err) {
        assert.ifError(err)
        api.done()
      })
    })

    it('should create', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/api/json?depth=0')
                    .reply(404)
                    .post('/createItem?name=nodejs-jenkins-test', assets.job.create)
                    .matchHeader('content-type', 'text/xml')
                    .reply(200)
                    .get('/job/nodejs-jenkins-test/api/json?depth=0')
                    .reply(200)
      jenkins.job.create('nodejs-jenkins-test', assets.job.create, function(err) {
        assert.ifError(err)
        api.done()
      })
    })

    it('should not create if already exists', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/api/json?depth=0')
                    .reply(200)
      jenkins.job.create('nodejs-jenkins-test', assets.job.create, function(err) {
        assert.ok(err instanceof jenkins.Error)
        assert.equal(err.message, 'job "nodejs-jenkins-test" already exists')
        api.done()
      })
    })

    it('should return error when create fails', function(done) {
      var api = test(done)
                    .get('/job/nodejs-jenkins-test/api/json?depth=0')
                    .reply(404)
                    .post('/createItem?name=nodejs-jenkins-test', assets.job.create)
                    .matchHeader('content-type', 'text/xml')
                    .reply(200)
                    .get('/job/nodejs-jenkins-test/api/json?depth=0')
                    .reply(404)
      jenkins.job.create('nodejs-jenkins-test', assets.job.create, function(err) {
        assert.ok(err instanceof jenkins.Error)
        assert.equal(err.message, 'create "nodejs-jenkins-test" failed')
        api.done()
      })
    })
  })
})
