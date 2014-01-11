# Jenkins [![Build Status](https://secure.travis-ci.org/silas/node-jenkins.png?branch=master)](http://travis-ci.org/silas/node-jenkins)

This is a Node.js client for [Jenkins](http://jenkins-ci.org/).

## Installation

``` console
$ npm install jenkins --save
```

## Usage

``` javascript
var jenkins = require('jenkins')('http://user:pass@localhost:8080')

jenkins.job.list(function(err, list) {
    if (err) throw err
    console.log(list)
})
```

## API

### jenkins.get(callback)

Get information about server. The callback gets two arguments `err, data`.

#### Data

``` json
{
    "assignedLabels": [
        {}
    ],
    "description": null,
    "jobs": [],
    "mode": "NORMAL",
    "nodeDescription": "the master Jenkins node",
    "nodeName": "",
    "numExecutors": 2,
    "overallLoad": {},
    "primaryView": {
        "name": "All",
        "url": "http://localhost:8080/"
    },
    "quietingDown": false,
    "slaveAgentPort": 0,
    "unlabeledLoad": {},
    "useCrumbs": false,
    "useSecurity": false,
    "views": [
        {
            "name": "All",
            "url": "http://localhost:8080/"
        }
    ]
}
```

### jenkins.build.get(name, number, [opts], callback)

Get information about build. The callback gets two arguments `err, data`.

#### Data

``` json
{
    "actions": [],
    "buildable": true,
    "builds": [
        {
            "number": 1,
            "url": "http://localhost:8080/job/example/1/"
        }
    ],
    "color": "blue",
    "concurrentBuild": false,
    "description": "",
    "displayName": "example",
    "displayNameOrNull": null,
    "downstreamProjects": [],
    "firstBuild": {
        "number": 1,
        "url": "http://localhost:8080/job/example/1/"
    },
    "healthReport": [
        {
            "description": "Build stability: No recent builds failed.",
            "iconUrl": "health-80plus.png",
            "score": 100
        }
    ],
    "inQueue": false,
    "keepDependencies": false,
    "lastBuild": {
        "number": 1,
        "url": "http://localhost:8080/job/example/1/"
    },
    "lastCompletedBuild": {
        "number": 1,
        "url": "http://localhost:8080/job/example/1/"
    },
    "lastFailedBuild": null,
    "lastStableBuild": {
        "number": 1,
        "url": "http://localhost:8080/job/example/1/"
    },
    "lastSuccessfulBuild": {
        "number": 1,
        "url": "http://localhost:8080/job/example/1/"
    },
    "lastUnstableBuild": null,
    "lastUnsuccessfulBuild": null,
    "name": "example",
    "nextBuildNumber": 2,
    "property": [],
    "queueItem": null,
    "scm": {},
    "upstreamProjects": [],
    "url": "http://localhost:8080/job/example/"
}
```

### jenkins.build.stop(name, number, callback)

Stop build. The callback gets one argument `err`.

### jenkins.job.build(name, opts, callback)

Start build. The callback gets one argument `err`.

### jenkins.job.config(name, callback)

Get job XML configuration. The callback gets two arguments `err, xml`.

### jenkins.job.config(name, xml, callback)

Update job XML configuration. The callback gets one argument `err`.

### jenkins.job.copy(srcName, dstName, callback)

Create job by copying existing job. The callback gets one argument `err`.

#### jenkins.job.create(name, xml, callback)

Create job from scratch. The callback gets one argument `err`.

### jenkins.job.delete(name, callback)

Delete job. The callback gets one argument `err`.

### jenkins.job.disable(name, callback)

Disable job. The callback gets one argument `err`.

### jenkins.job.enable(name, callback)

Enable job. The callback gets one argument `err`.

### jenkins.job.exists(name, callback)

Check for existence of job. The callback gets two arguments `err, exists`.

### jenkins.job.get(name, [opts], callback)

Get information about job. The callback gets two arguments `err, data`.

### jenkins.job.list(callback)

Get list of all jobs. The callback gets two arguments `err, data`.

#### jenkins.node.create(name, [opts], callback)

Create node. The callback gets one argument `err`.

### jenkins.node.delete(name, callback)

Delete node. The callback gets one argument `err`.

### jenkins.node.disable(name, [message], callback)

Disable node. The callback gets one argument `err`.

### jenkins.node.enable(name, callback)

Enable node. The callback gets one argument `err`.

### jenkins.node.exists(name, callback)

Check for existence of node. The callback gets two arguments `err, exists`.

### jenkins.node.get(name, callback)

Get information about node. The callback gets two arguments `err, data`.

### jenkins.node.list(callback)

Get list of all nodes. The callback gets two arguments `err, data`.

### jenkins.queue.get([opts], callback)

Get information about the queue. The callback gets two arguments `err, data`.

### jenkins.queue.cancel(number, callback)

Cancel build in the queue. The callback gets one argument `err`.

## License

This work is licensed under the MIT License (see the LICENSE file).

## Notes

[python-jenkins](https://launchpad.net/python-jenkins) (BSD License, see NOTES)
was used as a reference when implementing this client and its
create/reconfigure job XML was used in the tests.
