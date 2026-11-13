---
title: "线程函数已经结束，为什么 joinable() 还是 true？"
date: 2026-11-13 22:20:00
tags:
  - C++
  - 多线程
categories:
  - C++ 学习
---

整理多线程笔记时，我发现自己很容易把 `joinable()` 理解成「这个线程还在运行吗？」顺着这个理解想，线程函数执行完以后，它就该返回 `false`。写个小程序一试，结果却是 `true`。

## 先等线程发出退出通知

在主线程里用 `sleep_for()` 等一会儿，只能说给了子线程一些运行时间。为了固定实验的先后顺序，我用 `std::promise` 在线程退出时发一个通知。

```cpp
#include <future>
#include <iostream>
#include <thread>

int main() {
    std::promise<void> exit_signal;
    auto exited = exit_signal.get_future();

    std::thread worker([&exit_signal] {
        exit_signal.set_value_at_thread_exit();
    });

    exited.wait();

    std::cout << std::boolalpha
              << "Before join: " << worker.joinable() << '\n';

    worker.join();

    std::cout << "After join:  " << worker.joinable() << '\n';
}
```

运行结果如下。

```text
Before join: true
After join:  false
```

`set_value_at_thread_exit()` 把通知安排在线程退出时发出，等该线程中具有线程存储期的对象都销毁后，`future` 才会就绪。`exited.wait()` 返回时，线程函数已经执行完，而主线程还没对 `worker` 调用 `join()`。 [C++ 标准草案：std::promise](https://eel.is/c++draft/futures.promise#23)

## `joinable()` 查的是线程对象

标准把 `joinable()` 定义为 `worker.get_id() != std::thread::id{}`。只要 `worker` 还关联着一个线程，它就会返回 `true`。线程函数执行完以后，这个关联依然存在。成功调用 `join()` 后，`worker.get_id()` 变回默认值，这时 `joinable()` 返回 `false`。 [C++ 标准草案：std::thread 成员函数](https://eel.is/c++draft/thread.thread.member)

| 观察时刻 | 线程函数的状态 | `worker.joinable()` |
| --- | --- | --- |
| 刚创建 `worker` | 可能还在执行，也可能已经结束 | `true` |
| `exited.wait()` 返回后 | 已结束 | `true` |
| `worker.join()` 返回后 | 已结束 | `false` |

## 漏掉 `join()` 会怎样

如果删掉示例中的 `worker.join()`，即使 `exited.wait()` 已经返回，程序仍会在 `worker` 析构时调用 `std::terminate()`。析构函数检查的是对象此刻是否还处于 `joinable` 状态。在线程需要由当前代码等待完成的场景里，`if (worker.joinable()) worker.join();` 检查的是这个对象是否仍然关联着一个可以等待的线程。 [C++ 标准草案：std::thread 析构函数](https://eel.is/c++draft/thread.thread.destr)

相关笔记：[C++ 多线程](https://my-site-pink-iota.vercel.app/notes/learning/cpp/cpp%E5%A4%9A%E7%BA%BF%E7%A8%8B)
