- 调用emitKeys，返回一个generator函数，但是没有执行函数里面的内容
- 调用next，执行到yield为止的代码
- `input.on('keypress', onkeypress)`  // events执行on方法(改写了on方法)，判断input是否监听了newListener事件，如果存在则会emit newListener事件
- 红线表示：用户输入的过程

- input.resume：如果input中断，则进行恢复

![readline](/Users/rainbow/Documents/前端/脚手架开发/project/rainbow-lerna-cli/images/week5/jiacan/readline.png)

## readline.createInterface方法干了什么

```js
function createInterface(input, output, completer, terminal) {
  return new Interface(input, output, completer, terminal);
}

function Interface(input, output, completer, terminal) {
  if (!(this instanceof Interface)) { // 如果不是以构造函数调用的，则转化为构造函数调用
    return new Interface(input, output, completer, terminal);
  }
  
  if (!this.terminal) {
	 ...
  } else {
    emitKeypressEvents(input, this); //核心代码
    input.on('keypress', onkeypress); // events执行on方法(改写了on方法)，判断input是否监听了newListener事件，如果存在则会emit newListener事件，并把'keypress'事件名称作为参数带给方法
    input.on('end', ontermend); // 执行onNewListener事件
    this.line = '';
    this._setRawMode(true); //默认是逐行监听，true为逐字监听  
  } 
 input.resume();
}

```

emitKeypressEvents方法

```JS
const KEYPRESS_DECODER = Symbol('keypress-decoder');
const ESCAPE_DECODER = Symbol(escape-decoder)

emitKeypressEvents(){
  if (stream[KEYPRESS_DECODER]) return; // 单例，如果执行过函数，就不在执行
  stream[KEYPRESS_DECODER] = new StringDecoder('utf8');
  stream[ESCAPE_DECODER] = emitKeys(stream); //核心代码，返回一个generator函数，只有调用next方法才会执行函数内容，执行到yield位置；函数被中断
  stream[ESCAPE_DECODER].next();  //执行emitKeys到yield位置，ch=undefined
  const triggerEscape = () => stream[ESCAPE_DECODER].next(''); //键盘点击esc的时候
  stream.on('newListener', onNewListener); //执行结束
}


function onNewListener(event) { // 在input.on('keypress',onkeypress) 和 stream.on('data', onData); 的时候；执行on方法都会被执行。
  if (event === 'keypress') {
    // 调用on会先执行onNewListener方法，第二次event='data'
    // 关键代码，给输入流监听用户输入，就会处于等待状态。
    stream.on('data', onData); 
    stream.removeListener('newListener', onNewListener); //event === 'keypress'的时候才会被执行
  }
}

//此时有end,pause,data，keypress事件
```

- 输入流上定义了‘data’，‘keypress’事件
- 执行emitKey方法到第一个yield位置

## rl.question方法

```js
Interface.prototype.question = function(query, cb) { //query='your name'
  if (typeof cb === 'function') {
    if (this._questionCallback) {
      this.prompt();
    } else { //执行到else
      this._oldPrompt = this._prompt;
      this.setPrompt(query);
      this._questionCallback = cb;
      this.prompt(); // 执行方法
    }
  }
};
```

### 用户输入

- 用户输入字符：进入data事件，触发onData方法
  - 执行generator函数，写入字符
  - 调用onKeypress方法
- 用户点击return，回车，进入data事件，触发onData方法
  - 调用callback

```js
function onData(input) {
  if (stream.listenerCount('keypress') > 0) {
    const string = stream[KEYPRESS_DECODER].write(input);
    if (string) {
      for (const character of string) {
        length += character.length;
        if (length === string.length) {
          iface.isCompletionEnabled = true;
        }

        try {
          stream[ESCAPE_DECODER].next(character); //关键代码
          // Escape letter at the tail position
          if (length === string.length && character === kEscape) {
            timeoutId = setTimeout(triggerEscape, escapeCodeTimeout);
          }
        } 
      }
    }
  } else {
    // Nobody's watching anyway
    stream.removeListener('data', onData);
    stream.on('newListener', onNewListener);
  }
}
```



