## ansi-escapes

文档：https://handwiki.org/wiki/ANSI_escape_code

在终端通过转义字符实现特殊操作。

- 字体变化
- 字符颜色
- 光标上移下移

- `\x`: 十六进制数
- `1B[`: 固定的
- `31`: 查询文档对应的颜色值，FG 为字符颜色，BG 为选中内容颜色
- `m`: （CSI： ANSI control sequences）渲染函数
- %s: 参考 console.log 使用

- `\x1B[31m`: 31 红色字符
- `\x1B[41m`: 41 红色背景色
- `\x1B[4m`: 4 下划线

```js
console.log("\x1B[31m%s", "yourName"); //输出内容为红色
console.log("\x1B[41m%s", "yourName"); //输出内容的背景色为红色
console.log("\x1B[41m%s\x1B[0m", "yourName"); //输出内容的背景色为红色，\x1B[0m复原
console.log("\x1B[32m\x1B[4m%s", "yourName"); //背景色为绿色，下划线
```

## rxjs

https://pan.baidu.com/s/1DCWPgPyPSYneTyOBIGaZVw











