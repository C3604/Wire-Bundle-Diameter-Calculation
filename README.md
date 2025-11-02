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
  1. 在浏览器地址栏输入 `edge://extensions/` 
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
 ├── language/               # 国际化资源（zh_CN、en）
├── icons/                  # 扩展图标与界面按钮
├── src/
│   ├── assets/             # 截图与静态资源
│   ├── background/         # 背景脚本（MV3 service worker）
│   ├── components/         # UI 组件
│   ├── i18n/               # 国际化运行时工具（加载与回退逻辑）
│   ├── logic/              # 核心业务逻辑与模拟引擎
│   ├── pages/              # 页面容器（各页面域：HTML/CSS/JS/Assets）
│   ├── services/           # 运行时服务（如存储、状态管理）
│   ├── storage/            # 数据源与持久化封装
│   ├── styles/             # 样式文件
│   ├── utils/              # 通用纯工具函数（无副作用）
│   └── vendor/             # 第三方打包产物（UMD 等）
├── manifest.json           # 实际加载的扩展清单
└── popup.html              # 主界面入口
```

---


