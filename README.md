# rainbow-lerna-cli

#### Description

使用 lerna 管理一个脚手架项目

#### 软件架构

# rainbow-build-cli 脚手架搭建

## 脚手架拆包策略：

- 核心流程：core
- 命令：command
  - 初始化
  - 发布
  - 清除缓存
- 模型层：models
  - Command 命令
  - Project 项目
  - Component 组件
  - Npm 模块
  - Git 仓库
- 支撑模块：utils
  - Git 操作
  - 云构建
  - 工具方法
  - API 请求
  - Git API

## core 模块初始化

1. 使用本地脚手架
   import-local
1. 检查 node 版本

#### Installation

`npm i -g @rainbow-lerna-cli/core`

#### debug 模式

- 命令：`rainbow-cli init --debug`
- 参数中带有 debug
  log.level=verbose;
  如果不是 debug 模式，log.level=info

- 执行库文件`@rainbow-lerna-cli/exec`

##### 初始化安装依赖包

执行`rainbow-cli init`可以安装多个依赖包
统一将依赖包抽取出库`@rainbow-lerna-cli/package`

_依赖包安装位置_

- 用户自定：`rainbow-cli init <packageName> --targetPath /Users/rainbow/.rainbow-test`
- 如果用户未指定--targetPath: 则生成 targetPath=`${homePath}/dependencies/`

_指定 targetPath 依赖包路径，执行依赖包指定的 bin 对应的入口文件_

`rainbow-cli init test --debug --targetPath /Users/rainbow/Documents/前端/脚手架开发/rainbow-lerna-cli/command/init/lib `

- 执行依赖包的执行文件`@rainbow-lerna-cli/core`

# 参考项目

https://github.com/imooc-lego/students-learn-task

# command/init

## prepare

- 判断用户 process.cwd 目录是否为空
  - 是
    - ‘当前文件夹不为空，是否继续创建项目？’
      - 是或有--force
        - 是否确认清空当前文件夹下的文件？
          - 是
            - 清空 process.cwd 目录
              - 选择下初始化类型
                - 项目
                  - 选择项目名称
                  - 选择项目版本
                - 组件
            - 返回项目信息 projectInfo
          - 否
      - 否
        - 退出操作
  - 否
    - 退出操作

## egg.js 创建后端项目`rainbow-cli-dev-server`

## dowloadTemplate 下载模板

_使用库_
user-home、@rainbow-lerna-cli/package

- 获取 Package

```js
let tartgetPath = path.resolve(userHome, ".imooc-cli-dev", "template");
let storePath = path.resolve(tartgetPath, "node_modules");
templateNpm = new Package({ tartgetPath, storePath, npmName, npmVerion });
```

如果 templateNpm 不存在则 templateNpm.install，不然 templateNpm.update

- 安装模板的时：命令行加载效果：cli-spinner
  - 封装 utils/utils spinner()

### 测试用例

templateNpm.update();逻辑兼容：npm 版本号不存在的异常情况

- 数据库版本号错误模拟
- 发布新的版本号模拟

# 安装模板

- ejs 模板渲染功能
- glob 文件筛选
- 项目标准安装和自定义安装

## 项目标准安装

_数据库字段_

- type: 'normal'

_流程_

1. 将缓存目录中的代码拷贝到命令执行目录；
2. 下载模板依赖
3. 启动模板命令
   _数据库字段_

- installCommand: 'npm install'
- startCommand: 'npm run serve'

_spawn 方法执行模板安装命令和模板启动命令_

- 定义@rainbow-lerna-cli/utils 的 execAsync 方法
- 测试："installCommand" : "cnpm install --registry=https://registry.npm.taobao.org",

_Command 白名单_

- 避免危险命令操作
  `const WHITE_COMMAND = ["npm", "cnpm"];`

## 项目模板改造

改造模板：`rainbow-cli-dev-template-vue2'`
package.json 文件，name 和 version 为用户输出的内容，改为模板 ejs 模板渲染

- 将输入的项目名称格式化： kebab-case

## ejs 模板渲染

- 将 npm 包中的模板 package.json name 和 version 修改为 ejs 变量形式

- 使用 ejs 和 glob 库找到 process.cwd 目录下的文件，使用 ejs 将文件中的变量渲染为用户输入的 projectInfo 中的 version 和 name

## 兼容项目名称

- 如果使用 rainbow-cli init [projectName]输入了项目名称
- 判断合法性，如果合法则不再让用户手动输入项目名称
- 如果不合法，让用户手动输入项目名称

## 测试组件库

`https://github.com/imooc-lego/lego-components`

_主要内容_

- 脚手架安装模板功能架构设计
- 脚手架模板安装核心实现：ejs 库功能详解
- 脚手架项目模板安装功能开发
- 组件模板开发及脚手架组件初始化功能支持
- 脚手架自定义初始化项目模板功能开发
