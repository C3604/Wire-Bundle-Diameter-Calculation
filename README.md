# 线束直径计算工具 (Wire Bundle Diameter Calculator)

[![Edge Add-on](https://img.shields.io/badge/Edge%20Add--on-v1.2.0.8-blue)](https://microsoftedge.microsoft.com/addons/detail/%E7%BA%BF%E6%9D%9F%E7%9B%B4%E5%BE%84%E8%AE%A1%E7%AE%97%E5%B7%A5%E5%85%B7/dcinhgdofeolfogjefdocphbnmdicopj)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 项目简介

线束直径计算工具是一款基于二维圆形填充算法的浏览器扩展，帮助工程师根据导线规格、包覆层和制造公差快速评估线束外径。项目现仅支持 Chromium 内核浏览器（如 Microsoft Edge 与 Google Chrome），不再提供 Firefox 版本。

![程序核心功能截图](src/assets/img1.jpg)

---

## 核心功能

- **多规格导线支持**：同时配置标准导线与自定义导线，灵活调整数量与尺寸。
- **包裹层管理**：为线束添加多层包覆材料，支持自定义厚度与顺序。
- **制造公差仿真**：通过可配置的公差与蒙特卡洛模拟估算极值与平均直径。
- **可视化输出**：生成截面示意图、统计表与分布折线图，便于沟通与归档。
- **历史记录与导出**：自动保存计算参数，可导出 CSV 做进一步分析。
- **参数配置中心**：内置标准导线库，允许按企业标准定制并持久化到浏览器本地。
- **多语言界面**：默认提供简体中文与英文，方便全球团队协同。

---

## 界面概览

- **侧边导航**：包含“计算”“历史”“配置”等入口，右侧显示当前版本号与快速操作按钮。
- **主工作区**：根据所选页面展示导线表格、包覆层配置、仿真参数以及结果可视化组件。
- **辅助要素**：提供语言切换、历史清理、数据导出与图像展示等工具。

---

## 快速上手

### 安装扩展

- **Microsoft Edge 应用商店**：推荐直接通过 [扩展商店](https://microsoftedge.microsoft.com/addons/detail/%E7%BA%BF%E6%9D%9F%E7%9B%B4%E5%BE%84%E8%AE%A1%E7%AE%97%E5%B7%A5%E5%85%B7/dcinhgdofeolfogjefdocphbnmdicopj) 安装稳定版本。
- **开发者模式侧载**：
  1. 在浏览器地址栏输入 `edge://extensions/` 或 `chrome://extensions/`。
  2. 打开“开发者模式”。
  3. 点击“加载已解压的扩展程序”。
  4. 选择仓库根目录，使用 `manifest.json` 启动扩展。

### 计算流程示例

1. 点击浏览器工具栏中的扩展图标，打开主界面。
2. 在“标准导线”区域选择线规、类型并录入数量；必要时在“特殊导线”添加自定义导线。
3. 为线束配置包裹层与厚度，按需调整制造公差与模拟次数。
4. 点击“计算直径”或按 Enter 键运行仿真，右侧将实时刷新截面图与统计数据。
5. 勾选“保存历史记录”可将结果写入历史列表，支持后续导出。

---

## 技术栈

- HTML5 与 CSS3
- JavaScript (ES6+)
- Chromium Extension Manifest V3 API
- Canvas API（绘制截面与折线图）
- LocalStorage（本地配置与历史记录持久化）

---

## 项目结构

```
├── _locales/               # 国际化资源（zh_CN、en）
├── icons/                  # 扩展图标与界面按钮
├── src/
│   ├── assets/             # 截图与静态资源
│   ├── background/         # 背景脚本（MV3 service worker）
│   ├── components/         # UI 组件
│   ├── logic/              # 核心业务逻辑与模拟引擎
│   ├── pages/              # 页面容器
│   ├── storage/            # 数据持久化封装
│   ├── styles/             # 样式文件
│   └── utils/              # 通用工具函数
├── manifest.chrome.json    # Chromium 版本清单模板
├── manifest.json           # 实际加载的扩展清单（由脚本生成）
├── build.bat               # Windows 构建脚本
└── popup.html              # 主界面入口
```

---

## 构建与调试

构建脚本会将 `manifest.chrome.json` 复制为 `manifest.json`，确保侧载时使用最新配置：

```powershell
.\build.bat chrome
```

执行后即可在 `edge://extensions` 或 `chrome://extensions` 中加载 `manifest.json` 进行调试。若仅修改前端资源，可直接刷新扩展页面，无需重新运行脚本。

预览说明：无需打包，可用任意静态服务打开 `popup.html` 进行纯 UI 检查（例如 `python -m http.server` 或 VSCode Live Server）；涉及扩展 API 的行为需在浏览器扩展环境侧载验证。

---

## 开发注意事项

- **扩展 API**：背景服务线程直接使用 `chrome.action`、`chrome.windows` 等 Chromium API；如需 Promise 化封装，可在各模块内部实现。
- **Manifest 管理**：仅维护 `manifest.chrome.json` 与 `manifest.json`；提交前请确认 `manifest.json` 与模板保持一致，避免携带历史产物。
- **国际化**：新增文案时同步更新 `_locales/zh_CN/messages.json` 与 `_locales/en/messages.json`，保持 key 命名统一。
- **样式规范**：统一使用四空格缩进，Sass/Less 等预处理暂未启用；已移除全部 Firefox 专用样式前缀。
- **强制性语言规范**：除代码实现、专业术语与特定技术文档外，统一使用中文。
- **代码实现原则**：显式优于隐式；禁止无明确需求的兼容实现；兼容需完成评审并说明技术限制与回滚策略。
- **参数与线库来源统一**：`simulationConstants.js` 通过 `wireManager.js` 的 `getSimulationParameters`/`getEffectiveStandardWires` 提供数据；避免直接读取 `localStorage`；旧接口（如 `getCurrentWireData`）已标注废弃且保留兼容。

#### 计算页状态流与校验顺序

- 输入统一由 `collectAndValidateInputs()` 收集与校验，不在按钮处理器内直接读取 DOM。
- 校验包含：导线数量与外径、包裹层厚度、容差 `100–200`、模拟次数 `1–100`；异常项仅给出警告并使用默认值，若导线为空则阻断计算。
- 渲染顺序：禁用按钮 → 统一收集与校验 → 清理旧结果 → 运行 `simulateBundleDiameter()` → 更新 UI（平均值高亮、图表与图例） → 历史写入（如启用） → 恢复按钮。
- 文案与提示统一调用 `i18n.getMessage`，禁止硬编码。
- 若新增输入项，请在 `collectAndValidateInputs()` 内扩展校验逻辑并保持返回结构稳定。

---

### 国际化枚举约定

- 新增 `wire_type_thin`、`wire_type_thick`、`wire_type_ultra_thin` 用于类型标签本地化。
- 通用下拉占位使用 `calc_select_placeholder_choose`，避免硬编码“请选择”。
- UI 层展示采用本地化标签，但内部类型值仍使用 `Thin/Thick/Ultra Thin`，以兼容数据结构与计算逻辑。

## 常见问题（FAQ）

- **Q: 是否仍支持 Firefox？**  
  A: 项目当前仅支持 Chromium 内核浏览器，Firefox 专用代码已全部移除。
- **Q: 为什么运行脚本后 manifest.json 会变化？**  
  A: `build.bat` 会从模板覆盖生成 `manifest.json`，以统一国际化占位符和版本信息。
- **Q: 历史记录或自定义导线会丢失吗？**  
  A: 所有数据仅保存在浏览器本地，清理浏览器数据或更换设备会导致记录丢失。

---

## 贡献指南

欢迎通过 Issue 或 Pull Request 参与改进。提交代码前请确保：

1. 已在最新的 Chromium 浏览器中验证主要功能与语言切换；
2. 说明变更目的、影响范围及测试步骤；
3. 若涉及界面更新，请附上前后对比截图。

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源，欢迎在保留版权声明的前提下衍生与分发。

---

## 联系方式

- GitHub Issues：<https://github.com/C3604/Wire-Bundle-Diameter-Calculation/issues>
- 若扩展对你有帮助，欢迎 Star 支持。
