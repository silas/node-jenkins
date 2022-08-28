const events = require("events");

const utils = require("./utils");

class LogStream extends events.EventEmitter {
  constructor(jenkins, opts) {
    super();

    this._jenkins = jenkins;

    opts = utils.clone(opts || {});

    this._delay = opts.delay || 1000;
    delete opts.delay;

    this._opts = opts;
    this._opts.meta = true;

    process.nextTick(() => {
      this._run();
    });
  }

  /**
   * End watch
   */
  end() {
    clearTimeout(this._timeoutId);

    if (this._end) return;
    this._end = true;

    this.emit("end");
  }

  /**
   * Error helper
   */
  _err(err) {
    if (this._end) return;

    this.emit("error", err);

    this.end();
  }

  /**
   * Run
   */
  async _run() {
    if (this._end) return;

    try {
      const data = await this._jenkins.build.log(this._opts);
      if (this._end) return;

      if (typeof data.text === "string") this.emit("data", data.text);

      if (!data.more) return this.end();
      if (data.size) this._opts.start = data.size;

      this._timeoutId = setTimeout(() => {
        this._run();
      }, this._delay);
    } catch (err) {
      if (this._end) return;
      return this._err(err);
    }
  }
}

exports.LogStream = LogStream;
