# Swift Developer 的设计取舍

同一句“返回后页面没刷新”可能指向三种不同的修复。SwiftUI 里先看视图 identity 和模型所有者；UIKit 里先看控制器的转场回调和订阅生命周期；如果页面由 UIKit 推入、内容由 SwiftUI 绘制，才需要追到两侧之间的回传与释放。角色的首要判断是找到实际负责这次行为的对象。Compose 角色中值得保留的是主角色对结果负责、按风险独立复核和用可观察行为验收。

## 同一个工程问题，在两边怎样落地

| 用户的问题 | Jetpack Compose 角色里有用的追问 | iOS 角色实际检查的边界 |
| --- | --- | --- |
| 回到页面后，刚才输入的内容应该还在吗？ | 哪些输入只需留在组合中，哪些需要 `rememberSaveable`、`SavedStateHandle` 或持久化？ | SwiftUI 的草稿可能只随视图 identity 存活。导航恢复属于对应的 scene，已经点过保存的记录属于持久化存储。分别用列表重排、scene 恢复和冷启动验证这三种承诺。[状态所有权](references/app-architecture.md) |
| 离开详情页时，什么时候解除订阅？ | 注册发生在哪个 effect 里，哪些 key 或离开组合的事件会触发清理？ | UIKit 的交互式返回可能取消。先确定订阅属于控制器实例、可见期间还是当前记录，再用“手势取消后仍能刷新，完成返回后旧实例停止接收”验证释放时机。[UIKit 生命周期](skills/ios-uikit/SKILL.md) |
| 卡顿是否真的改善？ | 重组和布局变化能否对应到实测慢帧、启动时间或基准结果？ | 在同一机型、构建配置和输入下，对齐一次滑动的迟帧与 Instruments 栈。SwiftUI 的 `body` 调用次数、UIKit 自适应布局开销分别提供线索，修复收益回到帧和响应时间验证。[iOS 性能判断](skills/ios-performance/SKILL.md) |

## 从原作借鉴了什么

| 读过的原作 | 它解决的 skill 设计问题 | 在这里怎样应用 |
| --- | --- | --- |
| Apple 随 Xcode 27.2 提供的 `swiftui-specialist`、`app-resizability` | 前者给数据流、列表 identity 等问题各设一个参考入口；后者把全局屏幕尺寸、方向和 scene 生命周期分开处理。 | SwiftUI 状态、原生 UIKit、混编各有入口。遇到窗口变化，先找到本地容器，再验证原操作在新尺寸下仍可完成。版本相关的建议回到项目 SDK 核实。[SwiftUI 官方介绍](https://developer.apple.com/videos/play/wwdc2026/269/) · [UIKit 官方介绍](https://developer.apple.com/videos/play/wwdc2026/278/) |
| Antoine van der Lee 的 SwiftUI 与 Swift Concurrency skills | 区分写功能和审查；并发错误先识别诊断发出位置和跨越的隔离边界。 | 给纯 SwiftUI 问题独立入口。委托协议发生隔离冲突时，先读选定 SDK 中的 requirement 和调用方，尤其保留同步返回值的时序。[SwiftUI 入口](https://github.com/AvdLee/SwiftUI-Agent-Skill/blob/main/skills/swiftui-expert-skill/SKILL.md) · [并发入口](https://github.com/AvdLee/Swift-Concurrency-Agent-Skill/blob/main/skills/swift-concurrency/SKILL.md) |
| Paul Hudson 的 SwiftUI Pro、Daniel Devesa 的 iOS Accessibility | 前者按审查范围选择材料；后者把不同框架、辅助技术和手工验证区分开。 | 新交互按 iOS 的导航与编辑语义设计；无障碍问题按用户实际使用的输入方式取证。“读得出来”和“说出名字就能点到”分别验证。[设计参考页](https://github.com/twostraws/SwiftUI-Agent-Skill/blob/main/swiftui-pro/references/design.md) · [无障碍入口](https://github.com/dadederk/iOS-Accessibility-Agent-Skill/blob/main/ios-accessibility/SKILL.md) |
| OpenAI 的 iOS Debugger Agent | 把模拟器操作拆成可以观察的步骤，先识别当前界面的元素，操作后重新观察。 | 设备手册采纳这一顺序，支持项目已有的 XCUITest、Simulator 或设备工具。只有需要验证的行为才决定是否用真机。[调试技能原文](https://github.com/openai/plugins/blob/main/plugins/build-ios-apps/skills/ios-debugger-agent/SKILL.md) |

## Role、skill 和 reference 各管什么

- **Role** 选择工作起点和验收依据。空目录先做可运行的用户路径；已有工程跟到拥有状态的 view 或 controller；线上事件跟到产生日志的可执行文件。带 Widget 的项目也有多种工作起点。
- **Skill** 处理一类能够独立识别的请求。描述使用工单里的措辞，比如“扩展里找不到模块”“已归档的扩展没有共享容器”。两个问题都提到 Widget，但第一个需要构建日志，第二个需要各自的签名产物。
- **Reference** 在某个决定需要更多上下文时加载。只在使用到有关路径时读签名命令、草稿状态示例或复用细节。跨框架共用的交互选择、系统进程边界和设备验证在角色级维护。每项共享参考都在 manifest 声明用途，供 Rolebox 在加载正文前展示。[Agent Skills 对触发描述的设计建议](https://agentskills.io/skill-creation/optimizing-descriptions)

## 维护时怎样发现退化

给独立使用者两个只差一个条件的工单。观察它选择什么证据，以及什么结果会让它放弃原诊断。例如，同一个 Widget 在 Debug 编译时找不到模块，和 TestFlight 上已启动却读不到共享数据，应该走不同的第一步。再用 UIKit 取消侧滑与 SwiftUI 重排丢草稿验证它能否找到各自的所有者。检查链接、发现描述和 Graph 声明可以自动化；这些检查各自证明的范围与实际使用者的判断分开记录。

### 用代码检验边界

将[附件队列练习](evals/attachment-rule/Sources/DeliveryQueue/Outbox.swift)所在的 Swift 包复制到临时目录，给使用角色的人下面这张工单。初始代码保留了真实可触发的缺陷。在副本上运行 `swift test`，修复前应看到失败；修复后用原始[公开 API 测试](evals/attachment-rule/Tests/DeliveryQueueTests/OutboxTests.swift)复测。

> 队列菜单和分享入口都能丢弃附件。排队中和已送达的可以丢弃，上传或等待服务器确认的必须保留。菜单打开后状态可能变化。修好两个现有入口，保持调用签名和返回约定。

看最终差异时，跟踪一次正常操作和一次被拒的操作。菜单能否预测结果，直接调用能否在当前状态下守住规则，拒绝后邻居和目标记录是否都保留？读两个生产调用，看改一条规则要改几处。添加的新类型、依赖或持久化字段分别解决了什么实际问题？同样的判断也应允许合理的提取：一个枚举上的穷尽判断可以让新增状态在编译时暴露，而为这个内存值引入持久化服务需要另外的产品依据。

用相反的例子检查角色是否把每个需求都建成业务模型：少于 40 行的站点列表增加本页搜索，父视图仍能更新站点。检查查询是否只归当前页所有、匹配结果是否由当前输入派生、重名站点是否回传原 ID。这个例子验的是查找、选择与输入的所有权，不能用“类型或代码行越少越好”评分。

### 用一项真实变更审查架构

选一个已经完成的改动，再问维护者下次改同一件事要动哪里。如果给一本书改名时，三个私有请求对象逐层做完全相同的字段映射，可以沿保存路径指出重复修改点。反过来，一个只有一行的 Objective-C 适配器可能保住了已发布客户端仍在发送的 selector。审查时写明删掉这层会让哪个调用者承担什么代价。功能测试和类型数量都无法单独回答这个问题。

另一个练习是让同一份播客列表能在两个窗口中打开不同详情。给定详情 target 已经引用列表里的节目类型，观察新增入口后有哪些 target 需要知道详情页，哪个窗口执行了跳转，原有的「继续收听」还走哪条路径。再换一个需求，让只读 Widget 也能解码 App 保存的节目快照。此时共享读取能力有明确的消费者，可以用 Widget 能否独立读取旧样本检验边界。两个需求外观上都涉及“共享”，值得抽取的代码不同。[架构参考](references/app-architecture.md)

检验角色能否把判断用到新问题时，可以给它一个文件导入工单。导入器交付的 URL 在回调结束后就可能失效。预览在回调内完成，打印队列稍后才读文件，多个任务可以单独取消。在同一路径先后交付两份不同的内容，再删除原文件，检查两项打印任务分别读到了什么。取消一份后重试另一份，最后检查只点预览是否也触发了文件复制。

真实项目使用了 NetNewsWire 的 iOS 智能订阅与搜索。首轮找到了真正的代码重复，也找到了需要兼容的旧设置键，却把合并搜索类型排在了删除无人读取的状态之前。[固定版本、评审判断与可重跑的数据库用例](evals/netnewswire/REVIEW.md)
