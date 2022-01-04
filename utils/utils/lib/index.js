"use strict";

const isObject = (o) => {
  return Object.prototype.toString.call(o) === "[object Object]";
};

const spinnerStart = (message = "processing..", SpinnerString = "|/-\\") => {
  var Spinner = require("cli-spinner").Spinner;
  var spinner = new Spinner(message + " %s");
  spinner.setSpinnerString(SpinnerString);
  spinner.start();
  return spinner;
};

const sleep = async (timeout) => {
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

// 兼容windows和mac操作系统
function exec(command, argvs, options) {
  const win32 = process.platform === "win32";
  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, argvs) : argvs;
  //windows操作系统执行 cp.spawn('cmd',['/c','node','-e'],code)
  return require("child_process").spawn(cmd, cmdArgs, options || {});
}

// 异步exec
function execAsync(command, argvs, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, argvs, options);
    p.on("error", (e) => {
      reject(e);
    });
    p.on("exit", (c) => {
      resolve(c);
    });
  });
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execAsync,
};
