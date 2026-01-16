## 目标

* 系统化补全仓库运行/架构与数据源细节，更新 AGENTS.md。

* 增加“推送到 GitHub”完整流程与发布规范，更新 README.md。

* 对齐版本、打包与国际化策略的文档口径，避免信息不一致。

## 将更新的文件

* AGENTS.md（结构、扩展架构、数据源与索引、i18n、打包与调试、提交规范补充）

* README.md（GitHub 推送与发布、页面导览、数据源合并说明、依赖加载与故障排查、国际化使用）

## AGENTS.md 更新要点

* 扩展架构与入口

  * Manifest V3、Service Worker 背景脚本与点击图标打开主窗口关系，入口 [manifest.json](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/manifest.json)、[openWindow.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/background/openWindow.js)、[popup.html](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/popup.html)

  * 第三方依赖通过 UMD 注入（Chart.js、html2canvas），无前端打包工具

* 构建、调试与打包

  * 继续支持“已解压扩展”直接加载；补充可选打包脚本的存在与用途（build.bat/build-core.ps1/.buildignore），与 README 对齐

* 数据源与索引

  * 统一字段映射与索引维度（WireSize/WallThickness/WireType/ConductorDesign/Specs），引用 [mspec.README.md](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/storage/Database/mspec.README.md)

  * 多源合并、缓存 TTL 与失败回退，[mspecService.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/services/mspecService.js)

* 模拟参数策略

  * 显式传参、默认值来源与恢复方式，[wireManager.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/logic/wireManager.js)、[ConfigPage.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/pages/config/ConfigPage.js)

  * 记录“默认值需保持跨页面一致”的约束，避免收敛参数不一致

* 国际化

  * 语言偏好读取顺序、资源加载与回退策略，[i18n/index.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/i18n/index.js)、[\_locales](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/_locales)

* 提交与 CHANGELOG 范围

  * 强调“用户可感知变更”写入 CHANGELOG；权限最小化与文案同步规则

## README.md 更新要点

* 新增“推送到 GitHub”章节

  * 初始化本地仓库、设置远程、推送 main 分支、标签与发布、更新徽章

  * Windows PowerShell 示例命令，结合 .gitignore/.gitattributes 与 CHANGELOG 策略

* 页面导览

  * 计算/历史/配置/查询页简要职责与关键交互，[CalcPage.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/pages/calc/CalcPage.js)、[HistoryPage.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/pages/history/HistoryPage.js)、[ConfigPage.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/pages/config/ConfigPage.js)、[QueryPage.js](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/src/pages/query/QueryPage.js)

* 数据源说明扩充

  * 明确“可多源合并”的使用方式与缓存行为，示例文件与字段映射

* 依赖加载与故障排查

  * UMD 引入位置、常见错误提示与排查路径（Chart.js/html2canvas），[popup.html](file:///c:/Users/Yang/Documents/Github/Wire-Bundle-Diameter-Calculation/popup.html)

* 国际化使用

  * 语言切换入口、偏好保存与帮助文档来源；文案键维护规范

* 版本与徽章

  * 对齐 manifest.json 的 version（例如 1.0.3.5，如当前为最新），更新 README 徽章

## README 中拟加入的“推送到 GitHub”示例

* 前置：在 GitHub 仓库地址：<https://github.com/C3604/Wire-Bundle-Diameter-Calculation>

* 前置：此前已经推送代码到github；

## 校验清单

* 链接与引用有效（文件路径、章节锚点、徽章地址）

* 版本号一致性（manifest.json ↔ README 徽章 ↔ 标签）

* 术语与字段一致（WireSize/WallThickness/WireType/ConductorDesign/Specs）

* 行文与格式统一（中文、2 空格缩进示例、命令行为 PowerShell）

## 交付方式

* 按上述要点直接在两个文件中补充/修订文字段落与示例命令。

* 不改动代码逻辑，仅文档更新；更新后我会再次通读核对，并提供变更摘要。

