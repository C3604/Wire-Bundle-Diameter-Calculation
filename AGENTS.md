# Repository Guidelines

## 项目结构与模块组织
- 核心业务代码集中在 `src/`，其中 `logic/` 实现圆形堆叠算法，`components/` 与 `pages/` 负责 UI 与交互逻辑，`storage/` 封装 localStorage 访问。
- 静态资源分布在 `src/assets/` 与 `icons/`，更新截图或图标后请同步调整 README 与界面引用，避免遗留旧资源。
- 多语言文案位于 `_locales/zh_CN/messages.json` 与 `_locales/en/messages.json`；新增字段时请保持键名采用 `模块_动作_含义` 的蛇形命名，并确保两种语言同步。
- 浏览器清单以 `manifest.chrome.json` 为模板，通过脚本生成 `manifest.json`；请勿直接编辑生成文件，以免出现未追踪差异。

## 构建、测试与开发命令
- `.uild.bat chrome`：同步 Chromium 版本清单并输出到 `manifest.json`，适用于 Edge / Chrome 开发者模式侧载。
- 侧载调试：在 `edge://extensions` 或 `chrome://extensions` 打开开发者模式，选择“加载已解压的扩展程序”并指向仓库根目录。
- 日常开发建议使用浏览器 DevTools 的 Console 与 Network 面板观察 `simulationEngine.js` 的输出与渲染数据，及时校验算法结果。

## 编码风格与命名约定
- 全项目采用 ES Module 与四空格缩进，禁止混用 CommonJS；导出常量使用 `UPPER_SNAKE_CASE`，函数与变量使用 `camelCase`，组件文件保持 `PascalCase`。
- 注释精简聚焦业务背景或算法假设，避免解释语法本身；必要的说明请使用中文撰写，并保留关键英文术语。
- JSON / 配置文件保持字段顺序稳定，提交前请确认格式化一致，避免无意义 diff。

## 测试指引
- 当前仅支持手动测试：使用 README 提供的示例数据校验计算结果、历史记录写入及多语言切换。
- 调试复杂案例时，可在 Console 中输出 `runPackingSimulation` 返回值，验证容器半径、填充密度与可视化数据的一致性。
- 若引入新参数或 UI 元素，请在 Pull Request 描述列出测试浏览器版本、操作步骤与预期结果；界面改动建议附截图。

## 提交与 Pull Request 指南
- Git 历史多为简洁标签与中文描述，建议延续并补充 `feat:`、`fix:`、`docs:` 等前缀。例如：`feat: 优化线束截面渲染`。
- 提交前务必运行 `.uild.bat chrome`，确认 `manifest.json` 已更新且仅包含预期改动；如为临时调试，可重置或忽略该文件后再提交。
- PR 需包含变更摘要、影响范围、测试结果与潜在风险；涉及 UI 或算法调整时请说明回滚策略与监控要点。

## 安全与配置提示
- 扩展仅目标 Chromium 浏览器，已删除 Firefox polyfill 与专用样式；如需跨浏览器支持，请先在 Issue 中讨论方案。
- 生产环境不建议启用实验性 flag，避免影响 service worker 生命周期；若需更改窗口尺寸或权限，请同步更新 manifest 模板并说明原因。
