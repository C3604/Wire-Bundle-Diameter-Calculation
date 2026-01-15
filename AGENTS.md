# Repository Guidelines

## 项目结构与模块组织
- `manifest.json`：扩展入口与权限配置。
- `popup.html`：主界面入口，页面逻辑在 `src\pages\`。
- `src\`：核心代码；`logic\` 算法，`components\` 组件，`services\`/`storage\` 持久化，`i18n\` 国际化运行逻辑，`styles\` 样式，`vendor\` 第三方库。
- `language\` 与 `_locales\`：文案与多语言资源；`icons\`、`src\assets\`：图标与静态图。

## 构建、测试与本地开发
- 本仓库无构建/打包脚本，直接加载源码即可。
- Edge 调试流程：打开 `edge://extensions/` → 启用开发者模式 → 选择仓库根目录（包含 `manifest.json`）→ 修改后点击“刷新”。
- 版本号以 `manifest.json` 的 `version` 为准。

## 编码风格与命名约定
- 使用 2 空格缩进；JS 使用 ES6 模块（`import/export`）。
- 文件名以小驼峰为主，如 `wireManager.js`、`CalcPage.js`；CSS 类名多为短横线风格，如 `.layout-left`。
- 公共工具函数放在 `src\utils\`，避免在页面文件内重复实现。

## 测试指南
- 当前未包含自动化测试或测试框架。
- 如新增测试，请在 PR 中说明运行方式与命名规则，并保持新增文件集中管理（建议新建 `tests\`）。

## 提交与 Pull Request
- 历史提交既有 `feat:`/`refactor:` 前缀，也有简短描述式提交（如 `fix bug ...`）。建议使用“可选类型前缀 + 简短目的”的格式。
- 版本或行为变更时，同步更新 `manifest.json` 与 `Change log.json`。
- PR 请说明改动范围、影响页面，并对 UI 变化附截图。

## 仓库清理与忽略规则
- 临时/缓存/日志文件不纳入版本控制：`*.tmp`、`*.log`、`*.cache`、`*.bak`、`*~`、`Thumbs.db`、`.DS_Store`
- 常见构建产物与缓存目录忽略：`node_modules/`、`dist/`、`build/`、`out/`、`coverage/`、`.cache/`、`.parcel-cache/`、`.vite/`、`.next/`
- 清理策略：移除未使用的导入/导出与未被引用的符号，保留对核心功能的最小必要实现
- 版本号变更仅在存在行为差异时进行；纯粹的清理与忽略规则完善可不提升版本，但需在变更说明中记录
## 配置与国际化
- 权限最小化，新增 `permissions` 需要在 PR 中说明用途。
- 文案修改需同步`_locales\` 中的对应键，避免缺失。
