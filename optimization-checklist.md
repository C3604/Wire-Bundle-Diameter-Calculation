# 优化检查清单

| 优化建议 | 位置 | 说明 |
| --- | --- | --- |
| 将计算页拆分为布局、状态、模拟调度等独立模块，而不是堆在一份 1200+ 行文件中，降低耦合并便于测试。 | `src/pages/CalcPage.js` | 目前文件同时处理 DOM、存储和模拟逻辑，模块化或采用模板渲染可提升可读性与维护性。 |
| 改造表格渲染逻辑，仅更新变动的行，而不是每次交互都重建整个 `<tbody>`。 | `src/pages/CalcPage.js` | 现有 `renderStandardRows`/`renderSpecialRows` 每次都刷新全表并依赖定时器保持焦点，导致性能和体验问题。 |
| 对 `saveState` 写入做防抖或批量处理，避免多输入框同时触发同步 `localStorage` 写入。 | `src/pages/CalcPage.js` | `saveState` 绑定到多处控件，当前每次 change 都立即序列化数据；通过防抖或 `requestIdleCallback` 可减少卡顿。 |
| 为 `calculationHistory` 设置容量上限并考虑迁移到带版本号的 `chrome.storage.local`。 | `src/pages/CalcPage.js`, `src/pages/HistoryPage.js` | 历史记录无限增长，容易占满 `localStorage` 并拖慢加载；控制容量并使用扩展存储更符合 MV3 规范。 |
| 提取导线类型的本地化辅助函数，消除多处 `getWireTypeLabel` 重复代码。 | `src/pages/CalcPage.js`, `src/pages/HistoryPage.js` | 目前各页面内嵌相同的 switch 语句，新类型或语种上线时容易遗漏。 |
| 将通用存储工具改为异步的 `chrome.storage`（保留回退），以兼容 Service Worker 并符合配额限制。 | `src/lib/storage.js`, `src/logic/wireManager.js` | 仅依赖 `window.localStorage` 会在 MV3 Service Worker 中失效，且不同上下文间数据不同步。 |
| 精简或按需加载 Chart.js，而不是每次弹窗都引入 347 KB 的完整 UMD 包。 | `popup.html`, `src/lib/chart.umd.js` | 目前即使未展示图表也加载整套库，按需动态导入或使用轻量替代可改善启动速度。 |
| 调整弹窗为响应式布局，将 `meta viewport` 改为 `device-width` 并审视强制 100 vw/vh 的样式。 | `popup.html`, `src/styles/main.css` | 固定 `width=1600` 导致小窗口或低分辨率设备显示异常，响应式设置可提升可用性。 |
| 在模拟循环中缓存导线质量系数并复用空间哈希，减少重复的 `Math.pow` 计算和 Map 创建。 | `src/logic/simulationEngine.js` | `packStep` 每轮重新计算权重并重建网格，缓存数据可有效降低大规模模拟的 CPU 开销。 |
| 将弹窗窗口尺寸存储迁移到临时存储（如 `chrome.storage.session`）或在安装时清理，避免旧坐标导致弹窗离屏。 | `src/background/openWindow.js` | 目前持久化的窗口位置可能在多显示器或分辨率变化后让弹窗无法可见，临时存储更安全。 |
