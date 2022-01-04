"use strict";
const constants = require("./const");
const semver = require("semver");
const log = require("@rainbow-lerna-cli/log");
const colors = require("colors");

class Command {
  _argv = [];
  _cmd = "";

  constructor(argv) {
    if (!argv) {
      throw new Error("必须传入参数");
    }
    if (!Array.isArray(argv)) {
      throw new Error("参数必须为数组");
    }
    if (argv.length < 1) {
      throw new Error("参数列表为空");
    }
    this._argv = argv;
    // console.log("argv", this._argv);
    // 链式预检查
    let chain = Promise.resolve();
    chain = chain.then(() => this.checkNodeVersion());
    chain = chain.then(() => this.initArgv());
    // 执行用户自己的逻辑
    chain = chain.then(() => this.init());
    chain = chain.then(() => this.exec());
    chain.catch((err) => log.error(err));
  }

  // 检查参数
  initArgv() {
    // Command对象
    this._cmd = this._argv[this._argv.length - 1];
    // command的参数列表
    this._argv = this._cmd.args;
  }

  // 检查node版本号
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = constants.LOWEST_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(
          `rainbow-cli requires Node higher than v${lowestVersion}, Please update your version of Node`
        )
      );
    }
  }
  init() {
    throw new Error("init必须实现！");
  }
  exec() {
    throw new Error("exec必须实现！");
  }
}

module.exports = Command;
