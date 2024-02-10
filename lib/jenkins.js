const papi = require("papi");
const util = require("util");

const Build = require("./build").Build;
const CrumbIssuer = require("./crumb_issuer").CrumbIssuer;
const Job = require("./job").Job;
const Label = require("./label").Label;
const Node = require("./node").Node;
const Plugin = require("./plugin").Plugin;
const Queue = require("./queue").Queue;
const View = require("./view").View;
const Credentials = require("./credentials").Credentials;
const middleware = require("./middleware");
const utils = require("./utils");

class Jenkins extends papi.Client {
  constructor(baseUrl, opts) {
    opts = utils.parse([...arguments], "baseUrl");

    if (!opts.headers) {
      opts.headers = {};
    } else {
      opts.headers = utils.clone(opts.headers);
    }
    if (!opts.headers.referer) {
      opts.headers.referer = opts.baseUrl + "/";
    }

    opts.name = "jenkins";

    const crumbIssuer = opts.crumbIssuer;
    const formData = opts.formData;

    delete opts.crumbIssuer;
    delete opts.formData;

    super(opts);

    if (typeof crumbIssuer === "function") {
      this._crumbIssuer = crumbIssuer;
    } else if (crumbIssuer === true || typeof crumbIssuer === "undefined") {
      this._crumbIssuer = utils.crumbIssuer;
    }

    if (formData) {
      if (typeof formData !== "function" || formData.name !== "FormData") {
        throw new Error("formData is invalid");
      }
      this._formData = formData;
    }

    this._ext("onCreate", this._onCreate);
    this._ext("onResponse", this._onResponse);

    this.build = new Jenkins.Build(this);
    this.credentials = new Jenkins.Credentials(this);
    this.crumbIssuer = new Jenkins.CrumbIssuer(this);
    this.job = new Jenkins.Job(this);
    this.label = new Jenkins.Label(this);
    this.node = new Jenkins.Node(this);
    this.plugin = new Jenkins.Plugin(this);
    this.queue = new Jenkins.Queue(this);
    this.view = new Jenkins.View(this);
  }

  /**
   * Inject CSRF Protection crumb into POST requests
   */
  _onCreate(ctx, next) {
    if (!this._crumbIssuer || ctx.opts.method !== "POST") return next();

    this._crumbIssuer(this).then((data) => {
      if (data.headerName && data.headerValue) {
        if (!ctx.opts.headers) ctx.opts.headers = {};
        ctx.opts.headers[data.headerName] = data.headerValue;
        if (data.cookies) ctx.opts.headers.cookie = data.cookies;
      }

      next();
    }, next);
  }

  /**
   * Handle responses.
   */
  _onResponse(ctx, next) {
    if (ctx.err) {
      if (ctx.res && ctx.res.headers && ctx.res.headers["x-error"]) {
        ctx.err.message = ctx.res.headers["x-error"].replace(/\?/g, '"');
      }
      ctx.err.res = ctx.res;
    }

    next();
  }

  /**
   * Jenkins info
   */
  async info(opts) {
    opts = utils.parse([...arguments]);

    this._log(["debug", "info"], opts);

    const req = {
      name: "info",
      path: "/api/json",
    };

    utils.options(req, opts);

    return this._get(req, middleware.body);
  }

  async get(...args) {
    return await info(...args);
  }
}

Jenkins.Build = Build;
Jenkins.Credentials = Credentials;
Jenkins.CrumbIssuer = CrumbIssuer;
Jenkins.Job = Job;
Jenkins.Label = Label;
Jenkins.Node = Node;
Jenkins.Plugin = Plugin;
Jenkins.Queue = Queue;
Jenkins.View = View;

exports.Jenkins = Jenkins;
