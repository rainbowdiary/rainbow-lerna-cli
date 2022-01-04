"use strict";

const path = require("path");

function formatPath(p) {
  if (p && typeof p === "string") {
    const sep = path.sep; //路径分隔符
    if (sep === "/") {
      return p;
    } else {
      return p.replace(/\\/, "/");
    }
  }

  return p;
}

module.exports = formatPath;
