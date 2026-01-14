# 项目结构文档

## 目录结构概览

```
c:\Users\Yang\Documents\Github\Wire-Bundle-Diameter-Calculation\
├── _locales/                    # Chrome扩展国际化资源
│   ├── en/                     # 英文语言包
│   │   └── messages.json      # 英文翻译文本
│   └── zh_CN/                 # 简体中文语言包
│       └── messages.json      # 简体中文翻译文本
│
├── icons/                      # 扩展图标资源
│   ├── Language_cn.svg        # 中文语言切换图标
│   ├── Language_en.svg        # 英文语言切换图标
│   ├── SideOpen_Close.svg     # 侧边栏开关图标
│   ├── help.svg               # 帮助图标
│   ├── icon16.png            # 16x16 扩展图标
│   ├── icon32.png            # 32x32 扩展图标
│   ├── icon48.png            # 48x48 扩展图标
│   ├── icon64.png            # 64x64 扩展图标
│   └── icon128.png           # 128x128 扩展图标
│
├── language/                   # 应用国际化资源
│   ├── en/                     # 英文资源
│   │   ├── help.json          # 帮助文档英文版
│   │   └── messages.json      # 界面文本英文版
│   └── zh_CN/                 # 简体中文资源
│       ├── help.json          # 帮助文档中文版
│       └── messages.json      # 界面文本中文版
│
├── src/                        # 源代码目录
│   ├── assets/                # 静态资源
│   │   ├── img1.jpg          # 程序截图1
│   │   ├── img2.jpg          # 程序截图2
│   │   ├── img3.svg          # 矢量图标3
│   │   ├── img4.svg          # 矢量图标4
│   │   └── img5.svg          # 矢量图标5
│   │
│   ├── background/            # 后台脚本
│   │   └── openWindow.js     # 扩展启动处理
│   │
│   ├── components/            # UI组件
│   │   ├── chartRenderer.js  # 图表渲染组件
│   │   ├── feedback.js       # 用户反馈组件
│   │   └── simulationRenderer.js # 模拟结果渲染器
│   │
│   ├── i18n/                  # 国际化运行时
│   │   └── index.js          # 语言切换和文本加载
│   │
│   ├── logic/                 # 核心业务逻辑
│   │   ├── simulationConstants.js # 计算常量定义
│   │   ├── simulationEngine.js    # 蒙特卡洛模拟引擎
│   │   └── wireManager.js        # 导线数据管理
│   │
│   ├── pages/                 # 页面模块
│   │   ├── calc/              # 计算页面
│   │   │   └── inputCollector.js  # 输入收集器
│   │   ├── common/            # 公共页面组件
│   │   │   └── globalKeyManager.js # 全局键盘管理
│   │   ├── config/            # 配置页面
│   │   │   └── wiresStore.js  # 导线配置存储
│   │   ├── help/              # 帮助页面
│   │   │   ├── Help.js        # 帮助页面逻辑
│   │   │   ├── help.css       # 帮助页面样式
│   │   │   ├── help.html      # 帮助页面结构
│   │   │   └── assets/        # 帮助页面资源
│   │   │       ├── img1.jpg
│   │   │       ├── img2.jpg
│   │   │       ├── img3.svg
│   │   │       ├── img4.svg
│   │   │       └── img5.svg
│   │   ├── CalcPage.js        # 计算页面主控制器
│   │   ├── ConfigPage.js      # 配置页面主控制器
│   │   ├── HistoryPage.js     # 历史记录页面控制器
│   │   └── Popup.js          # 扩展主界面控制器
│   │
│   ├── services/              # 数据服务层
│   │   └── storage.js        # Chrome存储服务封装
│   │
│   ├── storage/               # 数据存储定义
│   │   └── standardWires.js  # 标准导线规格数据
│   │
│   ├── styles/                # 样式文件
│   │   └── main.css          # 主样式文件
│   │
│   ├── utils/                 # 工具函数
│   │   ├── mathUtils.js      # 数学计算工具
│   │   └── wireTypes.js      # 导线类型定义
│   │
│   └── vendor/               # 第三方库
│       ├── chart.umd.js      # Chart.js图表库
│       └── html2canvas.min.js # 截图导出库
│
├── docs/                      # 项目文档
│   ├── ARCHITECTURE.md       # 技术架构文档
│   ├── API.md               # API接口文档
│   ├── CONTRIBUTING.md      # 贡献指南
│   ├── DEPLOY.md            # 部署指南
│   └── PROJECT_STRUCTURE.md # 项目结构文档
│
├── manifest.json             # Chrome扩展配置文件
├── popup.html               # 扩展主界面入口
├── README.md                # 项目说明文档
├── CHANGELOG.md             # 版本更新日志
└── AGENTS.md                # 项目规范文档
```

## 核心模块详解

### 1. 业务逻辑层 (src/logic/)

#### simulationEngine.js
- **职责**: 核心计算引擎
- **主要功能**:
  - 蒙特卡洛模拟算法实现
  - 二维圆形填充优化
  - 碰撞检测与避让
  - 统计分析与置信区间计算
- **关键函数**:
  - `simulateBundleDiameter()` - 主要计算入口
  - `calculateContactNorm()` - 接触范数计算
  - `buildSpatialGrid()` - 空间网格加速

#### wireManager.js
- **职责**: 导线数据管理
- **主要功能**:
  - 标准导线规格维护
  - 自定义导线验证
  - 导线类型转换与格式化
- **关键函数**:
  - `getStandardWires()` - 获取标准规格
  - `validateWireSpec()` - 验证导线参数
  - `convertGauge()` - 线规转换

#### simulationConstants.js
- **职责**: 计算参数定义
- **内容**:
  - 默认模拟次数: 1000次
  - 容差范围: ±5%
  - 精度设置: 小数点后3位
  - 性能阈值与优化参数

### 2. 可视化组件 (src/components/)

#### simulationRenderer.js
- **职责**: 截面图渲染
- **技术**: HTML5 Canvas 2D API
- **特性**:
  - 实时渲染导线排列
  - 颜色编码区分导线类型
  - 支持缩放和平移操作
  - 响应式布局适配

#### chartRenderer.js
- **职责**: 统计图表生成
- **技术**: Chart.js库封装
- **图表类型**:
  - 直径分布直方图
  - 模拟结果趋势图
  - 统计指标展示

#### feedback.js
- **职责**: 用户反馈处理
- **功能**:
  - 错误提示显示
  - 操作状态反馈
  - 加载动画控制

### 3. 页面控制器 (src/pages/)

#### Popup.js
- **职责**: 扩展主界面管理
- **功能**:
  - 页面路由控制
  - 全局状态管理
  - 侧边栏交互处理
  - 语言切换协调

#### CalcPage.js
- **职责**: 计算页面主逻辑
- **功能**:
  - 输入表单管理
  - 计算流程控制
  - 结果展示协调
  - 历史记录保存

#### ConfigPage.js
- **职责**: 配置页面管理
- **功能**:
  - 导线库管理
  - 参数设置保存
  - 配置导入导出
  - 重置功能实现

#### HistoryPage.js
- **职责**: 历史记录管理
- **功能**:
  - 历史记录加载
  - 记录筛选搜索
  - 数据导出功能
  - 批量删除操作

### 4. 数据服务层 (src/services/)

#### storage.js
- **职责**: Chrome Storage API封装
- **功能**:
  - 异步存储操作
  - 数据变更监听
  - 存储空间管理
  - 错误处理机制

### 5. 工具模块 (src/utils/)

#### mathUtils.js
- **职责**: 数学计算工具
- **函数列表**:
  - `distance()` - 两点间距离
  - `distanceSq()` - 距离平方(性能优化)
  - `fastCheckCollision()` - 快速碰撞检测
  - `fRand()` - 随机数生成
  - `formatNumber()` - 数值格式化

#### wireTypes.js
- **职责**: 导线类型定义
- **内容**:
  - AWG规格对照表
  - mm²截面积换算
  - 标准外径数据
  - 公差范围定义

## 配置文件详解

### manifest.json
```json
{
  "manifest_version": 3,              // Manifest V3规范
  "name": "__MSG_extName__",         // 国际化名称
  "version": "1.0.3.2",              // 版本号
  "description": "__MSG_extDescription__", // 国际化描述
  "default_locale": "zh_CN",         // 默认语言
  "background": {
    "service_worker": "src/background/openWindow.js", // 后台脚本
    "type": "module"                   // ES6模块支持
  },
  "action": {
    "default_icon": {                  // 扩展图标集合
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "64": "icons/icon64.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {                           // 应用图标
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "64": "icons/icon64.png",
    "128": "icons/icon128.png"
  },
  "permissions": ["storage"]           // 所需权限
}
```

### 国际化资源结构

#### _locales/messages.json格式
```json
{
  "extName": {
    "message": "线束直径计算工具",
    "description": "扩展名称"
  },
  "extDescription": {
    "message": "基于二维填充算法的线束直径计算工具",
    "description": "扩展描述"
  }
}
```

#### language/messages.json格式
```json
{
  "appTitle": "线束直径计算工具",
  "calculate": "计算",
  "reset": "重置",
  "standardWires": "标准导线",
  "customWires": "特殊导线",
  "wrappingLayers": "包覆层",
  "manufacturingTolerance": "制造公差",
  "simulationCount": "模拟次数",
  "results": "计算结果",
  "crossSection": "截面图",
  "statistics": "统计图表"
}
```

## 开发约定

### 1. 模块导入导出
```javascript
// 优先使用ES6模块语法
import { calculateDiameter } from '../logic/simulationEngine.js';

// 导出多个函数
export {
  simulateBundleDiameter,
  calculateContactNorm,
  buildSpatialGrid
};

// 默认导出单个主要功能
export default simulationEngine;
```

### 2. 错误处理
```javascript
// 使用try-catch处理可能出错的操作
try {
  const result = await calculateDiameter(params);
  displayResults(result);
} catch (error) {
  console.error('计算失败:', error);
  showError('计算过程中出现错误，请检查输入参数');
}

// 参数验证
function validateInput(params) {
  if (!params.wires || !Array.isArray(params.wires)) {
    throw new Error('导线参数必须是数组');
  }
  if (params.simulationCount < 100) {
    throw new Error('模拟次数不能少于100次');
  }
  return true;
}
```

### 3. 异步操作
```javascript
// 使用async/await处理异步操作
async function loadHistory(options = {}) {
  try {
    const records = await storage.get('calculationHistory');
    return filterRecords(records, options);
  } catch (error) {
    console.error('加载历史记录失败:', error);
    return [];
  }
}

// Promise链式调用作为备选
function saveConfig(config) {
  return storage.set('userConfig', config)
    .then(() => console.log('配置已保存'))
    .catch(error => console.error('保存失败:', error));
}
```

### 4. 性能优化
```javascript
// 防抖处理高频操作
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 使用内存缓存避免重复计算
const calculationCache = new Map();
function cachedCalculate(params) {
  const key = JSON.stringify(params);
  if (calculationCache.has(key)) {
    return calculationCache.get(key);
  }
  const result = performCalculation(params);
  calculationCache.set(key, result);
  return result;
}
```

## 扩展开发指南

### 1. 添加新页面
1. 在 `src/pages/` 下创建新目录
2. 实现页面控制器（参考现有页面结构）
3. 在 `Popup.js` 中添加路由
4. 更新国际化资源
5. 添加必要的样式文件

### 2. 添加新组件
1. 在 `src/components/` 中创建组件文件
2. 遵循组件化开发原则
3. 提供清晰的接口定义
4. 添加必要的注释说明
5. 考虑复用性和扩展性

### 3. 扩展计算功能
1. 在 `src/logic/` 中添加算法实现
2. 保持算法模块的独立性
3. 提供清晰的输入输出定义
4. 添加性能优化考虑
5. 编写算法说明文档

---

这个项目结构经过精心设计，确保了代码的可维护性、可扩展性和良好的开发体验。遵循这些约定可以让团队协作更加高效，代码质量得到保证。
