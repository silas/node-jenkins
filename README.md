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

### jenkins.info(callback)

Get server information. The callback gets two arguments `err, data`.

#### Data

``` json
{
    "assignedLabels": [
        {}
    ],
    "description": null,
    "jobs": [
        {
            "color": "blue",
            "name": "example",
            "url": "http://localhost:8080/job/example/"
        }
    ],
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
    "slaveAgentPort": 12345,
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

Get build information. The callback gets two arguments `err, data`.

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

### jenkins.job.build(name, [opts], callback)

Start build. The callback gets one argument `err`.

### jenkins.job.config(name, callback)

Get job XML configuration. The callback gets two arguments `err, xml`.

### jenkins.job.config(name, xml, callback)

Update job XML configuration. The callback gets one argument `err`.

### jenkins.job.copy(srcName, dstName, callback)

Create job by copying existing job. The callback gets one argument `err`.

### jenkins.job.create(name, xml, callback)

Create job from scratch. The callback gets one argument `err`.

### jenkins.job.destroy(name, callback)

Delete job. The callback gets one argument `err`.

### jenkins.job.disable(name, callback)

Disable job. The callback gets one argument `err`.

### jenkins.job.enable(name, callback)

Enable job. The callback gets one argument `err`.

### jenkins.job.exists(name, callback)

Check job exists. The callback gets two arguments `err, exists`.

### jenkins.job.get(name, [opts], callback)

Get job information. The callback gets two arguments `err, data`.

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

### jenkins.job.list(callback)

List all jobs. The callback gets two arguments `err, data`.

#### Data

``` json
[
    {
        "color": "blue",
        "name": "example",
        "url": "http://localhost:8080/job/example/"
    }
]
```

### jenkins.node.create(name, [opts], callback)

Create node. The callback gets one argument `err`.

### jenkins.node.destroy(name, callback)

Delete node. The callback gets one argument `err`.

### jenkins.node.disable(name, [message], callback)

Disable node. The callback gets one argument `err`.

### jenkins.node.enable(name, callback)

Enable node. The callback gets one argument `err`.

### jenkins.node.exists(name, callback)

Check node exists. The callback gets two arguments `err, exists`.

### jenkins.node.get(name, callback)

Get node information. The callback gets two arguments `err, data`.

#### Data

``` json
{
    "actions": [],
    "displayName": "slave",
    "executors": [
        {},
        {}
    ],
    "icon": "computer-x.png",
    "idle": true,
    "jnlpAgent": true,
    "launchSupported": false,
    "loadStatistics": {},
    "manualLaunchAllowed": true,
    "monitorData": {
        "hudson.node_monitors.ArchitectureMonitor": null,
        "hudson.node_monitors.ClockMonitor": null,
        "hudson.node_monitors.DiskSpaceMonitor": null,
        "hudson.node_monitors.ResponseTimeMonitor": {
            "average": 5000
        },
        "hudson.node_monitors.SwapSpaceMonitor": null,
        "hudson.node_monitors.TemporarySpaceMonitor": null
    },
    "numExecutors": 2,
    "offline": true,
    "offlineCause": null,
    "offlineCauseReason": "",
    "oneOffExecutors": [],
    "temporarilyOffline": false
}
```

### jenkins.node.list(callback)

List all nodes. The callback gets two arguments `err, data`.

#### Data

``` json
{
    "busyExecutors": 0,
    "computer": [
        {
            "actions": [],
            "displayName": "master",
            "executors": [
                {},
                {}
            ],
            "icon": "computer.png",
            "idle": true,
            "jnlpAgent": false,
            "launchSupported": true,
            "loadStatistics": {},
            "manualLaunchAllowed": true,
            "monitorData": {
                "hudson.node_monitors.ArchitectureMonitor": "Linux (amd64)",
                "hudson.node_monitors.ClockMonitor": {
                    "diff": 0
                },
                "hudson.node_monitors.DiskSpaceMonitor": {
                    "path": "/var/lib/jenkins",
                    "size": 77620142080
                },
                "hudson.node_monitors.ResponseTimeMonitor": {
                    "average": 0
                },
                "hudson.node_monitors.SwapSpaceMonitor": {
                    "availablePhysicalMemory": 22761472,
                    "availableSwapSpace": 794497024,
                    "totalPhysicalMemory": 515358720,
                    "totalSwapSpace": 805302272
                },
                "hudson.node_monitors.TemporarySpaceMonitor": {
                    "path": "/tmp",
                    "size": 77620142080
                }
            },
            "numExecutors": 2,
            "offline": false,
            "offlineCause": null,
            "offlineCauseReason": "",
            "oneOffExecutors": [],
            "temporarilyOffline": false
        },
        {
            "actions": [],
            "displayName": "slave",
            "executors": [
                {},
                {}
            ],
            "icon": "computer-x.png",
            "idle": true,
            "jnlpAgent": true,
            "launchSupported": false,
            "loadStatistics": {},
            "manualLaunchAllowed": true,
            "monitorData": {
                "hudson.node_monitors.ArchitectureMonitor": null,
                "hudson.node_monitors.ClockMonitor": null,
                "hudson.node_monitors.DiskSpaceMonitor": null,
                "hudson.node_monitors.ResponseTimeMonitor": {
                    "average": 5000
                },
                "hudson.node_monitors.SwapSpaceMonitor": null,
                "hudson.node_monitors.TemporarySpaceMonitor": null
            },
            "numExecutors": 2,
            "offline": true,
            "offlineCause": null,
            "offlineCauseReason": "",
            "oneOffExecutors": [],
            "temporarilyOffline": false
        }
    ],
    "displayName": "nodes",
    "totalExecutors": 2
}
```

### jenkins.queue.list([opts], callback)

List queues. The callback gets two arguments `err, data`.

#### Data

``` json
{
    "items": [
        {
            "actions": [
                {
                    "causes": [
                        {
                            "shortDescription": "Started by user anonymous",
                            "userId": null,
                            "userName": "anonymous"
                        }
                    ]
                }
            ],
            "blocked": true,
            "buildable": false,
            "buildableStartMilliseconds": 1389418977387,
            "id": 20,
            "inQueueSince": 1389418977358,
            "params": "",
            "stuck": false,
            "task": {
                "color": "blue_anime",
                "name": "example",
                "url": "http://localhost:8080/job/example/"
            },
            "url": "queue/item/20/",
            "why": "Build #2 is already in progress (ETA:N/A)"
        }
    ]
}
```

### jenkins.queue.cancel(number, callback)

Cancel build in queue. The callback gets one argument `err`.

## License

This work is licensed under the MIT License (see the LICENSE file).

## Notes

[python-jenkins](https://launchpad.net/python-jenkins) (BSD License, see NOTES)
was used as a reference when implementing this client and its
create/reconfigure job XML was used in the tests.
