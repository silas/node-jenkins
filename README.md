# Jenkins [![Build Status](https://secure.travis-ci.org/silas/node-jenkins.png?branch=master)](http://travis-ci.org/silas/node-jenkins)

This is a Node.js client for [Jenkins](http://jenkins-ci.org/).

## Installation

    npm install jenkins

## Usage

    var jenkins = require('jenkins')('http://user:pass@localhost:8080')

    jenkins.job.list(function(err, list) {
        if (err) throw err
        console.log(list)
    })

## API

    jenkins.get(cb)

Retrieves general information about your Jenkins server. Your callback should accept the parameters: error, response.

    jenkins.build.get(name, number, [opts], cb)

Retrieves information about a build. Your callback should accept the parameters: error, response.

    jenkins.build.stop(name, number, cb)

Stops a build. Your callback should accept the parameters: error.

    jenkins.job.build(name, opts, cb)

Starts a build. Your callback should accept the parameters: error.

    jenkins.job.config(name, cb)

Retrieves Jenkins XML configuration for a job. Your callback should accept the parameters: error, response.

    jenkins.job.config(name, xml, cb)

Updates a job's configuration. Your callback should accept the parameters: error.

    jenkins.job.copy(srcName, dstName, cb)

Creates a new job by copying an existing job. Your callback should accept the parameters: error.

    jenkins.job.create(name, xml, cb)

Creates a new job from scratch. Your callback should accept the parameters: error.

    jenkins.job.delete(name, cb)

Deletes a job. Your callback should accept the parameters: error.

    jenkins.job.disable(name, cb)

Disables a job. Your callback should accept the parameters: error.

    jenkins.job.enable(name, cb)

Enables a job. Your callback should accept the parameters: error.

    jenkins.job.exists(name, cb)

Checks for the existence of a job. Your callback should accept the parameters: error, exists.

    jenkins.job.get(name, [opts], cb)

Retrieves information about a job. Your callback should accept the parameters: error, response.

    jenkins.job.list(cb)

Retrieves a list of all jobs. Your callback should accept the parameters: error, response.

    jenkins.queue.get([opts], cb)

Retrieves information about the queue. Your callback should accept the parameters: error, response.

    jenkins.queue.cancel(number, cb)

Cancels a build in the queue. Your callback should accept the parameters: error.

## License

This work is licensed under the MIT License (see the LICENSE file).

## Notes

[python-jenkins](https://launchpad.net/python-jenkins) (BSD License, see NOTES)
was used as a reference when implementing this client and its
create/reconfigure job XML was used in the tests.
