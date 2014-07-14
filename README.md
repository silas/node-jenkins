# Jenkins [![Build Status](https://secure.travis-ci.org/silas/node-jenkins.png?branch=master)](http://travis-ci.org/silas/node-jenkins)

This is a Node.js client for [Jenkins](http://jenkins-ci.org/).

<a name="init"/>
### jenkins([options])

Initialize a new Jenkins client.

Options

 * baseUrl (String): Jenkins URL
 * headers (Object, optional): headers included in every request

Usage

``` javascript
var jenkins = require('jenkins')('http://user:pass@localhost:8080');
```

### jenkins.info(callback)

Get server information.

Usage

``` javascript
jenkins.info(function(err, data) {
  if (err) throw err;

  console.log('info', data);
});
```

Result

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

### jenkins.build.get(options, callback)

Get build information.

Options

 * name (String): job name
 * number (Integer): build number

Usage

``` javascript
jenkins.build.get('example', 1, function(err, data) {
  if (err) throw err;

  console.log('build', data);
});
```

Result

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

### jenkins.build.stop(options, callback)

Stop build.

Options

 * name (String): job name
 * number (Integer): build number

Usage

``` javascript
jenkins.build.stop('example', 1, function(err) {
  if (err) throw err;
});
```

### jenkins.job.build(options, callback)

Trigger build.

Options

 * name (String): job name

Usage

``` javascript
jenkins.job.build('example', function(err) {
  if (err) throw err;
});
```

### jenkins.job.config(options, callback)

Get job XML configuration.

Options

 * name (String): job name

Usage

``` javascript
jenkins.job.config('example', function(err, data) {
  if (err) throw err;

  console.log('xml', data);
});
```

### jenkins.job.config(options, callback)

Update job XML configuration.

Options

 * name (String): job name
 * xml (String): configuration XML

Usage

``` javascript
jenkins.job.config('example', xml, function(err) {
  if (err) throw err;
});
```

### jenkins.job.copy(options, callback)

Create job by copying existing job.

Options

 * name (String): new job name
 * from (String): source job name

Usage

``` javascript
jenkins.job.copy('fromJob', 'example', function(err) {
  if (err) throw err;
});
```

### jenkins.job.create(options, callback)

Create job from scratch.

Options

 * name (String): job name
 * xml (String): configuration XML

Usage

``` javascript
jenkins.job.create('example', xml, function(err) {
  if (err) throw err;
});
```

### jenkins.job.destroy(options, callback)

Delete job.

Options

 * name (String): job name

Usage

``` javascript
jenkins.job.destroy('example', function(err) {
  if (err) throw err;
});
```

### jenkins.job.disable(options, callback)

Disable job.

Options

 * name (String): job name

Usage

``` javascript
jenkins.job.disable('example', function(err) {
  if (err) throw err;
});
```

### jenkins.job.enable(options, callback)

Enable job.

Options

 * name (String): job name

Usage

``` javascript
jenkins.job.enable('example', function(err) {
  if (err) throw err;
});
```

### jenkins.job.exists(options, callback)

Check job exists.

Options

 * name (String): job name

Usage

``` javascript
jenkins.job.exists('example', function(err, exists) {
  if (err) throw err;

  console.log('exists', exists);
});
```

### jenkins.job.get(options, callback)

Get job information.

Options

 * name (String): job name

Usage

``` javascript
jenkins.job.get('example', function(err, data) {
  if (err) throw err;

  console.log('job', data);
});
```

Result

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

List all jobs.

Usage

``` javascript
jenkins.job.list(function(err, data) {
  if (err) throw err;

  console.log('jobs', data);
});
```

Result

``` json
[
  {
    "color": "blue",
    "name": "example",
    "url": "http://localhost:8080/job/example/"
  }
]
```

### jenkins.node.create(options, callback)

Create node.

Options

 * name (String): node name

Usage

``` javascript
jenkins.node.create('slave', function(err) {
  if (err) throw err;
});
```

### jenkins.node.destroy(options, callback)

Delete node.

Options

 * name (String): node name

Usage

``` javascript
jenkins.node.destroy('slave', function(err) {
  if (err) throw err;
});
```

### jenkins.node.disable(options, callback)

Disable node.

Options

 * name (String): node name
 * message (String, optional): reason for being disabled

Usage

``` javascript
jenkins.node.disable('slave', 'network failure', function(err) {
  if (err) throw err;
});
```

### jenkins.node.enable(options, callback)

Enable node.

Options

 * name (String): node name

Usage

``` javascript
jenkins.node.enable('slave', function(err) {
  if (err) throw err;
});
```

### jenkins.node.exists(options, callback)

Check node exists.

Options

 * name (String): node name

Usage

``` javascript
jenkins.node.exists('slave', function(err, exists) {
  if (err) throw err;

  console.log('exists', exists);
});
```

### jenkins.node.get(options, callback)

Get node information.

Options

 * name (String): node name

Usage

``` javascript
jenkins.node.get('slave', function(err, data) {
  if (err) throw err;

  console.log('node', data);
});
```

Result

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

List all nodes.

Usage

``` javascript
jenkins.node.list(function(err, data) {
  if (err) throw err;

  console.log('nodes', data);
});
```

Result

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

### jenkins.queue.list(callback)

List queues.

Usage

``` javascript
jenkins.queue.list(function(err, data) {
  if (err) throw err;

  console.log('queues', data);
});
```

Result

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

### jenkins.queue.cancel(options, callback)

Cancel build in queue.

Options

 * number (Integer): queue item id

Usage

``` javascript
jenkins.queue.cancel(23, function(err) {
  if (err) throw err;
});
```

## License

This work is licensed under the MIT License (see the LICENSE file).

## Notes

[python-jenkins](https://launchpad.net/python-jenkins) (BSD License, see NOTES)
was used as a reference when implementing this client and its
create/reconfigure job XML was used in the tests.
