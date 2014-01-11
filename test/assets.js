exports.job = "nodejs-jenkins-test"
exports.url = "http://localhost:8080"

exports.get = {
  "assignedLabels": [{}],
  "mode": "NORMAL",
  "nodeDescription": "the master Jenkins node",
  "nodeName": "",
  "numExecutors": 2,
  "description": null,
  "jobs": [
    {
      "name": "nodejs-jenkins-test",
      "url": "http://localhost:8080/job/nodejs-jenkins-test/",
      "color": "grey"
    }
  ],
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

exports.build = {}

exports.build.get = {
  "actions": [
    {
      "causes": [
        {
          "shortDescription": "Started by user anonymous",
          "userId":null,
          "userName":"anonymous"
        }
      ]
    }
  ],
  "artifacts": [],
  "building": false,
  "description": null,
  "duration": 138,
  "estimatedDuration": 138,
  "executor": null,
  "fullDisplayName": "nodejs-jenkins-test #1",
  "id": "2012-09-22_13-27-53",
  "keepLog": false,
  "number": 1,
  "result": "SUCCESS",
  "timestamp": 1348334873796,
  "url": "http://localhost:8080/job/nodejs-jenkins-test/1/",
  "builtOn": "",
  "changeSet": {
    "items": [],
    "kind": null
  },
  "culprits": []
}

exports.job = {}

exports.job.create = "" +
  "<?xml version='1.0' encoding='UTF-8'?>" +
  "<project>" +
  "  <description>before</description>" +
  "  <keepDependencies>false</keepDependencies>" +
  "  <properties/>" +
  "  <scm class='jenkins.scm.NullSCM'/>" +
  "  <canRoam>true</canRoam>" +
  "  <disabled>false</disabled>" +
  "  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>" +
  "  <triggers class='vector'/>" +
  "  <concurrentBuild>false</concurrentBuild>" +
  "  <builders/>" +
  "  <publishers/>" +
  "  <buildWrappers/>" +
  "</project>"

exports.job.config = "" +
  "<?xml version='1.0' encoding='UTF-8'?>" +
  "<project>" +
  "  <description>after</description>" +
  "  <keepDependencies>false</keepDependencies>" +
  "  <properties/>" +
  "  <scm class='jenkins.scm.NullSCM'/>" +
  "  <canRoam>true</canRoam>" +
  "  <disabled>false</disabled>" +
  "  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>" +
  "  <triggers class='vector'/>" +
  "  <concurrentBuild>false</concurrentBuild>" +
  "  <builders>" +
  "    <jenkins.tasks.Shell>" +
  "      <command>export FOO=bar</command>" +
  "    </jenkins.tasks.Shell>" +
  "  </builders>" +
  "  <publishers/>" +
  "  <buildWrappers/>" +
  "</project>"

exports.job.get = {
  "actions": [],
  "description": "before",
  "displayName": "nodejs-jenkins-test",
  "displayNameOrNull": null,
  "name": "nodejs-jenkins-test",
  "url": "http://localhost:8080/job/nodejs-jenkins-test/",
  "buildable": true,
  "builds": [],
  "color": "grey",
  "firstBuild": null,
  "healthReport": [],
  "inQueue": false,
  "keepDependencies": false,
  "lastBuild": null,
  "lastCompletedBuild": null,
  "lastFailedBuild": null,
  "lastStableBuild": null,
  "lastSuccessfulBuild": null,
  "lastUnstableBuild": null,
  "lastUnsuccessfulBuild": null,
  "nextBuildNumber": 1,
  "property": [],
  "queueItem": null,
  "concurrentBuild": false,
  "downstreamProjects": [],
  "scm": {},
  "upstreamProjects": []
}

exports.node = {}

exports.node.get = {
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
      "size": 77646782464
    },
    "hudson.node_monitors.ResponseTimeMonitor": {
      "average": 0
    },
    "hudson.node_monitors.SwapSpaceMonitor": {
      "availablePhysicalMemory": 6045696,
      "availableSwapSpace": 804081664,
      "totalPhysicalMemory": 515358720,
      "totalSwapSpace": 805302272
    },
    "hudson.node_monitors.TemporarySpaceMonitor": {
      "path": "/tmp",
      "size": 77646782464
    }
  },
  "numExecutors": 2,
  "offline": false,
  "offlineCause": null,
  "offlineCauseReason": "",
  "oneOffExecutors": [],
  "temporarilyOffline": false
}

exports.node.slave = {
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

exports.node.list = {
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
          "size": 77646782464
        },
        "hudson.node_monitors.ResponseTimeMonitor": {
          "average": 0
        },
        "hudson.node_monitors.SwapSpaceMonitor": {
          "availablePhysicalMemory": 6045696,
          "availableSwapSpace": 804081664,
          "totalPhysicalMemory": 515358720,
          "totalSwapSpace": 805302272
        },
        "hudson.node_monitors.TemporarySpaceMonitor": {
          "path": "/tmp",
          "size": 77646782464
        }
      },
      "numExecutors": 2,
      "offline": false,
      "offlineCause": null,
      "offlineCauseReason": "",
      "oneOffExecutors": [],
      "temporarilyOffline": false
    }
  ],
  "displayName": "nodes",
  "totalExecutors": 2
}



exports.queue = {}

exports.queue.get = {
  "items": [
    {
      "actions": [
        {
          "causes": [
            {
              "shortDescription": "Started by user anonymous",
              "userId": null,
              "userName": "anonymous"
            },
            {
              "shortDescription": "Started by user anonymous",
              "userId": null,
              "userName": "anonymous"
            },
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
      "id": 28,
      "inQueueSince": 1348350479842,
      "params":"", "stuck": false,
      "task": {
        "name": "nodejs-jenkins-test",
        "url": "http://localhost:8080/job/nodejs-jenkins-test/",
        "color": "blue_anime"
      },
      "why": "Build #3 is already in progress (ETA:N/A)",
      "buildableStartMilliseconds": 1348350479943
    }
  ]
}
