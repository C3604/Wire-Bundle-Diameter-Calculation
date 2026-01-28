# 项目样式与HTML代码审查报告

**生成日期**: 2026-01-17  
**审查范围**: `src/styles`, `src/pages`, `src/components`, `popup.html`  
**审查目标**: 代码规范性、复用性、冲突风险及优化建议

---

## 1. 样式架构概览

本项目采用 **原生 JS + CSS** 的架构模式，无预处理器（Sass/Less）或现代构建工具（Webpack/Vite）。

*   **样式入口**: `src/styles/main.css` 是核心样式文件，包含了全局重置、布局、组件及页面特定样式。`src/pages/help/help.css` 是独立的帮助页面样式。
*   **HTML生成**: 主要通过 JavaScript 动态生成（`innerHTML` 或 `document.createElement`），`popup.html` 仅作为外壳容器。
*   **命名策略**: 混合使用了 BEM 风格（如 `.calc-table__btn`）和实用工具类（Utility Classes，如 `.u-flex-center`），以及大量基于 ID 的选择器。

---

## 2. 组件样式分类与分析

### 2.1 表格组件 (Tables)
*   **主要类名**: `.calc-table`, `.main-data-table`, `.config-table`
*   **现状**: 存在多个类似的表格样式定义，分别用于计算页、配置页和历史页。
    *   `calc-table`: 用于计算页的标准/特殊/包裹物表格，支持固定布局 (`.calc-table-fixed`)。
    *   `main-data-table`: 似乎是旧版或通用的表格样式，常与 `calc-table` 混用。
    *   `simulation-results-table`: 用于结果展示区的特定表格，样式略有不同（虚线边框）。
*   **问题**: 样式重复定义较多，例如 `th` 和 `td` 的 padding、border 颜色在不同类名下重复声明。

### 2.2 按钮组件 (Buttons)
*   **主要类名**: `.calc-table-btn`, `.action-bar-btn`, `.sidebar button`
*   **分类**:
    *   **侧边栏按钮**: `.sidebar button`，包含图标和文字，有激活 (`.active`) 和悬停状态。
    *   **操作栏按钮**: `.action-bar-btn`，底部大按钮，有 `.btn-reset-action` (红) 和 `.btn-calculate-action` (蓝) 变体。
    *   **表格操作按钮**: `.calc-table-btn`，小型图标按钮，用于增加/重置行。
    *   **内联删除按钮**: 表格内的 "❌" 按钮有时直接使用 `button` 标签配合内联样式或简单的后代选择器。
*   **问题**: 缺乏统一的按钮基类（如 `.btn`），导致每次定义新按钮都需要重复写 `cursor: pointer`, `border: none` 等基础属性。

### 2.3 输入控件 (Inputs)
*   **主要类名**: `.config-input`, `.input-qty`, `.input-od`, `.input-thick`, `select`
*   **现状**:
    *   输入框多通过后代选择器定义（如 `.calc-table input`），导致样式依赖于 HTML 结构。
    *   错误状态样式 `.input-error` 定义了红色边框和背景。
*   **问题**: 缺乏统一的输入框组件类，过度依赖上下文（Contextual Styling）。

### 2.4 布局容器 (Layouts)
*   **主要类名**: `.main-container`, `.sidebar`, `.content`, `.layout-calc`, `.layout-left`, `.layout-right`
*   **现状**: 使用 Flexbox 进行主要布局。
    *   `.layout-left` 和 `.layout-right` 定义了左右分栏的比例（4:6）。
    *   `.group-*` 类（如 `.group-wire-standard`）用于包裹功能区块，统一样式为白底圆角卡片。

### 2.5 模态框与浮层 (Modals & Overlays)
*   **实现方式**:
    *   **更新日志模态框**: 使用 CSS 类 `.changelog-modal-overlay` 等。
    *   **图片导出预览**: 在 JS (`CalcPage.js`) 中通过 `document.createElement` 动态创建，并大量使用 **内联样式** (`overlay.style.position = "fixed"`)。
*   **问题**: JS 中硬编码的内联样式难以维护，且无法通过 CSS 统一管理主题。

---

## 3. 代码审查发现 (Code Review Findings)

### 3.1 HTML/JS 审查
1.  **动态生成**: 页面结构大量依赖 `innerHTML` 模板字符串（如 `CalcPage.js`）。虽然方便，但缺乏语法高亮和编译时检查，容易引入未闭合标签或拼写错误。
2.  **内联样式滥用**:
    *   在 `CalcPage.js` 的 `openImagePreviewModal` 函数中，大量使用了 `element.style.xxx`。
    *   收敛结果面板 (`convergence-panel`) 也使用了硬编码的内联样式。
3.  **ID 依赖**: JS 逻辑高度依赖特定的 ID（如 `#btn-page-calculate`, `#total-wire-count`），这使得组件难以复用（同一页面无法存在两个计算器实例）。

### 3.2 CSS 审查
1.  **全局污染风险**: `main.css` 中直接定义了标签选择器如 `body`, `input`, `button`，且缺乏命名空间隔离。
2.  **重复定义**:
    *   `.u-flex-center` 和 `.u-inline-flex-center` 是好的实践，但项目中仍散落着许多手动写的 `display: flex; align-items: center;`。
    *   颜色值（如 `#3A86FF`）在文件中出现多次，未提取为变量。
3.  **媒体查询分散**: 响应式规则分散在文件各处，维护时容易遗漏。

### 3.3 命名规范
*   **不一致**: 混用了 kebab-case (CSS) 和 camelCase (JS变量)。
*   **语义模糊**: 部分类名过于宽泛，如 `.text`, `.emoji`，容易产生冲突。建议使用更具体的 BEM 命名，如 `.sidebar__text`, `.sidebar__icon`。

---

## 4. 样式复用与优化建议

### 4.1 提取可复用组件 (Refactoring Candidates)

建议将以下模式提取为独立的 CSS 组件类：

| 组件名称 | 建议类名 | 包含属性 |
| :--- | :--- | :--- |
| **基础按钮** | `.btn` | `cursor: pointer`, `border-radius`, `transition` |
| **主操作按钮** | `.btn--primary` | 背景色 `#3A86FF`, 文字白色 |
| **危险操作按钮** | `.btn--danger` | 文字红色, 悬停浅红背景 |
| **卡片容器** | `.card` | `background: #fff`, `border-radius: 12px`, `box-shadow` |
| **数据表格** | `.data-table` | 统一的边框、内边距、斑马纹 |
| **表单控件** | `.form-control` | 统一的高度、边框、圆角、聚焦态 |

### 4.2 引入 CSS 变量 (CSS Variables)

建议在 `:root` 中定义主题变量，统一管理颜色和间距：

```css
:root {
  /* 品牌色 */
  --color-primary: #3A86FF;
  --color-danger: #DC3545;
  --color-success: #28a745;
  
  /* 灰度 */
  --color-text-main: #495057;
  --color-text-secondary: #6C757D;
  --color-border: #DEE2E6;
  --color-bg-page: #F8F9FA;
  
  /* 间距与尺寸 */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --radius-base: 8px;
}
```

### 4.3 移除 JS 内联样式

将 `CalcPage.js` 等文件中的动态样式移至 CSS。

**优化前 (JS):**
```javascript
overlay.style.position = "fixed";
overlay.style.background = "rgba(0,0,0,0.6)";
```

**优化后 (CSS):**
```css
.modal-overlay {
  position: fixed;
  background: rgba(0,0,0,0.6);
  /* ... */
}
```
**优化后 (JS):**
```javascript
overlay.className = "modal-overlay";
```

---

## 5. 潜在冲突风险点

1.  **ID 冲突**: 多个页面（如 HistoryPage 和 CalcPage）如果同时存在于 DOM 中（虽然目前是替换式路由），相同的 ID（如 `#main-data-table`）会导致 JS 选择器错误。目前看来是全量替换 `#main-content` 内容，风险较低，但仍建议使用类名选择器或确保 ID 唯一性。
2.  **样式覆盖**: `.calc-table input` 选择器权重较低，容易被更具体的选择器或后续加载的样式覆盖。
3.  **第三方库影响**: `chart.umd.js` 等库可能会注入自己的样式或 Canvas 行为，需确保容器 (`.simulation-area`) 有明确的尺寸约束（目前已有 `overflow: auto`）。

## 6. 总结

项目的样式结构清晰但略显冗余。核心问题在于 **JS 与 CSS 的耦合度较高**（内联样式、HTML 字符串拼接）以及 **缺乏系统化的 CSS 变量和组件库**。

**近期行动建议**:
1.  创建 `variables.css` 定义颜色和间距。
2.  重构 `CalcPage.js` 中的图片预览模态框，将其样式移入 CSS。
3.  统一表格样式，合并 `.calc-table` 和 `.config-table` 的公共部分。
