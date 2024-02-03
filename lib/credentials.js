const middleware = require("./middleware");
const utils = require("./utils");

class Credentials {
  constructor(jenkins) {
    this.jenkins = jenkins;
  }

  /**
   * Get or update config
   */
  async config(id, folderPath, store, domain, xml, opts) {
    opts = utils.parse([...arguments], "id", "folder", "store", "domain", "xml");

    this.jenkins._log(["debug", "credentials", "config"], opts);

    const req = { name: "credentials.config" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.folder);

      if (folder.isEmpty()) throw new Error("folder is required");
      if (!opts.id) throw new Error("id is required");
      if (!opts.store) throw new Error("store is required");
      if (!opts.domain) throw new Error("domain is required");

      req.path = "{folder}/credentials/store/{store}/domain/{domain}/credential/{id}/config.xml";
      req.params = {
        folder: folder.path(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id
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

      req.path = "{folder}/credentials/store/{store}/domain/{domain}/createCredentials";
      req.headers = { "content-type": "text/xml; charset=utf-8" };
      req.params = {
        folder: folder.path(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id
      };

      req.body = Buffer.from(opts.xml);
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(req, middleware.empty);
  }

  async exists(id, folder, store, domain, opts) {
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

      req.path = "{folder}/credentials/store/{store}/domain/{domain}/credential/{id}/api/json";
      req.params = {
        folder: folder.path(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._head(req, middleware.exists);
  }


  async systemCreate(domain, xml, opts) {
    opts = utils.parse([...arguments], "domain", "xml");

    this.jenkins._log(["debug", "credentials", "systemCreate"], opts);

    const req = { name: "credentials.systemCreate" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath("manage");

      if (!opts.domain) throw new Error("domain required");
      if (!opts.xml) throw new Error("xml required");

      req.path = "{folder}/credentials/store/system/domain/{domain}/createCredentials";
      req.headers = { "content-type": "text/xml; charset=utf-8" };
      req.params = {
        folder: folder.pathWithoutSeperator(),
        store: opts.store,
        domain: opts.domain,
        id: opts.id
      };

      req.body = Buffer.from(opts.xml);
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._post(req, middleware.empty);
  }

  async systemExist(id, domain, opts) {
    opts = utils.parse([...arguments], "id", "domain");

    this.jenkins._log(["debug", "credentials", "systemExist"], opts);

    const req = { name: "credentials.systemExist" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath("manage");

      if (!opts.id) throw new Error("id required");
      if (!opts.domain) throw new Error("domain required");

      req.path = "{folder}/credentials/store/system/domain/{domain}/credential/{id}/api/json";
      req.params = {
        folder: folder.pathWithoutSeperator(),
        domain: opts.domain,
        id: opts.id
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._head(req, middleware.exists);
  }
}
exports.Credentials = Credentials;