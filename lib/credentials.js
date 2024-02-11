const middleware = require("./middleware");
const utils = require("./utils");

class Credentials {
  constructor(jenkins) {
    this.jenkins = jenkins;
  }

  /**
   * Get or update credentials
   */
  async config(id, folderPath, store, domain, xml, opts) {
    opts = utils.parse(
      [...arguments],
      "id",
      "folder",
      "store",
      "domain",
      "xml"
    );

    this.jenkins._log(["debug", "credentials", "config"], opts);

    const req = { name: "credentials.config" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.folder);

      if (folder.isEmpty()) throw new Error("folder is required");
      if (!opts.id) throw new Error("id is required");
      if (!opts.store) throw new Error("store is required");
      if (!opts.domain) throw new Error("domain is required");

      req.path =
        "{folder}/credentials/store/{store}/domain/{domain}/credential/{id}/config.xml";
      req.params = {
        folder: store === "system" ? folder.path("/") : folder.path(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id,
      };

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
      middleware.notFound("job " + opts.folder),
      (ctx, next) => {
        if (ctx.err || opts.xml) return middleware.empty(ctx, next);

        next(false, ctx.res.body.toString("utf8"));
      }
    );
  }

  /**
   * Create credentials
   */
  async create(folder, store, domain, xml, opts) {
    opts = utils.parse([...arguments], "folder", "store", "domain", "xml");

    this.jenkins._log(["debug", "credentials", "create"], opts);

    const req = { name: "credentials.create" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.folder);

      if (folder.isEmpty()) throw new Error("folder required");
      if (!opts.store) throw new Error("store required");
      if (!opts.domain) throw new Error("domain required");
      if (!opts.xml) throw new Error("xml required");

      req.path =
        "{folder}/credentials/store/{store}/domain/{domain}/createCredentials";
      req.headers = { "content-type": "text/xml; charset=utf-8" };
      req.params = {
        folder: store === "system" ? folder.path("/") : folder.path(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id,
      };

      req.body = Buffer.from(opts.xml);
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(req, middleware.empty);
  }

  /**
   * Check if credentials exist
   */
  async exists(id, folderPath, store, domain, opts) {
    opts = utils.parse([...arguments], "id", "folder", "store", "domain");

    this.jenkins._log(["debug", "credentials", "exists"], opts);

    const req = { name: "credentials.exists" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.folder);

      if (folder.isEmpty()) throw new Error("folder required");
      if (!opts.id) throw new Error("id required");
      if (!opts.store) throw new Error("store required");
      if (!opts.domain) throw new Error("domain required");

      req.path =
        "{folder}/credentials/store/{store}/domain/{domain}/credential/{id}/api/json";
      req.params = {
        folder: store === "system" ? folder.path("/") : folder.path(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id,
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._head(req, middleware.exists);
  }

  /**
   * Destroy credentials
   */
  async destroy(id, folderPath, store, domain, opts) {
    opts = utils.parse([...arguments], "id", "folder", "store", "domain");

    this.jenkins._log(["debug", "credentials", "destroy"], opts);

    const req = { name: "credentials.destroy" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.folder);

      if (folder.isEmpty()) throw new Error("folder is required");
      if (!opts.id) throw new Error("id is required");
      if (!opts.store) throw new Error("store is required");
      if (!opts.domain) throw new Error("domain is required");

      req.path =
        "{folder}/credentials/store/{store}/domain/{domain}/credential/{id}/config.xml";
      req.params = {
        folder: store === "system" ? folder.path("/") : folder.path(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id,
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._delete(req, middleware.empty);
  }

  /**
   * List credentials
   */
  async list(folderPath, store, domain, opts) {
    opts = utils.parse([...arguments], "folder", "store", "domain");

    this.jenkins._log(["debug", "credentials", "list"], opts);

    const req = {
      name: "credentials.list",
    };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.folder);

      if (!opts.domain) opts.domain = "_";

      req.path =
        "{folder}/credentials/store/{store}/domain/{domain}/api/json?tree=credentials[id]";
      req.params = {
        folder: store === "system" ? folder.path("/") : folder.path(),
        store: opts.store,
        domain: opts.domain,
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._get(
      req,
      (ctx, next) => {
        if (ctx.err) return next();

        if (ctx.err || opts.xml) return middleware.empty(ctx, next);

        if (!ctx.res.body || !Array.isArray(ctx.res.body.credentials)) {
          ctx.err = new Error("returned bad data");
        }

        next();
      },
      middleware.bodyItem("credentials")
    );
  }
}

exports.Credentials = Credentials;
