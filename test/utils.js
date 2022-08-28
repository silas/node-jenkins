const fs = require("fs");
const should = require("should");

const utils = require("../lib/utils");

describe("utils", function () {
  describe("folderPath", function () {
    describe("constructor", function () {
      it("should parse string", function () {
        should(utils.folderPath().value).eql([]);
        should(utils.folderPath("").value).eql([]);
        should(utils.folderPath("/").value).eql([]);
        should(utils.folderPath("a/").value).eql(["a"]);
        should(utils.folderPath("/a").value).eql(["a"]);
        should(utils.folderPath("a/b").value).eql(["a", "b"]);
        should(utils.folderPath("a//b").value).eql(["a", "b"]);
        should(utils.folderPath("a/b/c").value).eql(["a", "b", "c"]);
      });

      it("should parse url", function () {
        for (const prefix of ["http://", "https://"]) {
          should(utils.folderPath(prefix).value).eql([]);
          should(utils.folderPath(`${prefix}example.org/`).value).eql([]);
          should(utils.folderPath(`${prefix}example.org/job/one`).value).eql([
            "one",
          ]);
          should(
            utils.folderPath(`${prefix}example.org/proxy/job/one`).value
          ).eql(["one"]);
          should(
            utils.folderPath(`${prefix}example.org/job/one/hello/world`).value
          ).eql(["one"]);
          should(
            utils.folderPath(`${prefix}example.org/job/one/hello/job/nope`)
              .value
          ).eql(["one"]);
          should(
            utils.folderPath(`${prefix}example.org/job/one/job/two`).value
          ).eql(["one", "two"]);
          should(
            utils.folderPath(`${prefix}example.org/job/one%2Ftwo`).value
          ).eql(["one/two"]);
          should(
            utils.folderPath(`${prefix}example.org/job/one/job/two%252Fthree/`)
              .value
          ).eql(["one", "two%2Fthree"]);
        }
      });

      it("should parse array", function () {
        should(utils.folderPath(["a"]).value).eql(["a"]);
        should(utils.folderPath(["a", "b"]).value).eql(["a", "b"]);
      });
    });

    describe("name", function () {
      it("should work", function () {
        should(utils.folderPath().name()).equal("");
        should(utils.folderPath("a").name()).equal("a");
        should(utils.folderPath("a/b").name()).equal("b");
      });
    });

    describe("path", function () {
      it("should work", function () {
        should(utils.folderPath().path()).containEql({
          encode: false,
          value: "",
        });
        should(utils.folderPath("a").path()).containEql({
          encode: false,
          value: "/job/a",
        });
        should(utils.folderPath("a/b").path()).containEql({
          encode: false,
          value: "/job/a/job/b",
        });
      });
    });

    describe("parent", function () {
      it("should work", function () {
        should(utils.folderPath().parent().value).eql([]);
        should(utils.folderPath("a").parent().value).eql([]);
        should(utils.folderPath("a/b").parent().value).eql(["a"]);
        should(utils.folderPath("a/b/c").parent().value).eql(["a", "b"]);
      });
    });
  });

  describe("parse", function () {
    it("should work", function () {
      should(utils.parse([])).eql({});
      should(utils.parse(["value"])).eql({});
      should(utils.parse([{}])).eql({});
      should(utils.parse([{ hello: "world" }])).eql({ hello: "world" });
      should(utils.parse([], "name")).eql({});
      should(utils.parse(["test"], "name")).eql({ name: "test" });
      should(utils.parse(["test", { hello: "world" }], "name")).eql({
        hello: "world",
        name: "test",
      });
      should(utils.parse(["test", { hello: "world" }], "name", "value")).eql({
        hello: "world",
        name: "test",
      });
      should(
        utils.parse(["one", "two", { hello: "world" }], "name", "value")
      ).eql({ hello: "world", name: "one", value: "two" });
    });
  });

  describe("isFileLike", function () {
    it("should work", function () {
      should(utils.isFileLike()).is.false;
      should(utils.isFileLike(null)).is.false;
      should(utils.isFileLike("test")).is.false;
      should(utils.isFileLike({})).is.false;

      should(utils.isFileLike(Buffer.from("test"))).is.true;

      const stream = fs.createReadStream(__filename);
      should(utils.isFileLike(stream)).is.true;
      stream.close();
    });
  });
});
