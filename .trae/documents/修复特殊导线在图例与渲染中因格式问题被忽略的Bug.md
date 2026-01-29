我已定位到问题原因。虽然核心计算逻辑（`inputCollector.js`）正确处理了特殊导线及其数值格式（如逗号分隔符），但在 `CalcPage.js` 的**图例生成与颜色映射逻辑**中，直接使用了 `parseFloat(row.od)` 而未处理逗号（`,`）。

这导致当用户使用逗号作为小数点输入特殊导线直径时（例如 `2,5`）：
1.  **计算引擎**正确使用了 `2.5mm` 进行模拟。
2.  **图例系统**错误地将其识别为 `2.0mm`（或 NaN），导致图例显示错误或缺失。
3.  **渲染系统**在绘制结果时，无法在颜色映射表中找到 `2.5mm` 对应的颜色，导致特殊导线在视图中**不可见或颜色异常**。
4.  用户因此误认为特殊导线被“忽略”了。

### 修复计划
修改 `src/pages/calc/CalcPage.js` 文件：
1.  在计算按钮点击后的处理逻辑中，找到遍历 `specialRows` 生成 `uniqueDiameters` 和 `wireInfoForLegend` 的代码块。
2.  将 `const od = parseFloat(row.od);` 修改为支持逗号替换的逻辑：`const od = parseFloat(String(row.od).replace(",", "."));`。
3.  同时对 `qty` 进行增强处理：`const qty = parseInt(String(row.qty).trim(), 10);`。

这将确保图例、颜色映射与核心计算逻辑对数据的解析保持一致。