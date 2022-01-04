"use strict";

const urljoin = require("url-join");
const axios = require("axios");
const semver = require("semver");

/**
 * 获取当前npm上所有pkgName的npm信息
 * return {}
 * */
function getNpmInfo(pkgName, Originalegistry) {
  // 根据npm api获取npm对应库的信息
  // 获取registry registry+pkgName
  // 调用npm接口，获取npm数据
  if (!pkgName) {
    return null;
  }
  const registry = Originalegistry || getNpmRegistry();
  const npmApi = urljoin(registry, pkgName);
  return axios
    .get(npmApi)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      } else {
        return null;
      }
    })
    .catch((err) => {
      throw new Error(err.message);
    });
}

/**
 * 获取当前npm上所有pkgName的版本号
 * return [版本1, 版本2...]
 * */
async function getNpmVersions(pkgName, registry) {
  const npmInfos = await getNpmInfo(pkgName, registry);
  if (npmInfos) {
    return Object.keys(npmInfos.versions);
  } else {
    return null;
  }
}

/**
 * 获取大于当前baseVersion的版本号
 * return string[] 如果当前版本号是1.1.0,则会返回大于等于1.1.0版本的版本集合，对结果进行排序
 * */
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter((v) => semver.satisfies(v, `^${baseVersion}`))
    .sort((a, b) => semver.gt(b, a)); // 这个不能对版本号进行排序
}

async function getNpmSemverVersions(currentVersion, npmName) {
  const allVersions = await getNpmVersions(npmName);
  const semverVersions = getSemverVersions(currentVersion, allVersions);
  if (semverVersions && semverVersions.length > 0) {
    return semverVersions[0];
  } else {
    return null;
  }
}

function getNpmRegistry(isOrignal = false) {
  return isOrignal
    ? "https://registry.npmjs.org/"
    : "https://registry.npm.taobao.org/";
}

async function getNpmLatestVersion(pkgName, registry) {
  let versions = await getNpmVersions(pkgName, registry);
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[0];
  }
  return null;
}

module.exports = {
  getNpmVersions,
  getNpmSemverVersions,
  getNpmRegistry,
  getNpmLatestVersion,
};
