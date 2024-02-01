const middleware = require("./middleware");
const utils = require("./utils");

class Credentials {
    constructor(jenkins) {
      this.jenkins = jenkins;
    }

  /**
   * Get or update config
   */
  // async config(path, store, domain, xml, opts) {
  //   opts = utils.parse([...arguments], "name", "xml");

  //   this.jenkins._log(["debug", "credentials", "config"], opts);

  //   const req = { name: "credentials.config" };

  //   utils.options(req, opts);

  //   try {
  //     const folder = utils.folderPath(opts.name);

  //     if (folder.isEmpty()) throw new Error("name required");

  //     req.path = "{folder}/config.xml";
  //     req.params = { folder: folder.path() };

  //     if (opts.xml) {
  //       req.method = "POST";
  //       req.headers = { "content-type": "text/xml; charset=utf-8" };
  //       req.body = Buffer.from(opts.xml);
  //     } else {
  //       req.method = "GET";
  //     }
  //   } catch (err) {
  //     throw this.jenkins._err(err, req);
  //   }

  //   return await this.jenkins._request(
  //     req,
  //     middleware.notFound("job " + opts.name),
  //     (ctx, next) => {
  //       if (ctx.err || opts.xml) return middleware.empty(ctx, next);

  //       next(false, ctx.res.body.toString("utf8"));
  //     }
  //   );
  // }

  async create(path, store, domain, xml, opts){
    opts = utils.parse([...arguments], "contextPath", "store", "domain", "xml");

    this.jenkins._log(["debug", "credentials", "create"], opts);

    const req = { name: "credentials.create" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.contextPath);

      if (folder.isEmpty()) throw new Error("contextPath required");
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

  async exists(id, contextPath, store, domain, opts) {
    opts = utils.parse([...arguments], "id", "contextPath", "store", "domain");

    this.jenkins._log(["debug", "credentials", "exists"], opts);

    const req = { name: "credentials.exists" };

    utils.options(req, opts);

    try {
      const folder = utils.folderPath(opts.contextPath);

      if (folder.isEmpty()) throw new Error("contextPath required");
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
}

exports.Credentials = Credentials;