const LogStream = require("./log_stream").LogStream;
const middleware = require("./middleware");
const utils = require("./utils");

class Build {
  constructor(jenkins) {
    this.jenkins = jenkins;
  }

  /**
   * Build details
   */
  async get(name, number, opts) {
    opts = utils.parse([...arguments], "name", "number");

    this.jenkins._log(["debug", "build", "get"], opts);

    const req = { name: "build.get" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");
      if (!opts.number) throw new Error("number required");

      req.path = "{folder}/{number}/api/json";
      req.params = {
        folder: folder.path(),
        number: opts.number,
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._get(
      req,
      middleware.notFound(opts.name + " " + opts.number),
      middleware.body
    );
  }

  /**
   * Stop build
   */
  async stop(name, number, opts) {
    opts = utils.parse([...arguments], "name", "number");

    this.jenkins._log(["debug", "build", "stop"], opts);

    const req = { name: "build.stop" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");
      if (!opts.number) throw new Error("number required");

      req.path = "{folder}/{number}/stop";
      req.params = {
        folder: folder.path(),
        number: opts.number,
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(
      req,
      middleware.notFound(opts.name + " " + opts.number),
      middleware.require302("failed to stop: " + opts.name),
      middleware.empty
    );
  }

  /**
   * Terminate build
   */
  async term(name, number, opts) {
    opts = utils.parse([...arguments], "name", "number");

    this.jenkins._log(["debug", "build", "term"], opts);

    const req = { name: "build.term" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");
      if (!opts.number) throw new Error("number required");

      req.path = "{folder}/{number}/term";
      req.params = {
        folder: folder.path(),
        number: opts.number,
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(
      req,
      middleware.notFound(opts.name + " " + opts.number),
      middleware.empty
    );
  }

  /**
   * Get build log
   */
  async log(name, number, opts) {
    opts = utils.parse([...arguments], "name", "number");

    this.jenkins._log(["debug", "build", "log"], opts);

    const req = { name: "build.log" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");
      if (!opts.number) throw new Error("number required");

      req.path = "{folder}/{number}/logText/progressive{type}";
      req.params = {
        folder: folder.path(),
        number: opts.number,
        type: opts.type === "html" ? "Html" : "Text",
      };
      req.type = "form";
      req.body = {};
      if (opts.hasOwnProperty("start")) req.body.start = opts.start;
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(
      req,
      middleware.notFound(opts.name + " " + opts.number),
      (ctx, next) => {
        if (ctx.err) return next(ctx.err);
        if (!opts.meta) return next(false, ctx.res.body);

        const data = {
          text: ctx.res.body,
          more: ctx.res.headers["x-more-data"] === "true",
        };

        if (ctx.res.headers["x-text-size"]) {
          data.size = ctx.res.headers["x-text-size"];
        }

        next(false, data);
      }
    );
  }

  /**
   * Get log stream
   */
  logStream(name, number, opts) {
    opts = utils.parse([...arguments], "name", "number");

    return new LogStream(this.jenkins, opts);
  }
}

exports.Build = Build;
