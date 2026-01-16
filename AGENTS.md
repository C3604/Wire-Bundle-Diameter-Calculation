# Repository Guidelines

## 项目结构与模块组织
- `manifest.json`：扩展入口与权限配置。
- `popup.html`：主界面入口，页面逻辑在 `src\pages\`。
- `src\`：核心代码；`logic\` 算法，`components\` 组件，`services\`/`storage\` 持久化，`i18n\` 国际化运行逻辑，`styles\` 样式，`vendor\` 第三方库。
- `language\` 与 `_locales\`：文案与多语言资源；`icons\`、`src\assets\`：图标与静态图。

## 扩展架构与入口
- 标准：Manifest V3；后台脚本以 Service Worker 方式运行（type: module）。
- 入口与行为：点击扩展图标由后台脚本创建/聚焦窗口（见 `src\background\openWindow.js`），主 UI 由 `popup.html` 加载。
- 依赖注入：第三方库通过 UMD 方式在 `popup.html` 注入（如 `src\vendor\chart.umd.js`、`src\vendor\html2canvas.min.js`），页面脚本以 ES6 模块组织。
- 权限：最小化，仅使用 `storage`；新增权限需在 PR 中说明用途与影响。

## 构建、测试与本地开发
- 无前端构建工具或打包流程，直接加载源码进行开发与调试。
- 选择性打包：提供 Windows 脚本进行过滤打包（`build.bat` + `build-core.ps1`，遵循 `.buildignore`），用于生成发布 ZIP。
- Edge 调试流程：打开 `edge://extensions/` → 启用开发者模式 → 选择仓库根目录（包含 `manifest.json`）→ 修改后点击“刷新”。
- 版本号以 `manifest.json` 的 `version` 为准。

## 编码风格与命名约定
- 使用 2 空格缩进；JS 使用 ES6 模块（`import/export`）。
- 文件名以小驼峰为主，如 `wireManager.js`、`CalcPage.js`；CSS 类名多为短横线风格，如 `.layout-left`。
- 公共工具函数放在 `src\utils\`，避免在页面文件内重复实现。

## 测试指南
- 当前未包含自动化测试或测试框架。
- 如新增测试，请在 PR 中说明运行方式与命名规则，并保持新增文件集中管理（建议新建 `tests\`），测试文件以 `test-*.js` 命名。
- 测试数据在使用完毕后应及时清除，避免对后续测试或生产环境产生影响。

## 提交与 Pull Request
- 历史提交既有 `feat:`/`refactor:` 前缀，也有简短描述式提交（如 `fix bug ...`）。建议使用“可选类型前缀 + 简短目的”的格式。
- 版本或行为变更时，同步更新 `manifest.json` 与 `Change log.json`。
- PR 请说明改动范围、影响页面，并对 UI 变化附截图。
- 更新日志（`CHANGELOG.md`）仅记录与用户操作、体验、UI、功能相关的变更；代码实现层面的调整不在该文档中描述。

## 仓库清理与忽略规则
- 临时/缓存/日志文件不纳入版本控制：`*.tmp`、`*.log`、`*.cache`、`*.bak`、`*~`、`Thumbs.db`、`.DS_Store`
- 常见构建产物与缓存目录忽略：`node_modules/`、`dist/`、`build/`、`out/`、`coverage/`、`.cache/`、`.parcel-cache/`、`.vite/`、`.next/`
- IDE/编辑器目录忽略：`.vscode/`、`.idea/`、`*.code-workspace`
- Windows 桌面索引：`desktop.ini`
- 其他常见缓存：`.eslintcache`、`.tsbuildinfo`、`.nyc_output/`、`.turbo/`、`.pnpm-store/`
- 环境/敏感配置：`.env`、`.env.*`、`.envrc`、`*.pem`
- 扩展打包产物：`release/`、`packages/`、`*.crx`、`*.xpi`
- 清理策略：移除未使用的导入/导出与未被引用的符号，保留对核心功能的最小必要实现
- 版本号变更仅在存在行为差异时进行；纯粹的清理与忽略规则完善可不提升版本，但需在变更说明中记录
## 配置与国际化
- 权限最小化，新增 `permissions` 需要在 PR 中说明用途。
- 文案修改需同步`_locales\` 中的对应键，避免缺失。
- 行尾与 Git 属性策略：文本文件统一使用 LF；Windows 脚本（`*.bat`/`*.cmd`/`*.ps1`）保留 CRLF；常见图片/字体/压缩包等标记为二进制以避免误差异与自动转换（详见 `.gitattributes`）。
- 语言偏好优先级：`chrome.storage.local`（用户设置） → 浏览器语言推断 → 默认 `zh_CN`。
- 资源加载回退：优先 `_locales/{lang}/messages.json`，在非扩展环境回退相对路径；加载失败降级到默认语言并记录日志。

## 数据源与索引策略
- 标准库以 Indexed JSON 组织，位于 `src\storage\Database\`，支持多源合并与索引检索。
- 字段映射：线规→`WireSize`，壁厚→`WallThickness`，类型→`WireType`，导体设计→`ConductorDesign`，直径→`Specs["Cable Outside Diameter"]`。
- 检索维度：`byWireSize`/`byWallThickness`/`byWireType`/`byConductorDesign` 等索引级联；详情参见 `src\storage\Database\mspec.README.md`。
- 加载服务：`src\services\mspecService.js` 负责多源合并、索引重建与缓存 TTL（默认 24h），失败时回退并提示。

## 模拟参数策略
- 参数以显式传参为准，避免隐式全局依赖；默认值由逻辑层与配置页负责读取/恢复（见 `src\logic\wireManager.js`、`src\pages\config\ConfigPage.js`）。
- 约束：跨页面的默认值需保持一致，包括主循环次数、单步次数与收敛阈值，避免“收敛告警”与用户预期不一致。
