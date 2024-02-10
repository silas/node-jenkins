const urlParse = require("url").parse;

/**
 * Common options
 */
function options(req, opts) {
  if (!req.query) req.query = {};

  if (typeof opts.depth === "number") {
    req.query.depth = opts.depth;
  }

  if (typeof opts.tree === "string") {
    req.query.tree = opts.tree;
  }

  return opts;
}

/**
 * Raw path param
 */
class RawParam {
  constructor(value) {
    this.encode = false;
    this.value = value || "";
  }

  toString() {
    return this.value;
  }
}

/**
 * Parse job name from URL
 */
function parseName(value) {
  const jobParts = [];

  const pathParts = (urlParse(value).pathname || "").split("/").filter(Boolean);
  let state = 0;
  let part;

  // iterate until we find our first job, then collect the continuous job parts
  //   ['foo', 'job', 'a', 'job', 'b', 'bar', 'job', 'c'] => ['a', 'b']
  loop: for (let i = 0; i < pathParts.length; i++) {
    part = pathParts[i];

    switch (state) {
      case 0:
        if (part === "job") state = 2;
        break;
      case 1:
        if (part !== "job") break loop;
        state = 2;
        break;
      case 2:
        jobParts.push(part);
        state = 1;
        break;
    }
  }

  return jobParts.map(decodeURIComponent);
}

/**
 * Path for folder plugin
 */
class FolderPath {
  SEP = "/job/";

  constructor(value) {
    if (Array.isArray(value)) {
      this.value = value;
    } else if (typeof value === "string") {
      if (value.match("^https?://")) {
        this.value = parseName(value);
      } else {
        this.value = value.split("/").filter(Boolean);
      }
    } else {
      this.value = [];
    }
  }

  isEmpty() {
    return !this.value.length;
  }

  name() {
    return this.value[this.value.length - 1] || "";
  }

  path(sep) {
    if (this.isEmpty()) return new RawParam();
    if (!sep) sep = this.SEP;

    return new RawParam(sep + this.value.map(encodeURIComponent).join(sep));
  }

  parent() {
    return new FolderPath(
      this.value.slice(0, Math.max(0, this.value.length - 1))
    );
  }

  dir() {
    return this.parent().path();
  }
}

/**
 * Default crumb issuser
 */
async function crumbIssuer(jenkins) {
  const data = await jenkins.crumbIssuer.get();

  if (!data || !data.crumbRequestField || !data.crumb) {
    throw new Error("Failed to get crumb");
  }

  return {
    headerName: data.crumbRequestField,
    headerValue: data.crumb,
    cookies: data.cookies,
  };
}

/**
 * Check if object is file like
 */
function isFileLike(v) {
  return (
    Buffer.isBuffer(v) ||
    (v !== null &&
      typeof v === "object" &&
      typeof v.pipe === "function" &&
      v.readable !== false)
  );
}

/**
 * Parse arguments
 */
function parse(args, ...names) {
  let last = args.length - 1;

  let opts;
  if (typeof args[last] === "object") {
    if (args[last] === null) {
      opts = {};
    } else {
      opts = clone(args[last]);
    }
    last--;
  } else {
    opts = {};
  }

  for (let i = 0; i <= last; i++) {
    const name = names[i];
    const arg = args[i];

    if (name && arg !== null && arg !== undefined) {
      opts[name] = arg;
    }
  }

  return opts;
}

/**
 * Shallow clone
 */
function clone(src) {
  return Object.assign({}, src);
}

exports.options = options;
exports.folderPath = (value) => new FolderPath(value);
exports.crumbIssuer = crumbIssuer;
exports.isFileLike = isFileLike;
exports.clone = clone;
exports.parse = parse;
