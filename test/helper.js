const auto = require("async/auto");
const fixtures = require("fixturefiles");
const nock = require("nock");
const uuid = require("node-uuid");

const NOCK_REC = process.env.NOCK_REC === "true";
const NOCK_OFF = process.env.NOCK_OFF === "true" || NOCK_REC;

const URL = process.env.JENKINS_TEST_URL || "http://localhost:8080";
const CRUMB_ISSUER = NOCK_OFF && process.env.CRUMB_ISSUER !== "false";

async function setup(opts) {
  const test = opts.test;
  const jenkins = test.jenkins;

  const unique = (name) => {
    if (NOCK_OFF) {
      name += "-" + uuid.v4();
    }
    return `test-${name}`;
  };

  test.jobName = unique("job");
  test.nodeName = unique("node");
  test.viewName = unique("view");
  test.folderName = unique("folder");

  if (!NOCK_OFF) {
    nock.disableNetConnect();
    return;
  }

  const promises = [];

  if (opts.job) {
    promises.push(jenkins.job.create(test.jobName, fixtures.jobCreate));
  }

  if (opts.folder){
    promises.push(jenkins.job.create(test.folderName, fixtures.folderCreate));
  }

  if (opts.node) {
    promises.push(
      jenkins.node.create({
        name: test.nodeName,
        launcher: {
          "stapler-class": "hudson.slaves.CommandLauncher",
          command: "java -jar /usr/share/jenkins/ref/slave.jar",
        },
      })
    );
  }

  if (opts.view) {
    promises.push(jenkins.view.create(test.viewName));
  }

  if (NOCK_REC) nock.recorder.rec();

  return Promise.all(promises);
}

async function teardown(opts) {
  if (NOCK_REC) nock.restore();
}

async function cleanup(opts) {
  const test = opts.test;

  if (!NOCK_OFF) {
    nock.enableNetConnect();
    return;
  }

  const jobs = {};

  jobs.listJobs = async () => {
    return test.jenkins.job.list();
  };

  jobs.listNodes = async () => {
    return test.jenkins.node.list();
  };

  jobs.listViews = async () => {
    return test.jenkins.view.list();
  };

  jobs.destroyJobs = [
    "listJobs",
    async (results) => {
      return Promise.all(
        results.listJobs
          .map((job) => job.name)
          .filter((name) => name.match(/^test-job-/))
          .map((name) => test.jenkins.job.destroy(name))
      );
    },
  ];

  jobs.destroyNodes = [
    "listNodes",
    async (results) => {
      return Promise.all(
        results.listNodes
          .map((node) => node.displayName)
          .filter((name) => name.match(/^test-node-/))
          .map((name) => test.jenkins.node.destroy(name))
      );
    },
  ];

  jobs.destroyViews = [
    "listViews",
    async (results) => {
      return Promise.all(
        results.listViews
          .map((node) => node.name)
          .filter((name) => name.match(/^test-view-/))
          .map((name) => test.jenkins.view.destroy(name))
      );
    },
  ];

  return auto(jobs);
}

exports.cleanup = cleanup;
exports.config = { url: URL, crumbIssuer: CRUMB_ISSUER };
exports.nock = { on: !NOCK_OFF, off: NOCK_OFF };
exports.ndescribe = NOCK_OFF ? describe.skip : describe;
exports.nit = NOCK_OFF ? it.skip : it;
exports.setup = setup;
exports.teardown = teardown;
