# Wire Bundle Diameter Calculation — 全面代码审查与改进说明（2026-01-15）

## 范围与方法
- 覆盖入口、页面、算法、存储、组件、i18n 与静态资源
- 通过静态检查、跨文件交叉阅读与轻量测试验证

## 发现与修复
- 输入解析与校验
  - 统一解析规则并支持逗号小数，容差与次数非法直接阻止计算并提示
  - 参考：[inputCollector.js](../src/pages/calc/inputCollector.js)
- 计算状态与异常提示
  - 模拟未收敛时给出提示；按钮状态在所有分支恢复
  - 参考：[simulationEngine.js](../src/logic/simulationEngine.js)、[CalcPage.js](../src/pages/calc/CalcPage.js)
- 历史记录与存储
  - 保存原始数值，限制最大 200 条，状态保存防抖
  - 参考：[CalcPage.js](../src/pages/calc/CalcPage.js)、[HistoryPage.js](../src/pages/history/HistoryPage.js)
- 性能与算法
  - 单轮迭代内复用空间网格；默认次数与迭代下调
  - 参考：[simulationEngine.js](../src/logic/simulationEngine.js)、[wireManager.js](../src/logic/wireManager.js)
- 导出与图表
  - 导出按容器宽度与限缩放，使用 blob URL 并释放；图表复用实例增量更新
  - 参考：[CalcPage.js](../src/pages/calc/CalcPage.js)、[chartRenderer.js](../src/components/chartRenderer.js)
- 代码清理与通用抽取
  - 移除多处 console.log；收敛 i18n 命名导出；新增 overlay 关闭工具并应用于 Popup
  - 参考：[i18n/index.js](../src/i18n/index.js)、[Popup.js](../src/pages/Popup.js)、[domUtils.js](../src/utils/domUtils.js)
- 颜色映射
  - 当唯一直径超出色表长度时使用默认色，确保图例可读
  - 参考：[CalcPage.js](../src/pages/calc/CalcPage.js)

## 建议与后续
- 可选：将多次模拟放入 Web Worker 并行；导出前暂时禁用动画以进一步加速
- 可选：为非收敛场景提供“高精度模式”开关

## 轻量测试
- 输入采集边界测试与标准 JSON 规范化测试，见 [tests](../tests)
  - inputCollector：合法、越界、逗号小数
  - normalize：ISO_6722 规范化统计

## 风格与规范
- 全项目保持 2 空格缩进、ES6 模块、公共逻辑抽取到 utils

## 变更列表（关键文件）
- src/pages/calc/inputCollector.js
- src/logic/simulationEngine.js
- src/logic/wireManager.js
- src/pages/calc/CalcPage.js
- src/components/chartRenderer.js
- src/pages/Popup.js
- src/i18n/index.js
- src/pages/history/HistoryPage.js
- src/utils/domUtils.js
- tests/inputCollector.test.html
- tests/normalizeStandard.test.html

