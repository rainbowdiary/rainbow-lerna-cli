"use strict";

const log = require("@rainbow-lerna-cli/log");
const { getNpmSemverVersions } = require("@rainbow-lerna-cli/npm-info");
const init = require("@rainbow-lerna-cli/init");
const exec = require("@rainbow-lerna-cli/exec");
const semver = require("semver");
const colors = require("colors/safe");
const path = require("path");
const constants = require("../lib/const");
const { DEFAULT_CLI_HOME } = constants;
const pkg = require("../package.json");
const userHome = require("user-home");
const pathExists = require("path-exists");

let argvs = {};

module.exports = core;

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (error) {
    if (process.env.LOG_LEVEL === "verbose") {
      console.log(error);
    }
  }
}

// 命令注册
function registerCommand() {
  const { Command } = require("commander");
  const program = new Command();
  program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)
    .usage("<command> [options]")
    .option("-d --debug", "是否开启调试模式", false) //注册全局参数
    .option("-tp,--targetPath [targetPath]", "是否指定本地调试路径");

  // command注册命令
  const clone = program.command("clone <source> [destination]"); //<>表示必须传入 []为可选
  clone
    .description("clone a reposity")
    .action((source, destination, Optionsobj) => {
      console.log("this is clone command", source, destination);
    });

  // 注册init命令
  program
    .command("init [projectName]") //<>表示必须传入 []为可选
    .description("init a reposity")
    .option("-f, --force", "是否开启调试模式", false)
    .option("-a, --abc", "测试option", false)
    .action(exec);

  // rainbow-cli --debug
  program.on("option:debug", () => {
    process.env.LOG_LEVEL = "verbose";
    log.level = process.env.LOG_LEVEL;
    log.verbose("debug", "debug调试模式");
  });

  // rainbow-cli --targetPath 监听全局参数
  program.on("option:targetPath", (arg) => {
    process.env.CLI_TARGET_PATH = arg;
  });

  // 监听未知命令
  program.on("command:*", (arg) => {
    log.error(colors.red(`未知命令 ${arg[0]}`));
    const availableCommands = program.commands.map((cmd) => cmd.name());
    if (availableCommands.length > 0) {
      console.log(`可用命令： ${availableCommands.join(",")}`);
    }
  });

  program.parse(process.argv);

  // 如果没有输出command则提示帮助文档;program.args拿到输入的命令
  if (program.args && program.args.length === 0) {
    program.outputHelp();
    console.log();
  }
}

// 预检查
async function prepare() {
  checkPkgVersion();
  // checkNodeVersion();
  checkRoot();
  checkUserHome();
  //  checkInputArgv();
  // checkArgv();
  checkEnv();
  await checkGlobalUpdate();
}

//检查版本更新
async function checkGlobalUpdate() {
  //使用npm接口拿到所有的版本号 https://registry.npmjs.org/@rainbow-lerna-cli/core
  // 比对版本号，提示更新最新的版本号
  const npmName = pkg.name;
  const currentPkgVersion = pkg.version;
  const lastVersion = await getNpmSemverVersions(currentPkgVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentPkgVersion)) {
    log.warn(
      colors.yellow(
        `请手动更新 ${npmName}，当前版本：${currentPkgVersion}, 最新版本：${lastVersion}
        更新命令： npm install -g @rainbow-lerna-cli/core
        `
      )
    );
  }
}

// 检查环境变量
function checkEnv() {
  // 默认查看当前目录下的.env文件
  const dotenv = require("dotenv");
  const dotEnvPath = path.resolve(userHome, ".env");
  let config = {};
  if (pathExists(dotEnvPath)) {
    dotenv.config({
      path: dotEnvPath,
    });
  }
  config = createDefaultCliPath();
}

function createDefaultCliPath() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

// 检查入参
// function checkInputArgv() {
//   const minimist = require("minimist");
//   argvs = minimist(process.argv.slice(2));
// }

// 如果为debug模式则设置log等级为verb ==>改为使用commander库监听debug
// function checkArgv() {
//   if (argvs.debug) {
//     process.env.LOG_LEVEL = "verbose";
//   } else {
//     process.env.LOG_LEVEL = "info";
//   }
//   log.level = process.env.LOG_LEVEL;
//   // log.verbose("debug", "test debug"); //debug日志就可以打印出来了
// }

// 检查用户主目录
function checkUserHome() {
  const userHome = require("user-home");
  const pathExists = require("path-exists").sync;
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"));
  }
}

// root降级
function checkRoot() {
  //如果一个文件是root账户创建的，那么普通用户是无法操作的，所以会报错各种权限问题
  //修改uid，账户降级
  const rootCheck = require("root-check");
  rootCheck();
}

// 检查node版本号 下层到各Command中
// function checkNodeVersion() {
//   const currentVersion = process.version;
//   const lowestVersion = constants.LOWEST_VERSION;
//   if (!semver.gte(currentVersion, lowestVersion)) {
//     throw new Error(
//       colors.red(
//         `rainbow-cli requires Node higher than v${lowestVersion}, Please update your version of Node`
//       )
//     );
//   }
// }

function checkPkgVersion() {
  const currentPkgVersion = pkg.version;
  const lowestPkgVersion = constants.LOWEST_PKG_VERSION;
  // 版本大于等于
  if (!semver.gte(currentPkgVersion, lowestPkgVersion)) {
    throw new Error(
      `rainbow-cli suggest version higher than v${lowestPkgVersion}, Please update your version of rainbow-cli`
    );
  } else {
    log.info("cli", currentPkgVersion);
  }
}
