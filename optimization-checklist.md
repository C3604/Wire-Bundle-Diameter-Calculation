# 优化清单（Todo List）

说明：使用复选框展示任务状态；包含位置与说明。文件编码为 UTF-8，确保中文正常显示。

## 用户体验
- [x] 修复 Calc/Config/History 页头重复 `id`
  - 位置：`src/pages/CalcPage.js`，`src/pages/ConfigPage.js`，`src/pages/HistoryPage.js`
  - 说明：为每个表提供唯一 `id`，避免跨页选择器冲突。
- [x] 弹出帮助窗口使用相对尺寸并记忆大小
  - 位置：`src/background/openWindow.js`，`src/pages/Popup.js`
  - 说明：默认相对屏幕尺寸并记忆上次大小，适配不同设备。
- [x] 将 CalcPage 三个表格体 `overflowY` 改为 `auto`
  - 位置：`src/pages/CalcPage.js`
  - 说明：滚动条按需显示，提升视觉整洁度。
- [x] 替换 CalcPage 的 `alert/confirm` 为自定义 Toast/Confirm
  - 位置：`src/pages/CalcPage.js`，`src/components/feedback.js`
  - 说明：统一提示与交互风格，避免阻塞式系统弹窗。

## 架构
- [ ] 抽离 CalcPage 的模块/状态/逻辑为可维护结构
  - 位置：`src/pages/CalcPage.js`
  - 说明：文件行数较多，建议分拆模块以降低复杂度。
- [x] 统一并管理页面级 `document` 的 `keydown` 事件
  - 位置：`src/pages/Popup.js`，`src/pages/CalcPage.js`，`src/pages/common/globalKeyManager.js`
  - 说明：引入 `globalKeyManager` 统一管理键盘事件；在页面切换时仅更新当前页并避免重复监听，移除 CalcPage 的旧绑定。
- [ ] 封装 ConfigPage 的局部与全局状态，并整理渲染逻辑
  - 位置：`src/pages/ConfigPage.js`
  - 说明：封装 `currentDisplayData` 等状态以提升可读性与可测试性。
- [x] 修复 HistoryPage 的潜在 XSS 风险
  - 位置：`src/pages/HistoryPage.js`
  - 说明：移除历史行的 `innerHTML` 拼接，使用 DOM API 与 `textContent` 安全渲染。


## 算法与性能
- [x] 引入空间栅格加速邻域查询，降低模拟复杂度
  - 位置：`src/logic/simulationEngine.js`
  - 说明：已实现 `buildSpatialGrid`/`getNeighborIndices` 并在 `packStep` 中使用。
- [ ] 减少 DOM 重排/回流并批量更新渲染
  - 位置：`src/pages/CalcPage.js`
  - 说明：合并批量 DOM 变更，提升渲染性能与稳定性。
- [ ] 降低 `getEffectiveStandardWires()` 的频繁存储读取
  - 位置：`src/pages/CalcPage.js`
  - 说明：引入缓存与基于配置变更的主动刷新策略。
- [ ] 历史记录的序列化与归档能力
  - 位置：`src/pages/CalcPage.js`
  - 说明：支持导出/归档最近 N 次记录，控制本地存储体量。

## 文档与 i18n
- [x] 统一枚举值的 i18n（如 Thin/Thick/Ultra Thin 等）
  - 位置：`src/pages/CalcPage.js`，`src/pages/HistoryPage.js`，`_locales/en/messages.json`，`_locales/zh_CN/messages.json`，`README.md`
  - 说明：UI 展示使用本地化标签，内部枚举继续用英文值；并在 README 增补“国际化枚举约定”。
- [x] 整理 `simulationConstants.js` 接口，统一给 `wireManager`
  - 位置：`src/logic/simulationConstants.js`
  - 说明：参数与线库改为从 `wireManager` 获取，移除直接读 `localStorage`，保留兼容接口（如 `getCurrentWireData`）并标注废弃。
- [x] 统一状态流并校验后进行渲染写法
  - 位置：`src/pages/CalcPage.js`
  - 说明：已通过 `collectAndValidateInputs()` 统一输入与校验，并在计算流程中先校验后渲染。
- [x] 同步更新 README 的使用与贡献说明
  - 位置：`README.md`
  - 说明：补充使用指引、开发流程、预览页说明与 UX 规范。
