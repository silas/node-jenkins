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

var error = function(message, opts) {
  return new JenkinsError(message, opts)
}

var path = function() {
  var args = Array.prototype.slice.call(arguments)
  return '/' + args.map(encodeURIComponent).join('/')
}

module.exports = function(url) {
  var api = { Error: JenkinsError }

  if (typeof url !== 'string' || url.length < 1) {
    throw error('url required')
  }

  if (url[url.length-1] === '/') {
    url = url.substring(0, url.length-1)
  }

  api.request = function(path, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = {}
    }
    var defaults = function(name, value) {
      if (!opts.hasOwnProperty(name)) {
        opts[name] = value
      }
    }
    defaults('url', url + path)

    if (opts.hasOwnProperty('body')) {
      opts.method = 'POST'
    } else {
      opts.method = 'GET'
      defaults('json', true)
    }

    request(opts, function(err, res) {
      if (err) return cb(error(err, res))
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

  api.build.get = function(name, number) {
    var p = path('job', name, number, 'api', 'json')
      , opts = { qs: { depth: 0 } }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      if (res.statusCode == 404) {
        return cb(error('job "' + name + '" build "' + number +
                  '" does not exist'), res)
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
    if (typeof opts === 'function') {
      cb = opts
      opts = null
    }
    opts = opts || {}
    var p = path('job', name) + '/build'
      , l = Object.keys(opts).length
    if (l > 1 || (l > 0 && !opts.hasOwnProperty('token'))) {
      path += 'WithParameters'
    }
    api.job.get(name, function(err) {
      if (err) return cb(err)
      api.request(p, opts, function(err) {
        if (err) return cb(err)
        cb()
      })
    })
  }

  api.job.config = function(name, xml, cb) {
    var p = path('job', name, 'config.xml')
    if (typeof xml === 'function') {
      cb = xml
      api.request(p, function(err, res) {
        if (err) return cb(err)
        cb(null, res.body)
      })
    } else {
      var o = {
        headers: {
          'content-type': 'text/xml'
        },
        body: xml,
      }
      api.request(p, o, function(err) {
        if (err) return cb(err)
        cb()
      })
    }
  }

  api.job.copy = function(srcName, dstName, cb) {
    api.job.get(srcName, function(err) {
      if (err) return cb(err)
      var o = {
        qs: {
          name: dstName,
          from: srcName,
          mode: 'copy',
        },
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

  api.job.get = function(name, cb) {
    var p = path('job', name, 'api', 'json')
      , o = { qs: { depth: 0 } }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      if (res.statusCode == 404) {
        return cb(error('job "' + name + '" does not exist', res))
      }
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

  api.queue.get = function(cb) {
    var p = path('queue', 'api', 'json')
      , o = { qs: { depth: 0 } }
    api.request(p, o, function(err, res) {
      if (err) return cb(err)
      cb(null, res.body)
    })
  }

  api.queue.cancel = function(number, cb) {
    var p = path('queue', 'item', number, 'cancelQueue')
      , o = { headers: { 'referer': api.url + '/' } }
    api.request(p, o, function(err) {
      if (err) return cb(err)
      if (res.statusCode == 404) {
        return cb(error('queue "' + number + '" does not exist'), res)
      }
      cb()
    })
  }

  return api
}
