const middleware = require("./middleware");
const utils = require("./utils");

class Label {
  constructor(jenkins) {
    this.jenkins = jenkins;
  }

  /**
   * Label details
   */
  async get(name, opts) {
    opts = utils.parse([...arguments], "name");

    this.jenkins._log(["debug", "label", "get"], opts);

    const req = { name: "label.get" };

    utils.options(req, opts);

    try {
      if (!opts.name) throw new Error("name required");

      req.path = "/label/{name}/api/json";
      req.params = {
        name: opts.name,
      };
    } catch (err) {
      throw this.jenkins._err(err, req);
    }

    return await this.jenkins._get(req, middleware.body);
  }
}

exports.Label = Label;
