"use strict";

const pathExists = require("path-exists");
const path = require("path");
const pkgDir = require("pkg-dir").sync;
const { isObject } = require("@rainbow-lerna-cli/utils");
const formatPath = require("@rainbow-lerna-cli/format-path");
const npminstall = require("npminstall");
const fse = require("fs-extra");
const {
  getNpmRegistry,
  getNpmLatestVersion,
} = require("@rainbow-lerna-cli/npm-info");

class Package {
  constructor(props) {
    // props校验
    if (!props) {
      throw Error("Package的props不存在~");
    }
    if (!isObject(props)) {
      throw Error("Package的props必须是一个对象~");
    }
    // Package的路径
    this.targetPath = props.targetPath;
    // Package缓存路径
    this.storePath = props.storePath;
    // Package的name
    this.packageName = props.packageName;
    // Package的版本
    this.packageVersion = props.packageVersion;
    // 缓存依赖库目录的前缀
    this.cacheFilePathPrefix = this.packageName.replace("/", "_");
  }

  /**
   * 转换具体的版本号
   */
  async prepare() {
    if (this.storePath && !pathExists(this.storePath)) {
      // 缓存路径不存在，创建缓存路径
      fse.mkdirpSync(this.storePath);
    }
    // 拿到具体的版本号
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  // 使用属性方式调用时会动态的调用函数
  get cacheFilePath() {
    // 生成缓存的文件路径
    //查看安装的依赖库文件目录为：_@rainbow-lerna-cli_core@1.1.2@@rainbow-lerna-cli
    return path.resolve(
      this.storePath,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }

  getSpecificCacheFilePath(version) {
    return path.resolve(
      this.storePath,
      `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`
    );
  }

  // Package是否存在
  async exists() {
    if (this.storePath) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  // 安装Package
  async install() {
    await this.prepare();
    // 在升级npminstall版本为5.2.2之前，npminstall@5.2.1版本一直报错
    return npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getNpmRegistry(true), //自定义库
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }
  // Package更新
  async update() {
    await this.prepare();
    // 判断最新版本是否存在
    const newestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 判断最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(newestPackageVersion);
    // 如果最新版本路径不存在则安装
    const isLatestFilePathExist = await pathExists(latestFilePath);
    if (!isLatestFilePathExist) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getNpmRegistry(true), //自定义库
        pkgs: [{ name: this.packageName, version: newestPackageVersion }],
      });
      // 更新版本号为最新版本号
      this.packageVersion = newestPackageVersion;
    } else {
      // 目录存在也要更新版本号为最新版本号
      this.packageVersion = newestPackageVersion;
    }
  }
  // 获取入口文件
  getRootFilePath() {
    // 1.获取package.json所在路径 pkg-dir
    const _getRootFile = (targetPath) => {
      // 有指定目录
      const dir = pkgDir(targetPath);
      if (dir) {
        // 2.获取package.json
        const pkgFile = require(path.resolve(dir, "package.json"));
        // 3.寻找 main/lib
        if (pkgFile && (pkgFile.main || pkgFile.bin)) {
          // 4.路径的兼容（macOS/windows）
          return formatPath(
            path.resolve(dir, pkgFile.main || Object.values(pkgFile.bin)[0])
          );
        }
      }
    };
    if (this.storePath) {
      // 有缓存目录
      return _getRootFile(this.cacheFilePath);
    } else {
      return _getRootFile(this.targetPath);
    }
  }
}

module.exports = Package;
