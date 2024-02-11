# Jenkins

This is a Node.js client for [Jenkins](http://jenkins-ci.org/).

## Documentation

- jenkins: [init](#init), [info](#info)
- build: [get](#build-get), [log](#build-log), [logStream](#build-log-stream), [stop](#build-stop), [term](#build-term)
- credentials: [create](#credentials-create), [exists](#credentials-exists), [get config](#credentials-get-config), [set config](#credentials-set-config), [destroy](#credentials-destroy), [list](#credentials-list)
- job: [build](#job-build), [get config](#job-config-get), [set config](#job-config-set), [copy](#job-config-copy), [create](#job-create), [destroy](#job-destroy), [disable](#job-disable), [enable](#job-enable), [exists](#job-exists), [get](#job-get), [list](#job-list)
- label: [get](#label-get)
- node: [get config](#node-config-get), [create](#node-create), [destroy](#node-destroy), [disconnect](#node-disconnect), [disable](#node-disable), [enable](#node-enable), [exists](#node-exists), [get](#node-get), [list](#node-list)
- plugin: [list](#plugin-list)
- queue: [list](#queue-list), [item](#queue-item), [cancel](#queue-cancel)
- view: [get config](#view-config-get), [set config](#view-config-set), [create](#view-create), [destroy](#view-destroy), [exists](#view-exists), [get](#view-get), [list](#view-list), [add job](#view-add), [remove job](#view-remove)

<a id="common-options"></a>

### Common Options

These options will be passed along with any call, although only certain endpoints support them.

- depth (Number, default: 0): how much data to return (see [depth control](https://wiki.jenkins-ci.org/display/JENKINS/Remote+access+API#RemoteaccessAPI-Depthcontrol))
- tree (String, optional): path expression (see Jenkins API documentation for more information)

<a id="init"></a>

### Jenkins(options)

Initialize a new Jenkins client.

Options

- baseUrl (String): Jenkins URL
- crumbIssuer (Boolean, default: true): enable CSRF Protection support
- formData (Function, optional): enable file upload support on parameterized builds (must pass in `require('form-data')` as value for this option)
- headers (Object, optional): headers included in every request
- and more via [papi](https://github.com/silas/node-papi#client)

Usage

```javascript
import Jenkins from "jenkins";

const jenkins = new Jenkins({
  baseUrl: "http://user:pass@localhost:8080",
});
```

<a id="info"></a>

### jenkins.info(callback)

Get server information.

Usage

```javascript
await jenkins.info();
```

Result

```json
{
  "assignedLabels": [{}],
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

<a id="build-get"></a>

### jenkins.build.get(options)

Get build information.

Options

- name (String): job name
- number (Integer): build number

Usage

```javascript
await jenkins.build.get("example", 1);
```

Result

```json
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

<a id="build-log"></a>

### jenkins.build.log(options)

Get build log.

Options

- name (String): job name
- number (Integer): build number
- start (Integer, optional): start offset
- type (String, enum: text, html, default: text): output format
- meta (Boolean, default: false): return object with text (log data), more (boolean if there is more log data), and size (used with start to offset on subsequent calls)

Usage

```javascript
await jenkins.build.log("example", 1);
```

<a id="build-log-stream"></a>

### jenkins.build.logStream(options)

Get build log stream.

Options

- name (String): job name
- number (Integer): build number
- type (String, enum: text, html, default: text): output format
- delay (Integer, default: 1000): poll interval in milliseconds

Usage

```javascript
const log = jenkins.build.logStream("example", 1);

log.on("data", (text) => {
  process.stdout.write(text);
});

log.on("error", (err) => {
  console.log("error", err);
});

log.on("end", () => {
  console.log("end");
});
```

<a id="build-stop"></a>

### jenkins.build.stop(options)

Stop build.

Options

- name (String): job name
- number (Integer): build number

Usage

```javascript
await jenkins.build.stop("example", 1);
```

<a id="build-term"></a>

### jenkins.build.term(options)

Terminates build.

Options

- name (String): job name
- number (Integer): build number

Usage

```javascript
await jenkins.build.term("example", 1);
```

<a id="credentials-create"></a>

### jenkins.credentials.create(options)

Create credentials in a folder or system.

Options

- folder (String): path of the folder or `manage` for **system** credentials
- store (String): the credentials store, can be either `folder` or `system`
- domain (String): the credentials domain
- xml (String): configuration XML

Usage

```javascript
await jenkins.credentials.create("folder", "store", "domain", "xml");
```

<a id="credentials-exists"></a>

### jenkins.credentials.exists(options)

Check if credentials exist in a folder or system.

Options

- id (String): the id of the credentials
- folder (String): path of the folder or `manage` for **system** credentials
- store (String): the credentials store, can be either `folder` or `system`
- domain (String): the credentials domain

Usage

```javascript
await jenkins.credentials.exists("id", "folder", "store", "domain");
```

<a id="credentials-get-config"></a>

### jenkins.credentials.config(options)

Get XML configuration of credentials.

Options

- id (String): the id of the credentials
- folder (String): path of the folder or `manage` for **system** credentials
- store (String): the credentials store, can be either `folder` or `system`
- domain (String): the credentials domain

Usage

```javascript
await jenkins.credentials.config("id", "folder", "store", "domain");
```

<a id="credentials-set-config"></a>

### jenkins.credentials.config(options)

Update credentials.

Options

- id (String): the id of the credential
- folder (String): path of the folder or `manage` for **system** credentials
- store (String): the credentials store, can be either `folder` or `system`
- domain (String): the credentials domain
- xml (String): configuration XML

Usage

```javascript
await jenkins.credentials.update("id", "folder", "store", "domain", "xml");
```

<a id="credentials-destroy"></a>

### jenkins.credentials.destroy(options)

Delete credentials from folder or system.

Options

- id (String): the id of the credential
- folder (String): path of the folder or `manage` for **system** credentials
- store (String): the credentials store, can be either `folder` or `system`
- domain (String): the credentials domain

Usage

```javascript
await jenkins.credentials.destroy("id", "folder", "store", "domain");
```

<a id="credentials-list"></a>

### jenkins.credentials.list(options)

Get a list of credentials in a folder or system.

Options

- folder (String): path of the folder or `manage` for **system** credentials
- store (String): the credentials store, can be either `folder` or `system`
- domain (String): the credentials domain

Usage

```javascript
await jenkins.credentials.list("folder", "store", "domain");
```

<a id="job-build"></a>

### jenkins.job.build(options)

Trigger build.

Options

- name (String): job name
- parameters (Object, optional): build parameters
- token (String, optional): authorization token

Usage

```javascript
await jenkins.job.build("example");
```

```javascript
await jenkins.job.build({
  name: "example",
  parameters: { name: "value" },
});
```

```javascript
await jenkins.job.build({
  name: "example",
  parameters: { file: fs.createReadStream("test.txt") },
});
```

<a id="job-config-get"></a>

### jenkins.job.config(options)

Get job XML configuration.

Options

- name (String): job name

Usage

```javascript
await jenkins.job.config("example");
```

<a id="job-config-set"></a>

### jenkins.job.config(options)

Update job XML configuration.

Options

- name (String): job name
- xml (String): configuration XML

Usage

```javascript
await jenkins.job.config("example", xml);
```

<a id="job-config-copy"></a>

### jenkins.job.copy(options)

Create job by copying existing job.

Options

- name (String): new job name
- from (String): source job name

Usage

```javascript
await jenkins.job.copy("fromJob", "example");
```

<a id="job-create"></a>

### jenkins.job.create(options)

Create job from scratch.

Options

- name (String): job name
- xml (String): configuration XML

Usage

```javascript
await jenkins.job.create("example", xml);
```

<a id="job-destroy"></a>

### jenkins.job.destroy(options)

Delete job.

Options

- name (String): job name

Usage

```javascript
await jenkins.job.destroy("example");
```

<a id="job-disable"></a>

### jenkins.job.disable(options)

Disable job.

Options

- name (String): job name

Usage

```javascript
await jenkins.job.disable("example");
```

<a id="job-enable"></a>

### jenkins.job.enable(options)

Enable job.

Options

- name (String): job name

Usage

```javascript
await jenkins.job.enable("example");
```

<a id="job-exists"></a>

### jenkins.job.exists(options)

Check job exists.

Options

- name (String): job name

Usage

```javascript
await jenkins.job.exists("example");
```

<a id="job-get"></a>

### jenkins.job.get(options)

Get job information.

Options

- name (String): job name

Usage

```javascript
await jenkins.job.get("example");
```

Result

```json
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

<a id="job-list"></a>

### jenkins.job.list(callback)

List jobs.

Options

- name (String, optional): folder name

Usage

```javascript
await jenkins.job.list();
```

Result

```json
[
  {
    "color": "blue",
    "name": "example",
    "url": "http://localhost:8080/job/example/"
  }
]
```

<a id="label-get"></a>

### jenkins.label.get(options)

Get label information.

Options

- name (String): label name

Usage

```javascript
await jenkins.label.get("master");
```

Result

```json
{
  "_class": "hudson.model.labels.LabelAtom",
  "actions": [],
  "busyExecutors": 0,
  "clouds": [],
  "description": null,
  "idleExecutors": 2,
  "loadStatistics": {
    "_class": "hudson.model.Label$1"
  },
  "name": "master",
  "nodes": [
    {
      "_class": "hudson.model.Hudson",
      "nodeName": ""
    }
  ],
  "offline": false,
  "tiedJobs": [],
  "totalExecutors": 2,
  "propertiesList": []
}
```

<a id="node-config-get"></a>

### jenkins.node.config(options)

Get node XML configuration.

Options

- name (String): node name

Usage

```javascript
await jenkins.node.config("example");
```

<a id="node-create"></a>

### jenkins.node.create(options)

Create node.

Options

- name (String): node name

Usage

```javascript
await jenkins.node.create("node-name");
```

<a id="node-destroy"></a>

### jenkins.node.destroy(options)

Delete node.

Options

- name (String): node name

Usage

```javascript
await jenkins.node.destroy("node-name");
```

<a id="node-disconnect"></a>

### jenkins.node.disconnect(options)

Disconnect node.

Options

- name (String): node name
- message (String, optional): reason for being disconnected

Usage

```javascript
await jenkins.node.disconnect("node-name", "no longer used");
```

<a id="node-disable"></a>

### jenkins.node.disable(options)

Disable node.

Options

- name (String): node name
- message (String, optional): reason for being disabled

Usage

```javascript
await jenkins.node.disable("node-name", "network failure");
```

<a id="node-enable"></a>

### jenkins.node.enable(options)

Enable node.

Options

- name (String): node name

Usage

```javascript
await jenkins.node.enable("node-name");
```

<a id="node-exists"></a>

### jenkins.node.exists(options)

Check node exists.

Options

- name (String): node name

Usage

```javascript
await jenkins.node.exists("node-name");
```

<a id="node-get"></a>

### jenkins.node.get(options)

Get node information.

Options

- name (String): node name

Usage

```javascript
await jenkins.node.get("node-name");
```

Result

```json
{
  "actions": [],
  "displayName": "node-name",
  "executors": [{}, {}],
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

<a id="node-list"></a>

### jenkins.node.list(callback)

List all nodes.

Options

- full (Boolean, default: false): include executor count in response

Usage

```javascript
await jenkins.node.list();
```

Result

```json
{
  "busyExecutors": 0,
  "computer": [
    {
      "actions": [],
      "displayName": "master",
      "executors": [{}, {}],
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
      "displayName": "node-name",
      "executors": [{}, {}],
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

<a id="plugin-list"></a>

### jenkins.plugin.list(callback)

List plugins (note: depth defaults to 1).

Usage

```javascript
await jenkins.plugin.list();
```

Result

```json
[
  {
    "active": true,
    "backupVersion": null,
    "bundled": false,
    "deleted": false,
    "dependencies": [{}, {}, {}, {}, {}, {}, {}, {}],
    "downgradable": false,
    "enabled": true,
    "hasUpdate": false,
    "longName": "Email Extension Plugin",
    "pinned": false,
    "shortName": "email-ext",
    "supportsDynamicLoad": "MAYBE",
    "url": "http://wiki.jenkins-ci.org/display/JENKINS/Email-ext+plugin",
    "version": "2.53"
  }
]
```

<a id="queue-list"></a>

### jenkins.queue.list(callback)

List queues.

Usage

```javascript
await jenkins.queue.list();
```

Result

```json
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

<a id="queue-item"></a>

### jenkins.queue.item(options)

Lookup a queue item.

Options

- number (Integer): queue item number

Usage

```javascript
await jenkins.queue.item(130);
```

Result

```json
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
  "executable": {
    "number": 28,
    "url": "http://localhost:8080/job/test-job-b7ef0845-6515-444c-96a1-d2266d5e0f18/28/"
  }
}
```

<a id="queue-cancel"></a>

### jenkins.queue.cancel(options)

Cancel build in queue.

Options

- number (Integer): queue item id

Usage

```javascript
await jenkins.queue.cancel(23);
```

<a id="view-config-get"></a>

### jenkins.view.config(options)

Get view XML configuration.

Options

- name (String): job name

Usage

```javascript
await jenkins.view.config("example");
```

<a id="view-config-set"></a>

### jenkins.view.config(options)

Update view XML configuration.

Options

- name (String): job name
- xml (String): configuration XML

Usage

```javascript
await jenkins.view.config("example", xml);
```

<a id="view-create"></a>

### jenkins.view.create(options)

Create view.

Options

- name (String): view name
- type (String, enum: list, my): view type

Usage

```javascript
await jenkins.view.create("example", "list");
```

<a id="view-destroy"></a>

### jenkins.view.destroy(options)

Delete view.

Options

- name (String): view name

Usage

```javascript
await jenkins.view.destroy("example");
```

<a id="view-exists"></a>

### jenkins.view.exists(options)

Check view exists.

Options

- name (String): view name

Usage

```javascript
await jenkins.view.exists("example");
```

<a id="view-get"></a>

### jenkins.view.get(options)

Get view information.

Options

- name (String): view name

Usage

```javascript
await jenkins.view.get("example");
```

Result

```json
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

<a id="view-list"></a>

### jenkins.view.list(callback)

List all views.

Usage

```javascript
await jenkins.view.list();
```

Result

```json
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
  "assignedLabels": [{}],
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

<a id="view-add"></a>

### jenkins.view.add(options)

Add job to view.

Options

- name (String): view name
- job (String): job name

Usage

```javascript
await jenkins.view.add("example", "jobExample");
```

<a id="view-remove"></a>

### jenkins.view.remove(options)

Remove job from view.

Options

- name (String): view name
- job (String): job name

Usage

```javascript
await jenkins.view.remove("example", "jobExample");
```

## Test

Run unit tests

```sh
$ npm test
```

Run acceptance tests

```sh
$ docker compose -f test/compose.yml up -d --build
$ npm run acceptance
$ docker compose -f test/compose.yml down
```

## License

This work is licensed under the MIT License (see the LICENSE file).

## Notes

[python-jenkins](https://github.com/openstack/python-jenkins) (BSD License, see NOTES)
was used as a reference when implementing this client and its
create/reconfigure job XML was used in the tests.
