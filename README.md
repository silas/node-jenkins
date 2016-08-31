# Jenkins [![Build Status](https://secure.travis-ci.org/silas/node-jenkins.png?branch=master)](http://travis-ci.org/silas/node-jenkins)

This is a Node.js client for [Jenkins](http://jenkins-ci.org/).

## Documentation

 * jenkins: [init](#init), [info](#info)
 * build: [get](#build-get), [log](#build-log), [logStream](#build-log-stream), [stop](#build-stop)
 * job: [build](#job-build), [get config](#job-config-get), [set config](#job-config-set), [copy](#job-config-copy), [create](#job-create), [destroy](#job-destroy), [disable](#job-disable), [enable](#job-enable), [exists](#job-exists), [get](#job-get), [list](#job-list)
 * node: [get config](#node-config-get), [create](#node-create), [destroy](#node-destroy), [disconnect](#node-disconnect), [disable](#node-disable), [enable](#node-enable), [exists](#node-exists), [get](#node-get), [list](#node-list)
 * queue: [list](#queue-list), [item](#queue-item), [cancel](#queue-cancel)
 * view: [get config](#view-config-get), [set config](#view-config-set), [create](#view-create), [destroy](#view-destroy), [exists](#view-exists), [get](#view-get), [list](#view-list), [add job](#view-add), [remove job](#view-remove)

<a name="promise"></a>
### Promise

Promise support can be enabled by setting `promisify` to `true` in Node `>= 0.12` or passing a wrapper (ex: `bluebird.fromCallback`) in older versions.

<a name="common-options"></a>
### Common Options

These options will be passed along with any call, although only certain endpoints support them.

 * depth (Number, default: 0): how much data to return (see [depth control](https://wiki.jenkins-ci.org/display/JENKINS/Remote+access+API#RemoteaccessAPI-Depthcontrol))
 * tree (String, optional): path expression (see Jenkins API documentation for more information)

<a name="init"></a>
### jenkins([options])

Initialize a new Jenkins client.

Options

 * baseUrl (String): Jenkins URL
 * crumbIssuer (Boolean, default: false): enable CSRF Protection support
 * headers (Object, optional): headers included in every request
 * promisify (Boolean|Function, optional): convert callback methods to promises

Usage

``` javascript
var jenkins = require('jenkins')({ baseUrl: 'http://user:pass@localhost:8080', crumbIssuer: true });
```

<a name="info"></a>
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

<a name="build-get"></a>
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

<a name="build-log"></a>
### jenkins.build.log(options, callback)

Get build log.

Options

* name (String): job name
* number (Integer): build number
* start (Integer, optional): start offset
* type (String, enum: text, html, default: text): output format
* meta (Boolean, default: false): return object with text (log data), more (boolean if there is more log data), and size (used with start to offset on subsequent calls)

Usage

``` javascript
jenkins.build.log('example', 1, function(err, data) {
  if (err) throw err;

  console.log('log', data);
});
```

<a name="build-log-stream"></a>
### jenkins.build.logStream(options, callback)

Get build log stream.

Options

* name (String): job name
* number (Integer): build number
* type (String, enum: text, html, default: text): output format
* delay (Integer, default: 1000): poll interval in milliseconds

Usage

``` javascript
var log = jenkins.build.logStream('example', 1);

log.on('data', function(text) {
  process.stdout.write(text);
});

log.on('error', function(err) {
  console.log('error', err);
});

log.on('end', function() {
  console.log('end');
});
```

<a name="build-stop"></a>
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

<a name="job-build"></a>
### jenkins.job.build(options, callback)

Trigger build.

Options

 * name (String): job name
 * parameters (Object, optional): build parameters
 * token (String, optional): authorization token

Usage

``` javascript
jenkins.job.build('example', function(err, data) {
  if (err) throw err;

  console.log('queue item number', data);
});
```

``` javascript
jenkins.job.build({ name: 'example': parameters: { name: 'value' } }, function(err) {
  if (err) throw err;
});
```

<a name="job-config-get"></a>
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

<a name="job-config-set"></a>
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

<a name="job-config-copy"></a>
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

<a name="job-create"></a>
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

<a name="job-destroy"></a>
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

<a name="job-disable"></a>
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

<a name="job-enable"></a>
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

<a name="job-exists"></a>
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

<a name="job-get"></a>
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

<a name="job-list"></a>
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

<a name="node-config-get"></a>
### jenkins.node.config(options, callback)

Get node XML configuration.

Options

 * name (String): node name

Usage

``` javascript
jenkins.node.config('example', function(err, data) {
  if (err) throw err;

  console.log('xml', data);
});
```

<a name="node-create"></a>
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

<a name="node-destroy"></a>
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

<a name="node-disconnect"></a>
### jenkins.node.disconnect(options, callback)

Disconnect node.

Options

 * name (String): node name
 * message (String, optional): reason for being disconnected

Usage

``` javascript
jenkins.node.disconnect('slave', 'no longer used', function(err) {
  if (err) throw err;
});
```

<a name="node-disable"></a>
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

<a name="node-enable"></a>
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

<a name="node-exists"></a>
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

<a name="node-get"></a>
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

<a name="node-list"></a>
### jenkins.node.list(callback)

List all nodes.

Options

 * full (Boolean, default: false): include executor count in response

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

<a name="queue-list"></a>
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

<a name="queue-item"></a>
### jenkins.queue.item(options, callback)

Lookup a queue item.

Options

 * number (Integer): queue item number

Usage

``` javascript
jenkins.queue.item(130, function(err, data) {
  if (err) throw err;

  console.log('item', data);
});
```

Result

``` json
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
  "blocked": false,
  "buildable": false,
  "id": 130,
  "inQueueSince": 1406363479853,
  "params": "",
  "stuck": false,
  "task": {
    "name": "test-job-b7ef0845-6515-444c-96a1-d2266d5e0f18",
    "url": "http://localhost:8080/job/test-job-b7ef0845-6515-444c-96a1-d2266d5e0f18/",
    "color": "blue"
  },
  "url": "queue/item/130/",
  "why": null,
  "executable" : {
    "number" : 28,
    "url" : "http://localhost:8080/job/test-job-b7ef0845-6515-444c-96a1-d2266d5e0f18/28/"
  }
}
```



<a name="queue-cancel"></a>
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

<a name="view-config-get"></a>
### jenkins.view.config(options, callback)

Get view XML configuration.

Options

 * name (String): job name

Usage

``` javascript
jenkins.view.config('example', function(err, data) {
  if (err) throw err;

  console.log('xml', data);
});
```

<a name="view-config-set"></a>
### jenkins.job.config(options, callback)

Update view XML configuration.

Options

 * name (String): job name
 * xml (String): configuration XML

Usage

``` javascript
jenkins.view.config('example', xml, function(err) {
  if (err) throw err;
});
```

<a name="view-create"></a>
### jenkins.view.create(options, callback)

Create view.

Options

 * name (String): view name
 * type (String, enum: list, my): view type

Usage

``` javascript
jenkins.view.create('example', 'list', function(err) {
  if (err) throw err;
});
```

<a name="view-destroy"></a>
### jenkins.view.destroy(options, callback)

Delete view.

Options

 * name (String): view name

Usage

``` javascript
jenkins.view.destroy('example', function(err) {
  if (err) throw err;
});
```

<a name="view-exists"></a>
### jenkins.view.exists(options, callback)

Check view exists.

Options

 * name (String): view name

Usage

``` javascript
jenkins.view.exists('example', function(err, exists) {
  if (err) throw err;

  console.log('exists', exists);
});
```

<a name="view-get"></a>
### jenkins.view.get(options, callback)

Get view information.

Options

 * name (String): view name

Usage

``` javascript
jenkins.view.get('example', function(err, data) {
  if (err) throw err;

  console.log('view', data);
});
```

Result

``` json
{
  "description": null,
  "jobs": [
    {
      "name": "test",
      "url": "http://localhost:8080/job/example/",
      "color": "blue"
    }
  ],
  "name": "example",
  "property": [],
  "url": "http://localhost:8080/view/example/"
}
```

<a name="view-list"></a>
### jenkins.view.list(callback)

List all views.

Usage

``` javascript
jenkins.view.list(function(err, data) {
  if (err) throw err;

  console.log('views', data);
});
```

Result

``` json
{
  "views": [
    {
      "url": "http://localhost:8080/",
      "name": "All"
    },
    {
      "url": "http://localhost:8080/view/example/",
      "name": "Test"
    }
  ],
  "useSecurity": false,
  "useCrumbs": false,
  "unlabeledLoad": {},
  "slaveAgentPort": 0,
  "quietingDown": false,
  "primaryView": {
    "url": "http://localhost:8080/",
    "name": "All"
  },
  "assignedLabels": [
    {}
  ],
  "mode": "NORMAL",
  "nodeDescription": "the master Jenkins node",
  "nodeName": "",
  "numExecutors": 2,
  "description": null,
  "jobs": [
    {
      "color": "notbuilt",
      "url": "http://localhost:8080/job/example/",
      "name": "test"
    }
  ],
  "overallLoad": {}
}
```

<a name="view-add"></a>
### jenkins.view.add(options, callback)

Add job to view.

Options

 * name (String): view name
 * job (String): job name

Usage

``` javascript
jenkins.view.add('example', 'jobExample', function(err) {
  if (err) throw err;
});
```

<a name="view-remove"></a>
### jenkins.view.remove(options, callback)

Remove job from view.

Options

 * name (String): view name
 * job (String): job name

Usage

``` javascript
jenkins.view.remove('example', 'jobExample', function(err) {
  if (err) throw err;
});
```

## License

This work is licensed under the MIT License (see the LICENSE file).

## Notes

[python-jenkins](https://github.com/openstack/python-jenkins) (BSD License, see NOTES)
was used as a reference when implementing this client and its
create/reconfigure job XML was used in the tests.
