require("should");

const async_ = require("async");
const fixtures = require("fixturefiles");
const nock = require("nock");
const uuid = require("node-uuid");

const NOCK_REC = process.env.NOCK_REC === "true";
const NOCK_OFF = process.env.NOCK_OFF === "true" || NOCK_REC;

const URL = process.env.JENKINS_TEST_URL || "http://localhost:8080";
const CRUMB_ISSUER = NOCK_OFF && process.env.CRUMB_ISSUER !== "false";

function setup(opts) {
  return new Promise((resolve, reject) => {
    const test = opts.test;
    const jenkins = test.jenkins;

    const unique = function (name) {
      if (NOCK_OFF) {
        name += "-" + uuid.v4();
      }
      return "test-" + name;
    };

    test.jobName = unique("job");
    test.nodeName = unique("node");
    test.viewName = unique("view");

    if (!NOCK_OFF) {
      nock.disableNetConnect();
      return resolve();
    }

    const jobs = {};

    if (opts.job) {
      jobs.createJob = async function () {
        return jenkins.job.create(test.jobName, fixtures.jobCreate);
      };
    }

    if (opts.node) {
      jobs.createNode = async function () {
        const opts = {
          name: test.nodeName,
          launcher: {
            "stapler-class": "hudson.slaves.CommandLauncher",
            command: "java -jar /usr/share/jenkins/ref/slave.jar",
          },
        };
        return jenkins.node.create(opts);
      };
    }

    if (opts.view) {
      jobs.createView = async function () {
        return jenkins.view.create(test.viewName);
      };
    }

    async_.auto(jobs, function (err) {
      if (err) return reject(err);

      if (NOCK_REC) nock.recorder.rec();

      resolve();
    });
  });
}

async function teardown(opts) {
  if (NOCK_REC) nock.restore();
}

function cleanup(opts) {
  return new Promise((resolve, reject) => {
    const test = opts.test;

    if (!NOCK_OFF) {
      nock.enableNetConnect();
      return resolve();
    }

    const jobs = {};

    jobs.listJobs = async function () {
      return test.jenkins.job.list();
    };

    jobs.listNodes = async function () {
      return test.jenkins.node.list();
    };

    jobs.listViews = async function () {
      return test.jenkins.view.list();
    };

    jobs.destroyJobs = [
      "listJobs",
      async function (results) {
        const names = results.listJobs
          .map(function (job) {
            return job.name;
          })
          .filter(function (name) {
            return name.match(/^test-job-/);
          });

        return async_.map(names, async function (name) {
          return test.jenkins.job.destroy(name);
        });
      },
    ];

    jobs.destroyNodes = [
      "listNodes",
      async function (results) {
        const names = results.listNodes
          .map(function (node) {
            return node.displayName;
          })
          .filter(function (name) {
            return name.match(/^test-node-/);
          });

        return async_.map(names, async function (name) {
          return test.jenkins.node.destroy(name);
        });
      },
    ];

    jobs.destroyViews = [
      "listViews",
      async function (results) {
        const names = results.listViews
          .map(function (node) {
            return node.name;
          })
          .filter(function (name) {
            return name.match(/^test-view-/);
          });

        return async_.map(names, async function (name) {
          return test.jenkins.view.destroy(name);
        });
      },
    ];

    async_.auto(jobs, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

exports.cleanup = cleanup;
exports.config = { url: URL, crumbIssuer: CRUMB_ISSUER };
exports.nock = { on: !NOCK_OFF, off: NOCK_OFF };
exports.ndescribe = NOCK_OFF ? describe.skip : describe;
exports.nit = NOCK_OFF ? it.skip : it;
exports.setup = setup;
exports.teardown = teardown;
