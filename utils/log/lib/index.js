"use strict";

const log = require("npmlog");

module.exports = log;

log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"; //根据环境变量定义log等级
log.addLevel("success", 2000, { fg: "green", bold: true }); //自定义log等级
log.heading = "rainbow"; //添加log前缀
log.headingStyle = { fg: "blue", bg: "black" }; //log前缀样式
