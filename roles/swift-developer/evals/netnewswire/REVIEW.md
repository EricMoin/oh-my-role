# NetNewsWire 智能订阅与搜索架构评审

评审固定在 `b8f938f4b8ac067f3241c3b868effbd7fe2ccc55`。从 iOS 时间线上的「此处」和「全部文章」两个搜索入口、侧栏的智能订阅开始。沿调用检查 AppKit、Widget 或数据库时，只判断它们实际消费的那部分。NetNewsWire 是同时发布 iOS 和 macOS 客户端的开源 RSS 阅读器。[项目与固定版本](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/README.md) · [iOS 搜索入口](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/MainTimeline/MainTimelineViewController.swift#L786-L805)

## 对维护者的建议

| 顺序 | 决定与理由 |
| --- | --- |
| 先删一处冗余状态 | `SmartFeedsController.smartFeeds` 创建并填充了三个对象的数组。仓库中找不到对这个属性的读取。侧栏每次从 `shownSmartFeeds` 读取可见项，按 ID 查找则有独立入口，可以找到已隐藏的内建项。删除属性和初始化赋值即可。保留私有初始化器、三个长期存活的对象，以及读取当前偏好的行为。iOS 里同名的 `.smartFeeds` 是另一个枚举的 case。[控制器](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/SmartFeedsController.swift#L15-L59) · [侧栏消费者](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/Tree/SidebarTreeControllerDelegate.swift#L43-L61) · [同名枚举的使用处](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/MainFeed/MainFeedCollectionViewController.swift#L1037) |
| 收窄取文委托的职责 | 四个具体 delegate 都采用同一份默认的取文实现，`SmartFeed` 又原样转发四个方法。可以把实现放回 `SmartFeed`，让委托继续提供查询类型、显示信息和未读数策略。保留外层的同步、异步、全部和仅未读四个入口。iOS 的「全部标为已读」菜单和时间线分别有真实的同步与异步调用。这个提议可以单独实施。[协议与默认实现](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/SmartFeedDelegate.swift#L15-L37) · [外层转发](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/SmartFeed.swift#L112-L128) · [菜单](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/MainFeed/MainFeedCollectionViewController.swift#L1387-L1398) · [时间线](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/Timeline/FetchRequestOperation.swift#L202-L216) |
| 保留 `PseudoFeed` 和 `UnreadFeed` | 前一个协议几乎没有正文，但 iOS 按它选择上下文菜单。macOS 侧栏的复制命令通过它继承的剪贴板能力写出订阅名称，同时拖动入口明确排除了智能订阅。后一个类型直接观察账号管理器已经维护的未读总数。Today 和 Starred 则需要协调逐账户的计数查询与刷新。合成一个通用订阅对象会把这些差异带回调用方或配置开关。[iOS 菜单](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/MainFeed/MainFeedCollectionViewController.swift#L573-L585) · [协议的系统差异](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/PseudoFeed.swift#L10-L29) · [复制](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Mac/MainWindow/Sidebar/SidebarViewController.swift#L391-L393) · [禁止拖动的判断](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Mac/MainWindow/Sidebar/SidebarOutlineDataSource.swift#L155-L159) · [全局未读数](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/UnreadFeed.swift#L55-L65) · [合并计数刷新](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/SmartFeed.swift#L80-L107) |
| 有共同需求时再合并搜索 delegate | 两个 delegate 确实重复了标题、图标等展示代码。合并以后仍要表达两种查询范围，仍要分别生成既有标识 `SearchFeedDelegate` 和 `SearchTimelineFeedDelegate`，因为隐藏已读设置会按原字符串存储。iOS 在开始搜索时捕获当前文章 ID，空集合也有含义。macOS 全局搜索另有调用方。仅为少写几行展示代码，眼下收益有限。等共同的展示行为要改变时，可以连同旧设置和空快照用例一起改。[两个查询的构造](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/SceneCoordinator.swift#L1267-L1317) · [全局类型](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/SearchFeedDelegate.swift#L16-L37) · [时间线类型](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/SmartFeeds/SearchTimelineFeedDelegate.swift#L16-L37) · [设置的读写](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/HidingReadArticlesState.swift#L78-L90) · [持久化](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/AppDefaults+iOS.swift#L224-L232) · [Mac 调用方](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Mac/MainWindow/MainWindowController.swift#L795-L805) |

Widget 的进程边界也影响判断。App 内的编码器从 `unreadFeed` 取总未读数，Today、Starred 的文章和统计另向账号管理器查询。Widget 时间线读取编码结果。这里能证明未读数有下游消费者，不能据此宣布 Widget 直接依赖整套智能订阅委托。[App 写入端](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/Widget/WidgetDataEncoder.swift#L142-L164) · [Widget 读取端](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Widget/TimelineProvider.swift#L51)

## 首轮判断与复核

两个独立 Codex 工作者先后读取 Rolebox 原生 Codex 映射器导出的 Swift Developer 指令及对应架构 skill，分别评审同一提交。独立源码复核者未读角色和首轮结论。复测工作者只看到更新后的指令、上游源码和原工单。此次直接加载了工作区角色指令，没有在用户的工具配置里安装角色。每版各一次，反映这一案例中的表现。

重跑时向评审者提供以下工单和上游提交即可，判据由复核者保留。

> 评审 NetNewsWire 的 iOS 智能订阅与搜索，以及从 `Shared/SmartFeeds` 可追到的调用方和消费者。哪些抽象值得保留？哪里存在可证实的额外复杂度？若要保持行为，具体能怎样简化？给出源文件位置、仍不确定的地方和验证方法。

首轮正确识别了 `PseudoFeed` 的平台消费者、`UnreadFeed` 的计数来源、两种搜索范围及旧设置键。它还找到了重复的取文转发。问题出在先后顺序。它把合并两个搜索类型排在首位，又建议给无人读取的数组新增按 ID 查找的职责。后者确实可以替代一个重复列出内建类型的 switch，但会同时更改查找实现。单独删除数组已经能消除本次找到的冗余，影响面更小。

更新后的角色需要比较删除、保留现状及合并三者的具体代价，并追踪类型名是否已经成了持久化键。复测时没有给工作者候选清单或标准答案。它把删除数组列为第一项，收窄取文委托列为第二项，把合并搜索类型降为有共同需求时再考虑。它还分别给出了 macOS 复制能到达写入器、拖动提前返回的调用路径。两轮都能找出代码重复，差别在于如何给维护者排序。[主角色](../../PROMPT.md) · [架构审查指引](../../subagents/architecture-reviewer/skills/swift-architecture-review/SKILL.md)

另一个工作者用改进后的角色抽查了同一项目的「标为已读」。`MarkStatusCommand` 的两个回调都出现在写入结束处，却有不同的调用次数。打开侧栏只应发生一次，过滤后的时间线则需要在执行、撤销和重做时分别更新。它建议保留两个回调，把多个入口重复的可切换条件放到现有的 App 侧 `Article` 扩展中。复核依据是源码调用链，本次没有执行撤销交互。[命令的回调处理](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/Commands/MarkStatusCommand.swift#L55-L77) · [两种 UI 操作](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/iOS/SceneCoordinator.swift#L1433-L1460) · [依赖账号行为的现有扩展](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Shared/Extensions/ArticleUtilities.swift#L153-L168)

## 编译与行为验证

在临时副本中，用 Xcode 27.2 编译真正的 `NetNewsWire-iOS` scheme，使用 Debug、通用 iOS Simulator、锁定的包版本、公开开发配置和空第三方服务凭证。原版编译通过。只删数组声明和赋值后再编译，通过。在此基础上把四个取文实现移到 `SmartFeed`，移除委托对 `ArticleFetcher` 的继承，保持原有调用点，再次编译通过。首次从干净检出构建时，项目缺少生成的 `SecretKey.swift`，先运行仓库的生成脚本再构建即可。编译验证了当前 iOS 调用方的类型契约。[上游构建说明](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/README.md#building) · [生成脚本](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/buildscripts/updateSecrets.sh)

在 Apple Swift 6.4.2、macOS arm64 上运行了上游 `TodayQueriesTests` 的 8 项测试。补充测试直接写入真实 `ArticlesDatabase` 的内存库：同一 feed 有两篇命中，限定在进入搜索时的文章 ID 后剩一篇，空 ID 集返回零篇。9 项全部通过。这个结果验证了查询范围和 Today 的数据库约定。旧设置升级、通知合并时序以及用户在两个平台的实际交互仍各自需要验证。[上游测试](https://github.com/Ranchero-Software/NetNewsWire/blob/b8f938f4b8ac067f3241c3b868effbd7fe2ccc55/Modules/ArticlesDatabase/Tests/ArticlesDatabaseTests/TodayQueriesTests.swift) · [补充测试](SearchScopeReviewTests.swift)

要复跑，在该提交的临时工作副本中，从角色目录复制 `SearchScopeReviewTests.swift` 至 `Modules/ArticlesDatabase/Tests/ArticlesDatabaseTests/`。在 NetNewsWire 根目录执行以下命令，使用 App 已锁定的 Tidemark 版本。

```sh
jq '{version: 2, pins: [.pins[] | select(.identity == "tidemark")]}' \
  NetNewsWire.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved \
  > Modules/ArticlesDatabase/Package.resolved
swift test --package-path Modules/ArticlesDatabase --disable-automatic-resolution \
  --filter 'TodayQueriesTests|SearchScopeReviewTests'
```
