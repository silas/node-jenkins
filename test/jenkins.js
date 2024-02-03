"use strict";

const retry = require("async/retry");
const debug = require("debug");
const fixtures = require("fixturefiles");
const nock = require("nock");
const papi = require("papi");
const should = require("should");
const sinon = require("sinon");
const uuid = require("node-uuid");

const helper = require("./helper");
const Jenkins = require("../lib");

const ndescribe = helper.ndescribe;
const nit = helper.nit;

describe("jenkins", function () {
  beforeEach(function () {
    this.sinon = sinon.createSandbox();

    this.url = helper.config.url;
    this.nock = nock(this.url);
    this.jenkins = new Jenkins({
      baseUrl: this.url,
      crumbIssuer: helper.config.crumbIssuer,
    });
    this.jenkins.on("log", debug("jenkins:client"));
  });

  afterEach(async function () {
    nock.cleanAll();

    this.sinon.restore();

    return helper.teardown({ test: this });
  });

  after(async function () {
    return helper.cleanup({ test: this });
  });

  describe("build", function () {
    beforeEach(async function () {
      return helper.setup({ job: true, test: this });
    });

    describe("get", function () {
      it("should return build details", async function () {
        this.nock
          .post(`/job/${this.jobName}/build`)
          .reply(201, "", { location: "http://localhost:8080/queue/item/1/" })
          .get(`/job/${this.jobName}/1/api/json`)
          .reply(200, fixtures.buildGet);

        await this.jenkins.job.build(this.jobName);

        const data = await retry(100, async () => {
          return this.jenkins.build.get(this.jobName, 1);
        });

        should(data).have.property("number");
        should(data.number).equal(1);
      });

      it("should return build log", async function () {
        this.nock
          .post(`/job/${this.jobName}/build`)
          .reply(201, "", { location: "http://localhost:8080/queue/item/1/" })
          .post(`/job/${this.jobName}/1/logText/progressiveText`)
          .reply(200, fixtures.consoleText, {
            "Content-Type": "text/plain;charset=UTF-8",
          });

        await this.jenkins.job.build(this.jobName);

        await retry(100, async () => {
          return this.jenkins.build.log(this.jobName, 1);
        });
      });

      nit("should get with options", async function () {
        this.nock
          .get("/job/test/1/api/json?tree=%5B*%5B*%5D%5D")
          .reply(200, fixtures.buildGet);

        const data = await this.jenkins.build.get("test", 1, {
          tree: "[*[*]]",
        });
        should(data).have.property("number");
      });

      nit("should return error when it does not exist", async function () {
        this.nock.get("/job/test/2/api/json").reply(404);

        await shouldThrow(async () => {
          await this.jenkins.build.get("test", 2);
        }, "jenkins: build.get: test 2 not found");
      });
    });

    describe("stop", function () {
      it("should stop build", async function () {
        this.nock
          .post(`/job/${this.jobName}/build`)
          .reply(201, "", { location: "http://localhost:8080/queue/item/1/" })
          .post(`/job/${this.jobName}/1/stop`)
          .reply(302);

        await this.jenkins.job.build(this.jobName);

        await retry(100, async () => {
          return this.jenkins.build.stop(this.jobName, 1);
        });
      });
    });

    describe("term", function () {
      nit("should terminate build", async function () {
        this.nock
          .post(`/job/${this.jobName}/build`)
          .reply(201, "", { location: "http://localhost:8080/queue/item/1/" })
          .post(`/job/${this.jobName}/1/term`)
          .reply(200);

        await this.jenkins.job.build(this.jobName);

        await retry(100, async () => {
          await this.jenkins.build.term(this.jobName, 1);
        });
      });
    });
  });

  describe("job", function () {
    beforeEach(async function () {
      return helper.setup({ job: true, test: this });
    });

    describe("build", function () {
      it("should start build", async function () {
        this.nock
          .post(`/job/${this.jobName}/build`)
          .reply(201, "", { location: "http://localhost:8080/queue/item/5/" });

        const number = await this.jenkins.job.build(this.jobName);
        should(number).be.type("number");
        should(number).be.above(0);
      });

      it("should not error on 302", async function () {
        this.nock
          .post(`/job/${this.jobName}/build`)
          .reply(302, "", { location: "http://localhost:8080/queue/item/5/" });

        const number = await this.jenkins.job.build(this.jobName);
        should(number).be.type("number");
        should(number).be.above(0);
      });

      it("should start build with token", async function () {
        this.nock
          .post(`/job/${this.jobName}/build?token=secret`)
          .reply(201, "", { location: "http://localhost:8080/queue/item/5/" });

        const number = await this.jenkins.job.build(this.jobName, {
          token: "secret",
        });
        should(number).be.type("number");
        should(number).be.above(0);
      });

      nit("should work with parameters", async function () {
        this.nock
          .post("/job/test/buildWithParameters", { hello: "world" })
          .reply(201);

        const opts = { parameters: { hello: "world" } };
        await this.jenkins.job.build("test", opts);
      });

      nit("should work with form data parameters", async function () {
        this.jenkins = new Jenkins({
          baseUrl: this.url,
          crumbIssuer: helper.config.crumbIssuer,
          formData: require("form-data"),
        });
        this.jenkins.on("log", debug("jenkins:client"));

        this.nock
          .post("/job/test/buildWithParameters", /filename="oneName"/gm)
          .reply(201);

        const opts = {
          parameters: {
            oneName: Buffer.from("oneValue"),
            twoName: "twoValue",
          },
        };
        await this.jenkins.job.build("test", opts);
      });

      nit("should work with a token and parameters", async function () {
        this.nock
          .post("/job/test/buildWithParameters?token=secret", {
            hello: "world",
          })
          .reply(201);

        const opts = {
          parameters: { hello: "world" },
          token: "secret",
        };
        await this.jenkins.job.build("test", opts);
      });
    });

    describe("config", function () {
      it("should get job config", async function () {
        this.nock
          .get(`/job/${this.jobName}/config.xml`)
          .reply(200, fixtures.jobCreate);

        const config = await this.jenkins.job.config(this.jobName);
        should(config).be.type("string");
        should(config).containEql("<project>");
      });

      it("should update config", async function () {
        this.nock
          .get(`/job/${this.jobName}/config.xml`)
          .reply(200, fixtures.jobCreate)
          .post(`/job/${this.jobName}/config.xml`)
          .reply(200)
          .get(`/job/${this.jobName}/config.xml`)
          .reply(200, fixtures.jobUpdate);

        const before = await this.jenkins.job.config(this.jobName);

        const config = before.replace(
          "<description>before</description>",
          "<description>after</description>"
        );
        await this.jenkins.job.config(this.jobName, config);

        const after = await this.jenkins.job.config(this.jobName);

        should(before).not.eql(after);
        should(after).containEql("<description>after</description>");
      });
    });

    describe("copy", function () {
      it("should copy job", async function () {
        const name = this.jobName + "-new";

        this.nock
          .head(`/job/${name}/api/json`)
          .reply(404)
          .post(`/createItem?name=${name}&from=${this.jobName}&mode=copy`)
          .reply(302)
          .head(`/job/${name}/api/json`)
          .reply(200);

        const jobs = {};

        const before = await this.jenkins.job.exists(name);
        should(before).equal(false);

        await this.jenkins.job.copy(this.jobName, name);

        const after = await this.jenkins.job.exists(name);
        should(after).equal(true);
      });
    });

    describe("create", function () {
      it("should create job", async function () {
        const name = this.jobName + "-new";

        this.nock
          .head(`/job/${name}/api/json`)
          .reply(404)
          .post(`/createItem?name=${name}`, fixtures.jobCreate)
          .reply(200)
          .head(`/job/${name}/api/json`)
          .reply(200);

        const before = await this.jenkins.job.exists(name);
        should(before).equal(false);

        await this.jenkins.job.create(name, fixtures.jobCreate);

        const after = await this.jenkins.job.exists(name);
        should(after).equal(true);
      });

      nit("should return an error if it already exists", async function () {
        const error =
          'a job already exists with the name "nodejs-jenkins-test"';

        this.nock
          .post("/createItem?name=test", fixtures.jobCreate)
          .reply(400, "", { "x-error": error });

        await shouldThrow(async () => {
          await this.jenkins.job.create("test", fixtures.jobCreate);
        }, 'jenkins: job.create: a job already exists with the name "nodejs-jenkins-test"');
      });
    });

    describe("destroy", function () {
      it("should delete job", async function () {
        this.nock
          .head(`/job/${this.jobName}/api/json`)
          .reply(200)
          .post(`/job/${this.jobName}/doDelete`)
          .reply(302)
          .head(`/job/${this.jobName}/api/json`)
          .reply(404);

        const before = await this.jenkins.job.exists(this.jobName);
        should(before).equal(true);

        await this.jenkins.job.destroy(this.jobName);

        const after = await this.jenkins.job.exists(this.jobName);
        should(after).equal(false);
      });

      nit("should return error on failure", async function () {
        this.nock.post("/job/test/doDelete").reply(200);

        await shouldThrow(async () => {
          await this.jenkins.job.destroy("test");
        }, "jenkins: job.destroy: failed to delete: test");
      });
    });

    describe("disable", function () {
      it("should disable job", async function () {
        this.nock
          .get(`/job/${this.jobName}/api/json`)
          .reply(200, fixtures.jobGet)
          .post(`/job/${this.jobName}/disable`)
          .reply(302)
          .get(`/job/${this.jobName}/api/json`)
          .reply(200, fixtures.jobGetDisabled);

        const before = await this.jenkins.job.get(this.jobName);
        should(before?.buildable).equal(true);

        await this.jenkins.job.disable(this.jobName);

        const after = await this.jenkins.job.get(this.jobName);
        should(after?.buildable).equal(false);
      });
    });

    describe("enable", function () {
      it("should enable job", async function () {
        this.nock
          .post(`/job/${this.jobName}/disable`)
          .reply(302)
          .get(`/job/${this.jobName}/api/json`)
          .reply(200, fixtures.jobGetDisabled)
          .post(`/job/${this.jobName}/enable`)
          .reply(302)
          .get(`/job/${this.jobName}/api/json`)
          .reply(200, fixtures.jobGet);

        await this.jenkins.job.disable(this.jobName);

        const before = await this.jenkins.job.get(this.jobName);
        should(before?.buildable).equal(false);

        await this.jenkins.job.enable(this.jobName);

        const after = await this.jenkins.job.get(this.jobName);
        should(after?.buildable).equal(true);
      });
    });

    describe("exists", function () {
      it("should not find job", async function () {
        const name = this.jobName + "-nope";

        this.nock.head(`/job/${name}/api/json`).reply(404);

        const exists = await this.jenkins.job.exists(name);
        should(exists).equal(false);
      });

      it("should find job", async function () {
        this.nock.head(`/job/${this.jobName}/api/json`).reply(200);

        const exists = await this.jenkins.job.exists(this.jobName);
        should(exists).equal(true);
      });
    });

    describe("get", function () {
      it("should not get job", async function () {
        const name = this.jobName + "-nope";

        this.nock.get(`/job/${name}/api/json`).reply(404);

        await shouldThrow(async () => {
          await this.jenkins.job.get(name);
        }, `jenkins: job.get: ${name} not found`);
      });

      it("should get job", async function () {
        this.nock
          .get(`/job/${this.jobName}/api/json`)
          .reply(200, fixtures.jobGet);

        const data = await this.jenkins.job.get(this.jobName);
        should(data).properties("name", "url");
      });

      nit("should work with options", async function () {
        this.nock
          .get("/job/test/api/json?depth=1")
          .reply(200, fixtures.jobCreate);

        await this.jenkins.job.get("test", { depth: 1 });
      });

      nit("should return error when not found", async function () {
        this.nock.get("/job/test/api/json").reply(404);

        await shouldThrow(async () => {
          await this.jenkins.job.get("test");
        }, "jenkins: job.get: test not found");
      });
    });

    describe("list", function () {
      it("should list jobs", async function () {
        this.nock.get("/api/json").reply(200, fixtures.jobList);

        const data = await this.jenkins.job.list();
        should(data).not.be.empty();
        for (const job of data) {
          should(job).have.properties("name");
        }
      });

      it("should list jobs with string options", async function () {
        this.nock.get("/job/test/api/json").reply(200, fixtures.jobList);

        const jobs = await this.jenkins.job.list("test");
        for (const job of jobs) {
          should(job).have.properties("name");
        }
      });

      it("should list jobs with object options", async function () {
        this.nock.get("/job/test/api/json").reply(200, fixtures.jobList);

        const jobs = await this.jenkins.job.list({ name: ["test"] });
        for (const job of jobs) {
          should(job).have.properties("name");
        }
      });

      nit("should handle corrupt responses", async function () {
        const data = '"trash';

        this.nock.get("/api/json").reply(200, data);

        await shouldThrow(async () => {
          await this.jenkins.job.list();
        }, "jenkins: job.list: returned bad data");
      });
    });
  });

  describe('credentials', function () {
    before(async function () {
      return helper.setup({ job: false, test: this , folder: true});
    });

    describe('folder', function () {
      it("should create credentials", async function () {
        const folder = this.folderName;
        const store = "folder";
        const domain = "_";
        const id = "user-new-cred";

        this.nock
          .head(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(404)
          .post(`/job/${folder}/credentials/store/${store}/domain/${domain}/createCredentials`,
              fixtures.credentialCreate)
          .reply(200)
          .head(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(200);

      
        const before = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(before).equal(false);

        await this.jenkins.credentials.create(folder, store, domain, fixtures.credentialCreate);

        const after = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(after).equal(true);
      });

      it("should get credentials", async function () {
        const folder = this.folderName;
        const store = "folder";
        const domain = "_";
        const id = "user-new-cred";

        this.nock
          .get(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200, fixtures.credentialCreate);

        const config = await this.jenkins.credentials.config(id, folder, store, domain);
        should(config).be.type("string");
        should(config).equals(fixtures.credentialCreate);
      });

      it("should update credentials", async function () {
        const folder = this.folderName;
        const store = "folder";
        const domain = "_";
        const id = "user-new-cred";

        this.nock
          .get(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200, fixtures.credentialCreate)
          .post(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200)
          .get(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200, fixtures.credentialUpdate);

        const before = await this.jenkins.credentials.config(id, folder, store, domain);

        const config = before.replace(
            "<username>admin</username>",
            "<username>updated</username>"
          );

        await this.jenkins.credentials.config(id, folder, store, domain, config);

        const after = await this.jenkins.credentials.config(id, folder, store, domain);
        should(config).be.type("string");
        should(config).equals(fixtures.credentialUpdate);
      });

      it("should list credentials", async function () {
        const folder = this.folderName;
        const store = "folder";
        const domain = "_";

        this.nock.get(`/job/${folder}/credentials/store/${store}/domain/${domain}/api/json?tree=credentials[id]`)
        .reply(200, fixtures.credentialList);

        const data = await this.jenkins.credentials.list(folder, store, domain);
        should(data).not.be.empty();
        for (const credential of data) {
          should(credential).have.properties("id");
        }
      });

      it("should delete credential", async function () {
        const folder = this.folderName;
        const store = "folder";
        const domain = "_";
        const id = "user-new-cred";
        
        this.nock
          .head(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(200)
          .delete(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200)
          .head(`/job/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(404);

        const jobs = {};

        const before = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(before).equal(true);

        await this.jenkins.credentials.destroy(id, folder, store, domain);

        const after = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(after).equal(false);
      });
    });

    describe('system', function () {
      it("should create system credentials", async function () {
        const folder = "manage"
        const store = "system";
        const domain = "_";
        const id = "system-new-cred";

        this.nock
          .head(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(404)
          .post(`/${folder}/credentials/store/${store}/domain/${domain}/createCredentials`,
              fixtures.credentialCreate)
          .reply(200)
          .head(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(200);

      
        const before = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(before).equal(false);

        await this.jenkins.credentials.create(folder, store, domain, fixtures.credentialCreate);

        const after = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(after).equal(true);
      });

      it("should get system credentials", async function () {
        const folder = "manage"
        const store = "system";
        const domain = "_";
        const id = "system-new-cred";

        this.nock
          .get(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200, fixtures.credentialCreate);

        const config = await this.jenkins.credentials.config(id, folder, store, domain);
        should(config).be.type("string");
        should(config).equals(fixtures.credentialCreate);
      });

      it("should update system credentials", async function () {
        const folder = "manage"
        const store = "system";
        const domain = "_";
        const id = "system-new-cred";

        this.nock
          .get(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200, fixtures.credentialCreate)
          .post(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200)
          .get(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200, fixtures.credentialUpdate);

        const before = await this.jenkins.credentials.config(id, folder, store, domain);

        const config = before.replace(
            "<username>admin</username>",
            "<username>updated</username>"
          );

        await this.jenkins.credentials.config(id, folder, store, domain, config);

        const after = await this.jenkins.credentials.config(id, folder, store, domain);
        should(config).be.type("string");
        should(config).equals(fixtures.credentialUpdate);
      });

      it("should list system credentials", async function () {
        const folder = "manage"
        const store = "system";
        const domain = "_";

        this.nock.get(`/${folder}/credentials/store/${store}/domain/${domain}/api/json?tree=credentials[id]`)
        .reply(200, fixtures.credentialList);

        const data = await this.jenkins.credentials.list(folder, store, domain);
        should(data).not.be.empty();
        for (const credential of data) {
          should(credential).have.properties("id");
        }
      });

      it("should delete system credential", async function () {
        const folder = "manage"
        const store = "system";
        const domain = "_";
        const id = "system-new-cred";
        
        this.nock
          .head(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(200)
          .delete(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/config.xml`)
          .reply(200)
          .head(`/${folder}/credentials/store/${store}/domain/${domain}/credential/${id}/api/json`)
          .reply(404);

        const jobs = {};

        const before = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(before).equal(true);

        await this.jenkins.credentials.destroy(id, folder, store, domain);

        const after = await this.jenkins.credentials.exists(id, folder, store, domain);
        should(after).equal(false);
      });
    });
  });

  describe("label", function () {
    beforeEach(async function () {
      return helper.setup({ test: this });
    });

    describe("get", function () {
      it("should get label details", async function () {
        this.nock.get("/label/master/api/json").reply(200, fixtures.labelGet);

        const label = await this.jenkins.label.get("master");
        should(label).have.properties("nodes");
      });
    });
  });

  describe("node", function () {
    beforeEach(async function () {
      return helper.setup({ node: true, test: this });
    });

    describe("config", function () {
      it("should error on master update", async function () {
        await shouldThrow(async () => {
          await this.jenkins.node.config("master", "xml");
        }, "jenkins: node.config: master not supported");
      });
    });

    describe("create", function () {
      it("should create node", async function () {
        const name = `test-node-${uuid.v4()}`;

        this.nock
          .post(
            "/computer/doCreateItem?" +
              fixtures.nodeCreateQuery.replace(/{name}/g, name)
          )
          .reply(302, "", { location: "http://localhost:8080/computer/" });

        await this.jenkins.node.create(name);
      });
    });

    describe("destroy", function () {
      it("should delete node", async function () {
        this.nock
          .head(`/computer/${this.nodeName}/api/json`)
          .reply(200)
          .post(`/computer/${this.nodeName}/doDelete`)
          .reply(302, "")
          .head(`/computer/${this.nodeName}/api/json`)
          .reply(404);

        const jobs = {};

        const before = await this.jenkins.node.exists(this.nodeName);
        should(before).equal(true);

        await this.jenkins.node.destroy(this.nodeName);

        const after = await this.jenkins.node.exists(this.nodeName);
        should(after).equal(false);
      });
    });

    describe("disable", function () {
      it("should disable node", async function () {
        this.nock
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGet)
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGet)
          .post(`/computer/${this.nodeName}/toggleOffline?offlineMessage=away`)
          .reply(302, "")
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetTempOffline)
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetTempOffline)
          .post(
            `/computer/${this.nodeName}/changeOfflineCause`,
            "offlineMessage=update&json=%7B%22offlineMessage%22%3A%22update%22%7D&" +
              "Submit=Update%20reason"
          )
          .reply(302, "")
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetTempOfflineUpdate);

        const beforeDisable = await this.jenkins.node.get(this.nodeName);
        should(beforeDisable?.temporarilyOffline).equal(false);

        await this.jenkins.node.disable(this.nodeName, "away");

        const afterDisable = await this.jenkins.node.get(this.nodeName);
        should(afterDisable?.temporarilyOffline).equal(true);
        should(afterDisable?.offlineCauseReason).equal("away");

        await this.jenkins.node.disable(this.nodeName, "update");

        const afterUpdate = await this.jenkins.node.get(this.nodeName);
        should(afterUpdate?.temporarilyOffline).equal(true);
        should(afterUpdate?.offlineCauseReason).equal("update");
      });
    });

    describe("enable", function () {
      it("should enable node", async function () {
        this.nock
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGet)
          .post(`/computer/${this.nodeName}/toggleOffline?offlineMessage=away`)
          .reply(302, "")
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetTempOffline)
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetTempOffline)
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGet)
          .post(`/computer/${this.nodeName}/toggleOffline?offlineMessage=`)
          .reply(302, "");

        await this.jenkins.node.disable(this.nodeName, "away");

        const before = await this.jenkins.node.get(this.nodeName);
        should(before?.temporarilyOffline).equal(true);

        await this.jenkins.node.enable(this.nodeName);

        const after = await this.jenkins.node.get(this.nodeName);
        should(after?.temporarilyOffline).equal(false);
      });
    });

    describe("disconnect", function () {
      it("should disconnect node", async function () {
        this.nock
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetOnline)
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetOnline)
          .post(`/computer/${this.nodeName}/doDisconnect?offlineMessage=away`)
          .reply(302, "")
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetOffline)
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetOffline)
          .post(
            `/computer/${this.nodeName}/toggleOffline?offlineMessage=update`
          )
          .reply(302, "")
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGetOfflineUpdate);

        const beforeDisconnect = await retry(1000, async () => {
          const node = await this.jenkins.node.get(this.nodeName);
          if (!node || node.offline) throw new Error("node offline");
          return node;
        });
        should(beforeDisconnect?.offline).equal(false);

        await this.jenkins.node.disconnect(this.nodeName, "away");

        const afterDisconnect = await this.jenkins.node.get(this.nodeName);
        should(afterDisconnect?.offline).equal(true);
        should(afterDisconnect?.offlineCauseReason).equal("away");

        await this.jenkins.node.disconnect(this.nodeName, "update");

        const afterUpdate = await this.jenkins.node.get(this.nodeName);
        should(afterUpdate?.offline).equal(true);
        should(afterUpdate?.offlineCauseReason).equal("update");
      });
    });

    describe("exists", function () {
      it("should not find node", async function () {
        const name = this.nodeName + "-nope";

        this.nock.head(`/computer/${name}/api/json`).reply(404);

        const exists = await this.jenkins.node.exists(name);
        should(exists).equal(false);
      });

      it("should find node", async function () {
        this.nock.head(`/computer/${this.nodeName}/api/json`).reply(200);

        const exists = await this.jenkins.node.exists(this.nodeName);
        should(exists).equal(true);
      });
    });

    describe("get", function () {
      it("should get node details", async function () {
        this.nock
          .get(`/computer/${this.nodeName}/api/json`)
          .reply(200, fixtures.nodeGet);

        const node = await this.jenkins.node.get(this.nodeName);
        should(node).have.properties("displayName");
      });

      it("should get master", async function () {
        this.nock
          .get("/computer/(master)/api/json")
          .reply(200, fixtures.nodeGet);

        const node = await this.jenkins.node.get("master");
        should(node).have.properties("displayName");
      });
    });

    describe("list", function () {
      it("should list nodes", async function () {
        this.nock.get("/computer/api/json").reply(200, fixtures.nodeList);

        const nodes = await this.jenkins.node.list();
        should.exist(nodes);
        should(nodes).be.instanceof(Array);
        should(nodes).not.be.empty;
      });

      it("should include extra metadata", async function () {
        this.nock.get("/computer/api/json").reply(200, fixtures.nodeList);

        const info = await this.jenkins.node.list({ full: true });
        should(info).have.properties(
          "busyExecutors",
          "computer",
          "displayName",
          "totalExecutors"
        );
      });
    });
  });

  describe("queue", function () {
    beforeEach(async function () {
      return helper.setup({ job: true, test: this });
    });

    describe("list", function () {
      it("should list queue", async function () {
        this.nock
          .get("/queue/api/json")
          .reply(200, fixtures.queueList)
          .post(`/job/${this.jobName}/build`)
          .reply(201, "", {
            location: "http://localhost:8080/queue/item/124/",
          });

        let stop = false;

        await Promise.all([
          retry(1000, async () => {
            const queue = await this.jenkins.queue.list();
            if (!queue?.length) {
              throw new Error("no queue");
            }

            stop = true;

            should(queue).be.instanceof(Array);
          }),
          retry(1000, async () => {
            if (stop) return;

            await this.jenkins.job.build(this.jobName);

            if (!stop) throw new Error("queue more");
          }),
        ]);
      });
    });

    describe("item", function () {
      nit("should return a queue item", async function () {
        this.nock
          .get("/queue/item/130/api/json")
          .reply(200, fixtures.queueItem);

        const data = await this.jenkins.queue.item(130);
        should(data).have.property("id");
        should(data.id).equal(130);
      });

      it("should require a number", async function () {
        await shouldThrow(async () => {
          await this.jenkins.queue.item(null);
        }, "jenkins: queue.item: number required");
      });
    });

    describe("get", function () {
      nit("should work", async function () {
        this.nock
          .get("/computer/(master)/api/json")
          .reply(200, fixtures.nodeGet);

        const data = await this.jenkins.node.get("master");
        should.exist(data);
      });
    });

    ndescribe("cancel", function () {
      it("should work", async function () {
        this.nock.post("/queue/item/1/cancelQueue", "").reply(302);

        await this.jenkins.queue.cancel(1);
      });

      it("should return error on failure", async function () {
        this.nock.post("/queue/item/1/cancelQueue", "").reply(500);

        await shouldThrow(async () => {
          await this.jenkins.queue.cancel(1);
        }, "jenkins: queue.cancel: failed to cancel: 1");
      });
    });
  });

  describe("view", function () {
    beforeEach(async function () {
      return helper.setup({ job: true, view: true, test: this });
    });

    describe("create", function () {
      it("should create view", async function () {
        const name = this.viewName + "-new";

        this.nock
          .head(`/view/${name}/api/json`)
          .reply(404)
          .post(
            "/createView",
            JSON.parse(
              JSON.stringify(fixtures.viewCreate).replace(/test-view/g, name)
            )
          )
          .reply(302)
          .head(`/view/${name}/api/json`)
          .reply(200);

        const before = await this.jenkins.view.exists(name);
        should(before).equal(false);

        await this.jenkins.view.create(name, "list");

        const after = await this.jenkins.view.exists(name);
        should(after).equal(true);
      });

      nit("should return an error if it already exists", async function () {
        const error = 'A view already exists with the name "test-view"';

        this.nock
          .post("/createView", fixtures.viewCreate)
          .reply(400, "", { "x-error": error });

        await shouldThrow(async () => {
          await this.jenkins.view.create(this.viewName, "list");
        }, 'jenkins: view.create: A view already exists with the name "test-view"');
      });
    });

    describe("config", function () {
      it("should return xml", async function () {
        this.nock
          .get(`/view/${this.viewName}/config.xml`)
          .reply(200, fixtures.viewConfig);

        const config = await this.jenkins.view.config(this.viewName);
        should(config).be.type("string");
        should(config).containEql("<hudson.model.ListView>");
      });

      it("should update config xml", async function () {
        const src = "<filterQueue>false</filterQueue>";
        const dst = "<filterQueue>true</filterQueue>";

        this.nock
          .get(`/view/${this.viewName}/config.xml`)
          .reply(200, fixtures.viewConfig)
          .post(`/view/${this.viewName}/config.xml`)
          .reply(200)
          .get(`/view/${this.viewName}/config.xml`)
          .reply(200, fixtures.viewConfig.replace(src, dst));

        const before = await this.jenkins.view.config(this.viewName);
        should(before).containEql(src);

        const config = fixtures.viewConfig.replace(src, dst);
        await this.jenkins.view.config(this.viewName, config);

        const after = await this.jenkins.view.config(this.viewName);
        should(after).containEql(dst);
      });
    });

    describe("destroy", function () {
      it("should delete view", async function () {
        this.nock
          .head(`/view/${this.viewName}/api/json`)
          .reply(200)
          .post(`/view/${this.viewName}/doDelete`)
          .reply(302)
          .head(`/view/${this.viewName}/api/json`)
          .reply(404);

        const before = await this.jenkins.view.exists(this.viewName);
        should(before).equal(true);

        await this.jenkins.view.destroy(this.viewName);

        const after = await this.jenkins.view.exists(this.viewName);
        should(after).equal(false);
      });

      nit("should return error on failure", async function () {
        this.nock.post("/view/test/doDelete").reply(200);

        await shouldThrow(async () => {
          await this.jenkins.view.destroy("test");
        }, "jenkins: view.destroy: failed to delete: test");
      });
    });

    describe("get", function () {
      it("should not get view", async function () {
        const name = this.viewName + "-nope";

        this.nock.get(`/view/${name}/api/json`).reply(404);

        await shouldThrow(async () => {
          await this.jenkins.view.get(name);
        }, `jenkins: view.get: ${name} not found`);
      });

      it("should get view", async function () {
        this.nock
          .get(`/view/${this.viewName}/api/json`)
          .reply(200, fixtures.viewGet);

        const data = await this.jenkins.view.get(this.viewName);
        should(data).properties("name", "url");
      });

      nit("should work with options", async function () {
        this.nock
          .get("/view/test/api/json?depth=1")
          .reply(200, fixtures.viewCreate);

        await this.jenkins.view.get("test", { depth: 1 });
      });

      nit("should return error when not found", async function () {
        this.nock.get("/view/test/api/json").reply(404);

        await shouldThrow(async () => {
          await this.jenkins.view.get("test");
        }, "jenkins: view.get: test not found");
      });
    });

    describe("list", function () {
      it("should list views", async function () {
        this.nock.get("/api/json").reply(200, fixtures.viewList);

        const data = await this.jenkins.view.list();
        should(data).not.be.empty();
        for (const view of data) {
          should(view).have.properties("name");
        }
      });

      nit("should handle corrupt responses", async function () {
        const data = '"trash';

        this.nock.get("/api/json").reply(200, data);

        await shouldThrow(async () => {
          await this.jenkins.view.list();
        }, "jenkins: view.list: returned bad data");
      });
    });

    describe("add", function () {
      it("should add job to view", async function () {
        const beforeView = fixtures.viewGetListView;
        beforeView.jobs = [];

        this.nock
          .get(`/view/${this.viewName}/api/json`)
          .reply(200, beforeView)
          .post(`/view/${this.viewName}/addJobToView?name=` + this.jobName)
          .reply(200)
          .get(`/view/${this.viewName}/api/json`)
          .reply(200, fixtures.viewGetListView);

        const before = await this.jenkins.view.get(this.viewName);
        should(before?.jobs).be.empty();

        await this.jenkins.view.add(this.viewName, this.jobName);

        const after = await this.jenkins.view.get(this.viewName);
        should(after?.jobs).not.be.empty();
      });
    });

    describe("remove", function () {
      it("should remove job from view", async function () {
        const afterView = fixtures.viewGetListView;
        afterView.jobs = [];

        this.nock
          .post(`/view/${this.viewName}/addJobToView?name=` + this.jobName)
          .reply(200)
          .get(`/view/${this.viewName}/api/json`)
          .reply(200, fixtures.viewGetListView)
          .post(`/view/${this.viewName}/removeJobFromView?name=` + this.jobName)
          .reply(200)
          .get(`/view/${this.viewName}/api/json`)
          .reply(200, afterView);

        await this.jenkins.view.add(this.viewName, this.jobName);

        const before = await this.jenkins.view.get(this.viewName);
        should(before?.jobs).not.empty();

        await this.jenkins.view.remove(this.viewName, this.jobName);

        const after = await this.jenkins.view.get(this.viewName);
        should(after?.jobs).be.empty();
      });
    });
  });

  describe("plugin", function () {
    beforeEach(async function () {
      return helper.setup({ test: this });
    });

    describe("list", function () {
      it("should list plugins", async function () {
        this.nock
          .get("/pluginManager/api/json?depth=2")
          .reply(200, fixtures.pluginList);

        const plugins = await this.jenkins.plugin.list({ depth: 2 });
        should(plugins).be.instanceof(Array);
        should(plugins).not.be.empty();

        for (const plugin of plugins) {
          should(plugin).have.properties([
            "longName",
            "shortName",
            "dependencies",
          ]);
        }
      });
    });
  });
});

async function shouldThrow(block, message) {
  if (!message) throw new Error("expected message required");

  try {
    await block();
  } catch (err) {
    should(err?.message).equal(message);
    return;
  }

  throw Error("no exception thrown");
}
