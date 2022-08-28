const middleware = require("./middleware");
const utils = require("./utils");

class View {
  constructor(jenkins) {
    this.jenkins = jenkins;
  }

  /**
   * Create new view
   */
  async create(name, type, opts) {
    opts = utils.parse([...arguments], "name", "type");
    if (opts.name && !opts.type) opts.type = "list";

    this.jenkins._log(["debug", "view", "create"], opts);

    const req = { name: "view.create" };

    utils.options(req, opts);

    const shortcuts = {
      list: "hudson.model.ListView",
      my: "hudson.model.MyView",
    };

    try {
      const folder = utils.folderPath(opts.name);
      const mode = shortcuts[opts.type] || opts.type;

      if (folder.isEmpty()) throw new Error("name required");
      if (!opts.type) throw new Error("type required");

      req.path = "{dir}/createView";
      req.type = "form";
      req.params = { dir: folder.dir() };
      req.body = {
        name: folder.name(),
        mode: mode,
        json: JSON.stringify({
          name: folder.name(),
          mode: mode,
        }),
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(
      req,
      middleware.require302("failed to create: " + opts.name),
      middleware.empty
    );
  }

  /**
   * Config list view
   */
  async config(name, xml, opts) {
    opts = utils.parse([...arguments], "name", "xml");

    this.jenkins._log(["debug", "view", "config"], opts);

    const req = {
      path: "{dir}/view/{name}/config.xml",
      name: "view.config",
    };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");

      req.params = { dir: folder.dir(), name: folder.name() };

      if (opts.xml) {
        req.method = "POST";
        req.headers = { "content-type": "text/xml; charset=utf-8" };
        req.body = Buffer.from(opts.xml);
      } else {
        req.method = "GET";
      }
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._request(
      req,
      middleware.notFound("view " + opts.name),
      (ctx, next) => {
        if (ctx.err || opts.xml) return middleware.empty(ctx, next);

        next(false, ctx.res.body.toString("utf8"));
      }
    );
  }

  /**
   * Destroy view
   */
  async destroy(name, opts) {
    opts = utils.parse([...arguments], "name");

    this.jenkins._log(["debug", "view", "destroy"], opts);

    const req = { name: "view.destroy" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");

      req.path = "{dir}/view/{name}/doDelete";
      req.params = { dir: folder.dir(), name: folder.name() };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(
      req,
      middleware.notFound(opts.name),
      middleware.require302("failed to delete: " + opts.name),
      middleware.empty
    );
  }

  async delete(...args) {
    return await this.destroy(...args);
  }

  /**
   * View exists
   */
  async exists(name, opts) {
    opts = utils.parse([...arguments], "name");

    this.jenkins._log(["debug", "view", "exists"], opts);

    const req = { name: "view.exists" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");

      req.path = "{dir}/view/{name}/api/json";
      req.params = { dir: folder.dir(), name: folder.name() };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._head(req, middleware.exists);
  }

  /**
   * View details
   */
  async get(name, opts) {
    opts = utils.parse([...arguments], "name");

    this.jenkins._log(["debug", "view", "get"], opts);

    const req = { name: "view.get" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");

      req.path = "{dir}/view/{name}/api/json";
      req.params = { dir: folder.dir(), name: folder.name() };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._get(
      req,
      middleware.notFound(opts.name),
      middleware.body
    );
  }

  /**
   * List views
   */
  async list(name, opts) {
    opts = utils.parse([...arguments], "name");

    this.jenkins._log(["debug", "view", "list"], opts);

    const req = {
      name: "view.list",
      path: "{folder}/api/json",
    };

    try {
      const folder = utils.folderPath(opts.name);

      req.params = { folder: folder.path() };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    utils.options(req, opts);

    return await this.jenkins._get(
      req,
      (ctx, next) => {
        if (ctx.err) return next();

        if (!ctx.res.body || !Array.isArray(ctx.res.body.views)) {
          ctx.err = new Error("returned bad data");
        }

        next();
      },
      middleware.bodyItem("views")
    );
  }

  /**
   * Add job
   */
  async add(name, job, opts) {
    opts = utils.parse([...arguments], "name", "job");

    this.jenkins._log(["debug", "view", "add"], opts);

    const req = {
      path: "{dir}/view/{name}/addJobToView",
      query: { name: opts.job },
      type: "form",
      name: "view.add",
      body: {},
    };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");
      if (!opts.job) throw new Error("job required");

      req.params = { dir: folder.dir(), name: folder.name() };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(req, middleware.empty);
  }

  /**
   * Remove job
   */
  async remove(name, job, opts) {
    opts = utils.parse([...arguments], "name", "job");

    this.jenkins._log(["debug", "view", "remove"], opts);

    const req = {
      path: "{dir}/view/{name}/removeJobFromView",
      query: { name: opts.job },
      type: "form",
      name: "view.remove",
      body: {},
    };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.name);

      if (folder.isEmpty()) throw new Error("name required");
      if (!opts.job) throw new Error("job required");

      req.params = { dir: folder.dir(), name: folder.name() };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(req, middleware.empty);
  }
}

exports.View = View;
