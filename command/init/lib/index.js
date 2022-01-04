const Command = require("@rainbow-lerna-cli/command");
const log = require("@rainbow-lerna-cli/log");
const Package = require("@rainbow-lerna-cli/package");
const { spinnerStart, sleep, execAsync } = require("@rainbow-lerna-cli/utils");
const fs = require("fs");
const userHome = require("user-home");
const fse = require("fs-extra");
const inquirer = require("inquirer");
const semver = require("semver");
const glob = require("glob");
const ejs = require("ejs");
const path = require("path");
// 1.3 通过egg.js获取mongodb中的数据并且通过API返回
const getProjectTemplate = require("./getProjectTemplate");

const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";

const WHITE_COMMAND = ["npm", "cnpm"];

class initCommand extends Command {
  // 当前用户选择的从数据库中请求到的模板信息
  templateInfo = "";
  // 当前模板使用new Package生成的包
  templateNpm = "";
  init() {
    this.projectName = this._argv[0] || "";
    this.force = this._cmd.force;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  async exec() {
    try {
      // 1. 准备阶段
      const projectInfo = await this.prepare();
      if (!!projectInfo) {
        log.verbose("projectInfo", projectInfo);
        this.projectInfo = projectInfo;

        // 2. 下载模板
        await this.dowloadTemplate();
        // 3. 安装模板
        await this.installTemplate();
      }
    } catch (e) {
      log.error(e.message);
      if (process.env.LOG_LEVEL === "verbose") {
        console.log(e);
      }
    }
  }

  /**
   * 安装模板
   */
  async installTemplate() {
    log.verbose("templateInfo", this.templateInfo);
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        await this.installNormalTemplate();
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        await this.installCustomTemplate();
      } else {
        throw new Error("无法识别项目模板类型！");
      }
    } else {
      throw new Error("项目模板不存在！");
    }
  }

  /**
   * 标准模板安装
   */
  async installNormalTemplate() {
    let installRet;
    // 拷贝缓存目录中的模板代码到当前目录
    const spinner = spinnerStart("正在安装模板...");
    await sleep();
    try {
      const templatePath = path.resolve(
        this.templateNpm.cacheFilePath,
        "template"
      );
      const targetPath = process.cwd();
      fse.ensureDirSync(templatePath); //如果目录不存在会创建
      fse.ensureDirSync(targetPath);
      fse.copySync(templatePath, targetPath);
    } catch (e) {
      throw e;
    } finally {
      spinner.stop(true);
      log.success("模板安装成功");
    }
    const ignore = [
      "node_moduels",
      "public/**",
      "README.*",
      "LICENSE",
      ".editorconfig",
      ".env.*",
      "src/icons/**",
      "src/assets/**",
    ];
    // ejs模板渲染package.jso
    await this.ejsRender({ ignore });
    const { installCommand, startCommand } = this.templateInfo;
    // 依赖安装
    await this.execCommand(installCommand, "依赖安装失败！");
    // 启动命令
    await this.execCommand(startCommand, "启动项目失败！");
  }

  /**
   * 自定义模板安装
   */
  async installCustomTemplate() {
    console.log("custom template");
  }

  /**
   * 下载项目模板
   */
  async dowloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find(
      (item) => item.npmName === projectTemplate
    );
    const { npmName, version } = templateInfo;
    this.templateInfo = templateInfo;
    const targetPath = path.resolve(userHome, ".rainbow-lerna-cli", "template");
    const storePath = path.resolve(targetPath, "node_modules");

    const templateNpm = new Package({
      targetPath,
      storePath,
      packageName: npmName,
      packageVersion: version,
    });
    if (!(await templateNpm.exists())) {
      const spinner = spinnerStart("正在下载模板..."); // 命令行加载效果
      await sleep();
      try {
        await templateNpm.install();
      } catch (error) {
        throw error;
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) log.success("模板下载成功");
      }
    } else {
      const spinner = spinnerStart("正在更新模板...");
      await sleep();
      try {
        await templateNpm.update();
      } catch (error) {
        throw error;
      } finally {
        spinner.stop(true);
        log.verbose("templateNpm", templateNpm);
        this.templateNpm = templateNpm;
        if (await templateNpm.exists()) log.success("模板更新成功");
      }
    }
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg.js搭建一套后端系统:rainbow-cli-dev-server
    // 1.2 通过项目模板信息存储到mongodb数据库:rainbow-cli-dev-server
    // 1.3 通过egg.js获取mongodb中的数据并且通过API返回
  }

  /**
   * 模板渲染，替换package.json的name和version
   */
  ejsRender(options) {
    const dir = process.cwd();
    const projectInfo = this.projectInfo;
    return new Promise((resolve, reject) => {
      glob(
        "**",
        { cwd: dir, ignore: options.ignore, nodir: true },
        (err, file) => {
          if (err) {
            reject(err);
          }
          Promise.all(
            file.map((file) => {
              const filePath = path.join(dir, file);
              return new Promise((resolve1, reject1) => {
                // ejs渲染每个文件
                ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                  if (err) {
                    reject1(err);
                  } else {
                    // ejs读取的是字符串，并没有把字符串写入文件，需要把文件内容写入文件
                    fse.writeFileSync(filePath, result);
                    resolve1(result);
                  }
                });
              });
            })
          )
            .then(() => {
              return resolve();
            })
            .catch((err) => {
              reject(err);
            });
        }
      );
    });
  }

  /**
   * 执行命令
   */
  async execCommand(command, errMsg) {
    let ret;
    if (command) {
      const cmdArray = command.split(" ");
      const cmd = this.checkCommamd(cmdArray[0]);
      if (!cmd) {
        throw new Error("命令不存在！命令: " + command);
      }
      const args = cmdArray.slice(1);
      ret = await execAsync(cmd, args, {
        stdio: "inherit", //将子进程的输出流输出到当前进程
        cwd: process.cwd(),
      });
    }
    if (ret !== 0) {
      throw new Error(errMsg);
    }
    return ret;
  }

  /**
   * 检查命令是否在白名单内
   * @param {*} cmd
   * @returns
   */
  checkCommamd(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd;
    }
    return null;
  }

  async prepare() {
    // 0. 判断项目模板是否存在(1.3 通过egg.js获取mongodb中的数据并且通过API返回)
    try {
      const template = await getProjectTemplate();
      if (!template || template.length === 0) {
        throw new Error("项目模板不存在");
      }
      this.template = template;
    } catch (error) {
      console.log(error);
    }

    // 1. 判断当前目录是否为空
    const localPath = process.cwd(); //path.resolve(".")也可以  //开发阶段切换到桌面的/Users/rainbow/Desktop/test
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      // 1.1 询问是否继续创建
      if (!this.force) {
        const res = await inquirer.prompt({
          type: "confirm",
          name: "ifContinue",
          default: false,
          message: "当前文件夹不为空，是否继续创建项目？",
        });
        ifContinue = res.ifContinue;
      }
      // 2. 是否启动强制更新
      if (ifContinue || this.force) {
        // 二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: "confirm",
          name: "confirmDelete",
          default: false,
          message: "是否确认清空当前文件夹下的文件？",
        });
        if (confirmDelete) {
          // 清空当前文件夹
          fse.emptyDirSync(localPath);
          console.log("清空文件夹完成~");
        } else {
          return;
        }
      } else {
        return;
      }
    }
    return await this.getProjectInfo();
  }

  async getProjectInfo() {
    let projectInfo = {};
    const isValidName = (v) => {
      return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
        v
      );
    };
    const isValidProjectName = isValidName(this.projectName);
    const projectNamePrompt = {
      type: "input",
      name: "projectName",
      message: "请输出项目名称",
      validate(v) {
        var done = this.async();
        setTimeout(function () {
          /**
           * 1. 首字符必须为英文字符
           * 2. 尾字符必须为英文或数字，不能为字符
           * 3. 字符仅允许"_-"
           */
          if (!isValidName(v)) {
            done("请输入合法的项目名称");
            return;
          }
          done(null, true);
        }, 0);
      },
      filter(v) {
        return v;
      },
    };
    const promptArr = [];
    if (isValidProjectName) {
      projectInfo.projectName = this.projectName;
    } else {
      promptArr.push(projectNamePrompt);
    }
    promptArr.push(
      {
        type: "input",
        name: "projectVersion",
        message: "请输出项目版本",
        default: "1.0.0",
        validate(v) {
          var done = this.async();
          setTimeout(function () {
            if (!!!semver.valid(v)) {
              done("请输出正确的版本号");
              return;
            }
            done(null, true);
          }, 0);
        },
        filter(v) {
          return semver.valid(v);
        },
      },
      {
        type: "list",
        name: "projectTemplate",
        message: "请选择项目模板",
        choices: this.projectTemplate(),
      }
    );

    // 1. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "请选择初始化类型",
      default: TYPE_PROJECT,
      choices: [
        {
          name: "项目",
          value: TYPE_PROJECT,
        },
        {
          name: "组件",
          value: TYPE_COMPONENT,
        },
      ],
    });
    // 2. 获取项目的基本信息
    if (type === TYPE_PROJECT) {
      const project = await inquirer.prompt(promptArr);
      projectInfo = {
        ...projectInfo,
        type,
        ...project,
      };
    } else if (type === TYPE_COMPONENT) {
    }
    // 格式化项目名称为className形式 AbcEfg=>abc-efg
    if (projectInfo.projectName) {
      projectInfo.projectName = require("kebab-case")(
        projectInfo.projectName
      ).replace(/^-/, "");
      projectInfo.className = projectInfo.projectName;
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion;
    }
    return projectInfo;
  }

  isDirEmpty = (localPath) => {
    const fileList = fs
      .readdirSync(localPath)
      .filter(
        (file) => !file.startsWith(".") && ["node_modules"].indexOf(file) < 0
      );
    return !fileList || fileList.length === 0;
  };

  projectTemplate() {
    return this.template.map((tem) => ({ value: tem.npmName, name: tem.name }));
  }
}

function init(argv) {
  return new initCommand(argv);
}

module.exports = init;
module.exports.initCommand = initCommand;
