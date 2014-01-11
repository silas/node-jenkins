var request = require('request')
  , util = require('util')

function JenkinsError(err, res) {
  this.name = 'JenkinsError'

  if (err instanceof Error) {
    this.message = err.message
  } else {
    this.message = err || 'unknown error'
  }

  if (typeof res === 'object') {
    this.code = res.statusCode
  }

  Error.captureStackTrace(this, JenkinsError)
}
util.inherits(JenkinsError, Error)

//
// error helpers
//

var error = function(message, res) {
  return new JenkinsError(message, res)
}

var jobNotFound = function(name, res) {
  return error('job "' + name + '" does not exist', res)
}

// encode and join path components
var path = function() {
  var args = Array.prototype.slice.call(arguments)
  return '/' + args.map(encodeURIComponent).join('/')
}

module.exports = function(opts) {
  // normalize and validate options
  if (typeof opts === 'string') opts = { url: opts }
  if (typeof opts !== 'object') throw error('opts must be an object')
  if (typeof opts.url !== 'string' || opts.url.length < 1) throw error('url required')
  if (opts.url[opts.url.length-1] === '/') opts.url = opts.url.substring(0, opts.url.length-1)

  // create api object, this is what the users gets when calling the module
  var api = { Error: JenkinsError, url: opts.url }

  // allow user to pass in default request
  var defaultRequest = opts.request || request

  // api.request is used for making http requests to jenkins
  api.request = function(path, opts, cb) {
    if (typeof opts === 'function') { cb = opts; opts = {} }

    // setup opts

    var defaults = function(name, value) {
      if (!opts.hasOwnProperty(name)) {
        opts[name] = value
      }
    }
    defaults('url', api.url + path)

    if (opts.hasOwnProperty('body')) {
      opts.method = 'POST'
    } else {
      opts.method = 'GET'
      defaults('json', true)
    }

    opts.headers = opts.headers || {}
    opts.headers.referer = api.url + '/'

    // make request and handle common errors
    defaultRequest(opts, function(err, res) {
      if (err) return cb(error(err, res))
      if ([401, 403, 500].indexOf(res.statusCode) >= 0) {
        return cb(error('Request failed, possibly authentication issue (' +
                  res.statusCode + ')', res))
      }
      cb(err, res)
    })
  }

  //
  // general
  //

  api.get = function(cb) {
    api.request('/api/json', function(err, res) {
      if (err) return cb(err)
      cb(null, res.body)
    })
  }

  //
  // build
  //

  api.build = {}

  api.build.get = function(name, number, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }
    opts.depth = opts.depth || 0
    var p = path('job', name, number, 'api', 'json')
      , o = { qs: { depth: opts.depth } }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      if (res.statusCode == 404) {
        return cb(error('job "' + name + '" build "' + number +
                  '" does not exist', res))
      }
      cb(null, res.body)
    })
  }

  api.build.stop = function(name, number, cb) {
    api.request(path('job', name, number, 'stop'), function(err) {
      if (err) return cb(err)
      cb()
    })
  }

  //
  // job
  //

  api.job = {}

  api.job.build = function(name, opts, cb) {
    if (typeof opts === 'function') { cb = opts; opts = null }
    opts = opts || {}
    var p = path('job', name) + '/build'
      , o = {}
    if (opts.parameters) {
      o.qs = opts.parameters
      p += 'WithParameters'
    }
    if (opts.token) {
      if (o.qs) {
        o.qs.token = opts.token
      } else {
        o.qs = { token: opts.token }
      }
    }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      if (res.statusCode == 404) return cb(jobNotFound(name, res))
      cb()
    })
  }

  api.job.config = function(name, xml, cb) {
    var p = path('job', name, 'config.xml')
    if (typeof xml === 'function') {
      cb = xml
      api.request(p, function(err, res) {
        if (err) return cb(err)
        if (res.statusCode == 404) return cb(jobNotFound(name, res))
        cb(null, res.body)
      })
    } else {
      var o = {
        headers: { 'content-type': 'text/xml' },
        body: xml,
      }
      api.request(p, o, function(err, res) {
        if (err) return cb(err)
        if (res.statusCode == 404) return cb(jobNotFound(name, res))
        cb()
      })
    }
  }

  api.job.copy = function(srcName, dstName, cb) {
    api.job.get(srcName, function(err) {
      if (err) return cb(err)
      var o = {
        headers: { 'content-type': 'text/xml' },
        qs: { name: dstName, from: srcName, mode: 'copy' },
      }
      api.request('/createItem', o, function(err, res) {
        if (err) return cb(err)
        api.job.exists(dstName, function(err, exists) {
          if (err) return cb(err)
          if (!exists) return cb(error('create "' + dstName + '" failed'))
          cb()
        })
      })
    })
  }

  api.job.create = function(name, xml, cb) {
    api.job.exists(name, function(err, exists) {
      if (err) return cb(err)
      if (exists) return cb(error('job "' + name + '" already exists'))
      var o = {
        headers: { 'content-type': 'text/xml' },
        body: xml,
        qs: { name: name },
      }
      api.request('/createItem', o, function(err, res) {
        if (err) return cb(err)
        api.job.exists(name, function(err, exists) {
          if (err) return cb(err)
          if (!exists) return cb(error('create "' + name + '" failed'))
          cb()
        })
      })
    })
  }

  api.job.delete = function(name, cb) {
    var p = path('job', name, 'doDelete')
      , o = { body: '' }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      api.job.exists(name, function(err, exists) {
        if (err) return cb(err)
        if (exists) return cb(error('delete "' + name + '" failed'))
        cb()
      })
    })
  }

  api.job.disable = function(name, cb) {
    var p = path('job', name, 'disable')
      , o = { body: '' }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      cb()
    })
  }

  api.job.enable = function(name, cb) {
    var p = path('job', name, 'enable')
      , o = { body: '' }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      cb()
    })
  }

  api.job.exists = function(name, cb) {
    api.job.get(name, function(err) {
      if (err) {
        if (err.code == 404) return cb(null, false)
        cb(err)
      } else {
        cb(null, true)
      }
    })
  }

  api.job.get = function(name, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }
    opts.depth = opts.depth || 0
    var p = path('job', name, 'api', 'json')
      , o = { qs: { depth: opts.depth } }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      if (res.statusCode == 404) return cb(jobNotFound(name, res))
      cb(null, res.body)
    })
  }

  api.job.list = function(cb) {
    api.get(function(err, data) {
      if (err) return cb(err)
      cb(null, data.jobs)
    })
  }

  //
  // node
  //

  api.node = {}

  api.node.create = function(name, opts, cb) {
    opts = opts || {}
    cb(error('not implemented'))
  }

  api.node.delete = function(name, cb) {
    cb(error('not implemented'))
  }

  api.node.disable = function(name, message, cb) {
    if (typeof message === 'function') {
      cb = message
      message = ''
    }
    cb(error('not implemented'))
  }

  api.node.enable = function(name, cb) {
    cb(error('not implemented'))
  }

  api.node.exists = function(name, cb) {
    cb(error('not implemented'))
  }

  api.node.get = function(name, cb) {
    cb(error('not implemented'))
  }

  //
  // queue
  //

  api.queue = {}

  api.queue.get = function(opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }
    opts.depth = opts.depth || 0
    var p = path('queue', 'api', 'json')
      , o = { qs: { depth: opts.depth } }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      cb(null, res.body)
    })
  }

  api.queue.cancel = function(number, cb) {
    var p = path('queue', 'items', number, 'cancelQueue')
      , o = { body: '' }
    api.request(p, o, function(err) {
      if (err) return cb(err)
      cb()
    })
  }

  return api
}
