# iOS 开发资料导读

按手头的问题选择资料。Apple 的 API 文档用于确认公开契约和可用系统版本，WWDC 与示例工程适合跟踪一个实现，团队复盘适合提出值得在本项目里验证的假设。查版本相关行为时，从当前 target、SDK 和依赖锁文件出发。

## 从现象找到第一份证据

| 项目里的问题 | 先做什么 | 资料与角色内手册 |
| --- | --- | --- |
| 列表重排后，输入框里的草稿跑到了另一行 | 输入两份不同草稿，再交换顺序。对照数据 ID、视图 identity 和状态所有者。 | [Demystify SwiftUI · WWDC21](https://developer.apple.com/videos/play/wwdc2021/10022/) · [SwiftUI 状态与导航](../skills/ios-swiftui/SKILL.md) |
| 从零做一个 iPhone 清单，新增和编辑该放在哪里 | 先跑通新增、保存、返回和重开。再根据用户是在切换栏目、查看详情还是暂时编辑，选择 tab、导航栈或 sheet。 | [原生交互选择](native-interaction.md) · [创建 iOS App 工程](https://developer.apple.com/documentation/xcode/creating-an-xcode-project-for-an-app) |
| UIKit 页面滑动返回一半再取消，当前页面停止接收更新 | 查看交互转场开始时做了哪些清理，再验证取消和完成两个结局。 | [UIKit 控制器与布局](../skills/ios-uikit/SKILL.md) |
| 两个任务同时拿到了同一进程内的最后一个槽位 | 画出两个调用在挂起点前后看到的状态，验证校验与预留是否由同一 actor 在一次无挂起的操作中完成。 | [Protect mutable state with Swift actors · WWDC21](https://developer.apple.com/videos/play/wwdc2021/10133/) · [Swift 并发与迁移](../skills/swift-language-concurrency/SKILL.md) |
| 两台设备都显示领到了最后一张券 | 对照服务端实际受理的记录。两笔都成功就查共享写入约束；一笔被拒却仍显示成功就查回包和本地队列。 | [业务规则与 Swift 模型](../skills/swift-domain-modeling/SKILL.md) · [离线写入与对账](../skills/ios-data-networking/SKILL.md) |
| 全新安装正常，升级后启动时报数据库错误 | 复制含旧数据的持久化存储，用正式迁移入口升级，再次打开并检查关联、主键和后续写入。 | [网络与存储迁移](../skills/ios-data-networking/SKILL.md) |
| 从网站点链接会进首页，杀掉 App 后尤其明显 | 分别记录系统规则是否匹配、链接由哪个 scene 收到、导航数据就绪后是否消费一次。 | [Apple TN3155](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links) · [Scene 生命周期](../skills/ios-platform-lifecycle/SKILL.md) |
| 自动化通过，VoiceOver 用户却找不到表单错误 | 在同一错误状态下听焦点顺序，定位错误字段，完成一次改正和提交。 | [无障碍与本地化](../skills/ios-accessibility/SKILL.md) · [界面文案复数规则](https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog) |
| 产品反馈「滑动卡」，开发机难以重现 | 先定机型、数据、缓存状态与手势，找出一个掉帧区间，再关联主线程栈和 SwiftUI 更新。 | [Optimize SwiftUI performance with Instruments · WWDC25](https://developer.apple.com/videos/play/wwdc2025/306/) · [性能手册](../skills/ios-performance/SKILL.md) |
| TestFlight 用户说“闪退”，但只有一次应用消失的时间 | 按时间、进程和构建找 incident，先区分异常崩溃、watchdog、jetsam 和普通的后台进程回收，再选择符号或运行时观测。 | [设备事故分诊](../skills/ios-runtime-diagnostics/SKILL.md) |
| 本地运行通过，但 extension 在归档里读不到资源 | 从归档中分别检查 app 和 extension 的资源包、签名 entitlement、App Group 及所选 configuration。 | [发布与隐私](../skills/ios-delivery-privacy/SKILL.md) · [跨进程功能](platform-integrations.md) |
| Objective-C 调用方找不到迁到 Swift 的类 | 对照失败 target 的生成头文件、声明的可见性和 selector。重编译一个真实调用方；如果 storyboard 会按类名实例化对象，再启动对应界面。 | [Xcode、SwiftPM 与混编迁移](../skills/ios-project-tooling/SKILL.md) |
| 同一段代码在不同 Xcode 下给出不同的隔离诊断 | 记录编译器、目标语言模式和默认隔离设置，对照目标 SDK 的接口声明，再决定改声明、调用方还是编译设置。 | [版本与源码调查](../skills/ios-source-research/SKILL.md) · [状态所有权分析示例](app-architecture.md) |

## 跟读三个工程

1. **Apple Food Truck。** 从订单列表里选中一项，跟踪选择如何驱动详情页，然后改变窗口宽度。对照自己项目的折叠布局、返回和选择恢复。这个示例尤其适合讨论 iPhone 和 iPad 共用一份导航数据的边界。[示例与源码入口](https://developer.apple.com/documentation/swiftui/food-truck-building-a-swiftui-multiplatform-app)
2. **Apple Backyard Birds。** 跟踪一次喂食操作从模型写入到 App 和 Widget 上的可见结果。画出持久化容器、视图和 extension 的进程边界，再检查项目是否承诺同样的更新时机。[示例与源码入口](https://developer.apple.com/documentation/swiftui/backyard-birds-sample)
3. **Firefox for iOS。** 从项目文档找出 UIKit、WebKit 和共享组件的实际边界，选一个用户操作跟到相关测试。借鉴它如何拆分验证成本，迁移前先比较自己项目的团队和模块规模。[Mozilla 工程概览](https://firefox-source-docs.mozilla.org/overview/ios.html) · [开发团队 Wiki](https://github.com/mozilla-mobile/firefox-ios/wiki/)

## 怎样读一份性能复盘

Airbnb 团队在 Search 页面追踪了滚动卡顿和 SwiftUI 视图更新。可复用的是调查顺序：定位有问题的帧、找出导致更新的输入、缩小改动，再在同一工作负载下复测。如果考虑自定义相等性，还要证明内容和交互回调变化后仍然生效。记录自己项目的机型、系统、指标和波动范围。[Airbnb 团队复盘](https://airbnb.tech/mobile/understanding-and-improving-swiftui-performance/) · [Demystify SwiftUI performance · WWDC23](https://developer.apple.com/videos/play/wwdc2023/10160/)

## 在真实项目里走一遍

两个 Swift 示例可以直接对照项目代码阅读。一个展示如何区分同一个搜索词发起的两次请求，以及为什么晚到的错误也需要检查请求身份。另一个展示 SwiftUI 包装 `UITextField` 时如何保留拼音候选词，并给出键盘验证步骤。[异步搜索示例](../skills/swift-language-concurrency/references/stale-search.md) · [拼音输入与 UIKit 桥接示例](../skills/swiftui-uikit/references/text-field-bridge.md)

选一个已有编辑功能，复现“修改后返回并重开，内容应保留”。先用现有测试验证数据写入，再在模拟器执行用户路径；若交互依赖硬件，在对应真机上复查。记录 scheme、destination、实际执行的测试和观察结果。初学者可以从 Apple 的 Develop in Swift 教程建立示例项目，已有项目可以直接从现有 scheme 开始。[Develop in Swift](https://developer.apple.com/tutorials/develop-in-swift) · [Meet Swift Testing · WWDC24](https://developer.apple.com/videos/play/wwdc2024/10179/) · [测试选型](../skills/ios-testing/SKILL.md) · [模拟器与真机验证手册](device-verification.md)
