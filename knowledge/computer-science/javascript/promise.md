# 手写 Promise

> 从发明者的角度理解 Promise，手写一个符合 Promises/A+ 规范的 Promise 类

## 为什么需要 Promise？

以前我们用回调函数处理异步任务，但嵌套太深会导致「回调地狱」：

```javascript
fetchData(function(a) {
  processA(a, function(b) {
    processB(b, function(c) {
      processC(c, function(d) {
        // 嵌套到天荒地老
      });
    });
  });
});
```

Promise 发明出来就是为了解决这三个问题：
1. 回调嵌套 → 链式 `.then()`
2. 错误处理难 → 统一 `.catch()`
3. 代码难读 → 线性代码

## 三种状态

```
pending    ──→  fulfilled  (成功)
   │              ↘
   │                rejected  (失败)
   └──────────────────────↗
```

- `pending`：任务还在做，不知道结果
- `fulfilled`：成功了！
- `rejected`：失败了！

⚠️ 状态一旦改变就不能再改

## 完整代码

```javascript
// 状态常量
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    this.state = PENDING;
    this.value = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state !== PENDING) return;
      if (value instanceof MyPromise) {
        return value.then(resolve, reject);
      }
      this.state = FULFILLED;
      this.value = value;
      queueMicrotask(() => {
        this.onFulfilledCallbacks.forEach(cb => cb(this.value));
      });
    };

    const reject = (reason) => {
      if (this.state !== PENDING) return;
      this.state = REJECTED;
      this.value = reason;
      queueMicrotask(() => {
        this.onRejectedCallbacks.forEach(cb => cb(this.value));
      });
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const _onFulfilled = typeof onFulfilled === 'function' 
        ? onFulfilled 
        : value => value;
      const _onRejected = typeof onRejected === 'function'
        ? onRejected
        : reason => { throw reason; };

      if (this.state === FULFILLED) {
        queueMicrotask(() => {
          try {
            const x = _onFulfilled(this.value);
            resolvePromise(x, resolve, reject);
          } catch (error) { reject(error); }
        });
      } else if (this.state === REJECTED) {
        queueMicrotask(() => {
          try {
            const x = _onRejected(this.value);
            resolvePromise(x, resolve, reject);
          } catch (error) { reject(error); }
        });
      } else {
        this.onFulfilledCallbacks.push(value => {
          try {
            const x = _onFulfilled(value);
            resolvePromise(x, resolve, reject);
          } catch (error) { reject(error); }
        });
        this.onRejectedCallbacks.push(reason => {
          try {
            const x = _onRejected(reason);
            resolvePromise(x, resolve, reject);
          } catch (error) { reject(error); }
        });
      }
    });
  }

  catch(onRejected) { return this.then(null, onRejected); }

  finally(onFinally) {
    return this.then(
      value => { onFinally(); return value; },
      reason => { onFinally(); throw reason; }
    );
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let completed = 0;
      if (promises.length === 0) { resolve(results); return; }
      promises.forEach((promise, index) => {
        promise.then(
          value => { results[index] = value; completed++; if (completed === promises.length) resolve(results); },
          reject
        );
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => promise.then(resolve, reject));
    });
  }
}

function resolvePromise(x, resolve, reject) {
  if (x === resolve) { return reject(new TypeError('Chaining cycle detected!')); }
  if (x instanceof MyPromise) {
    if (x.state === PENDING) {
      x.then(y => resolvePromise(y, resolve, reject), reject);
    } else { x.then(resolve, reject); }
    return;
  }
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let called = false;
    try {
      const then = x.then;
      if (typeof then === 'function') {
        then.call(x, 
          y => { if (called) return; called = true; resolvePromise(y, resolve, reject); },
          r => { if (called) return; called = true; reject(r); }
        );
      } else { resolve(x); }
    } catch (error) { if (called) return; reject(error); }
    return;
  }
  resolve(x);
}
```

## 举例

**例 1：基本用法**
```javascript
const p = new MyPromise((resolve, reject) => {
  setTimeout(() => resolve('成功！'), 1000);
});
p.then(result => console.log(result)); // 1秒后输出：成功！
```

**例 2：链式调用**
```javascript
new MyPromise(resolve => resolve(1))
  .then(x => { console.log(x); return x + 1; })
  .then(x => { console.log(x); return x + 1; })
  .then(x => console.log(x)); // 1, 2, 3
```

**例 3：all 并行**
```javascript
const p1 = new MyPromise(r => setTimeout(() => r(1), 100));
const p2 = new MyPromise(r => setTimeout(() => r(2), 200));
MyPromise.all([p1, p2]).then(results => console.log(results)); // [1, 2]
```

## 核心要点

1. **resolve/reject 是 executor 传进来的**，不是 then 用的
2. **then 返回新的 Promise**，这样才能链式调用
3. **回调都异步执行**，用 queueMicrotask
4. **resolvePromise 处理返回值**，支持 Promise 和 thenable
5. **值的穿透**：then 的参数默认值是透传

## 参考

- [Promises/A+ 官方规范](https://promisesaplus.com/)
- [一步一步实现完整 Promise - GitHub](https://github.com/xieranmaya/blog/issues/3)