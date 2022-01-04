"use strict";

const Package = require("@rainbow-lerna-cli/package");
const log = require("@rainbow-lerna-cli/log");
const { exec: spawn } = require("@rainbow-lerna-cli/utils");
const path = require("path");
const fs = require("fs");

// const cp = require("child_process");

const SETTINGS = {
  init: "@rainbow-lerna-cli/core",
};

const CACHE_DIR = "dependencies/";

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = "";
  let package1 = null;
  log.verbose("homePath", homePath);

  const cmdObj = arguments[arguments.length - 1]; //命令信息
  const packageName = SETTINGS[`${cmdObj.name()}`];
  const packageVersion = "latest";

  if (!fs.existsSync(targetPath)) {
    //生成目标路径
    targetPath = path.resolve(homePath, CACHE_DIR);
    //根据目标路径生成缓存路径
    storeDir = path.resolve(targetPath, "node_modules");
    log.verbose(
      "targetPath",
      !fs.existsSync(targetPath) ? "用户未指定targetPath" : targetPath
    );
    log.verbose("storeDir", storeDir);
    // 获取依赖包
    package1 = new Package({
      targetPath,
      storePath: storeDir,
      packageName,
      packageVersion,
    });

    try {
      if (await package1.exists()) {
        // 更新package
        await package1.update();
        log.info(`${package1.packageName}已存在，并更新到最新版本~`);
      } else {
        // 安装package
        await package1.install();
      }
    } catch (error) {
      log.error(error);
    }
  } else {
    // 可以不带storePath
    package1 = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }

  // 执行package1的执行文件
  const rootFile = package1.getRootFilePath();
  if (rootFile) {
    // 在当前进程中调用
    try {
      let args = Array.from(arguments);
      const cmd = args[args.length - 1];
      let o = Object.create(null);
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith("_") &&
          key !== "parent"
        ) {
          o[key] = cmd[key];
        }
      });
      o = { ...o, ...args[1] };
      args = [args[0], o];
      const code = `require('${rootFile}').call(null,${JSON.stringify(args)})`;
      const child = spawn("node", ["-e", code], {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      child.on("error", (e) => {
        log.error(e.message);
        process.exit(1);
      });
      child.on("exit", (e) => {
        log.verbose("命令执行成功：" + e);
        process.exit(e);
      });
    } catch (error) {
      log.error(error);
    }
  }
}

// 兼容windows和mac操作系统
// function spawn(command, argvs, options) {
//   const win32 = process.platform === "win32";
//   const cmd = win32 ? "cmd" : command;
//   const cmdArgs = win32 ? ["/c"].concat(command, argvs) : argvs;
//   //windows操作系统执行 cp.spawn('cmd',['/c','node','-e'],code)
//   return cp.spawn(cmd, cmdArgs, options || {});
// }

module.exports = exec;
