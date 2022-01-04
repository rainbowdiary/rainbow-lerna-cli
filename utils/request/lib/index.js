"use strict";

const axios = require("axios");

const BASE_URL = process.env.RAINBOW_CLI_BASE_URL //放入环境变量中参考：core/cli checkEnv()
  ? process.env.RAINBOW_CLI_BASE_URL
  : "http://book.youbaobao.xyz:7001";

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    Promise.reject(error);
  }
);

module.exports = request;
