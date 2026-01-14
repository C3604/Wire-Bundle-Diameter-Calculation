# API 文档

## 1. 计算引擎 API

### 1.1 蒙特卡洛模拟引擎

#### `simulateBundleDiameter(params)`
执行线束直径计算的蒙特卡洛模拟。

**参数：**
```javascript
{
  wires: Array<{
    type: string,        // 导线类型: 'standard' | 'custom'
    gauge: string,       // 线规 (如 '24AWG', '0.5mm²')
    diameter: number,    // 导线直径 (mm)
    count: number,       // 导线数量
    tolerance: number    // 制造公差 (%)
  }>,
  wrappings: Array<{
    name: string,        // 包覆层名称
    thickness: number,   // 厚度 (mm)
    tolerance: number    // 公差 (%)
  }>,
  simulationCount: number,  // 模拟次数 (默认 1000)
  toleranceEnabled: boolean   // 是否启用公差计算
}
```

**返回值：**
```javascript
{
  minDiameter: number,     // 最小直径 (mm)
  maxDiameter: number,     // 最大直径 (mm)
  avgDiameter: number,     // 平均直径 (mm)
  stdDeviation: number,  // 标准差
  confidence95: {         // 95%置信区间
    lower: number,
    upper: number
  },
  simulations: Array<number>,  // 每次模拟的直径结果
  optimalLayout: Array<{        // 最优排列方案
    x: number,            // 圆心X坐标
    y: number,            // 圆心Y坐标
    r: number,            // 半径
    type: string          // 导线类型
  }>
}
```

#### `calculateContactNorm(circles)`
计算圆形接触范数，衡量排列紧密度。

**参数：**
```javascript
Array<{
  x: number,    // 圆心X坐标
  y: number,    // 圆心Y坐标
  r: number     // 半径
}>
```

**返回值：**
```javascript
number  // 接触范数值 (0-1，值越大排列越紧密)
```

### 1.2 导线管理 API

#### `getStandardWires()`
获取所有标准导线规格。

**返回值：**
```javascript
Array<{
  gauge: string,      // 线规标识
  diameter: number,   // 直径 (mm)
  area: number,      // 截面积 (mm²)
  type: string       // 导线类型
}>
```

#### `addCustomWire(wireSpec)`
添加自定义导线规格。

**参数：**
```javascript
{
  gauge: string,     // 自定义线规名称
  diameter: number,  // 直径 (mm)
  type?: string      // 类型 (可选)
}
```

#### `validateWireSpec(wire)`
验证导线规格的有效性。

**参数：**
```javascript
{
  gauge: string,     // 线规
  diameter: number,  // 直径
  count: number      // 数量
}
```

**返回值：**
```javascript
{
  valid: boolean,    // 是否有效
  errors: Array<string>  // 错误信息列表
}
```

## 2. 可视化渲染 API

### 2.1 截面图渲染

#### `renderCrossSection(canvas, layout, options)`
在Canvas上渲染导线截面图。

**参数：**
```javascript
{
  canvas: HTMLCanvasElement,  // 目标画布
  layout: Array<{              // 排列数据
    x: number,
    y: number,
    r: number,
    color: string,
    label: string
  }>,
  options: {
    scale?: number,           // 缩放比例
    showLabels?: boolean,     // 显示标签
    showGrid?: boolean,       // 显示网格
    backgroundColor?: string // 背景色
  }
}
```

#### `updateCrossSection(layout)`
更新现有的截面图显示。

**参数：**
```javascript
Array<{
  x: number,
  y: number,
  r: number,
  color?: string,
  animated?: boolean
}>
```

### 2.2 图表渲染

#### `renderDiameterChart(canvas, data, type)`
渲染直径统计图表。

**参数：**
```javascript
{
  canvas: HTMLCanvasElement,
  data: {
    labels: Array<string>,      // X轴标签
    datasets: Array<{
      label: string,            // 数据集名称
      data: Array<number>,      // 数据值
      backgroundColor: string,  // 背景色
      borderColor: string      // 边框色
    }>
  },
  type: 'histogram' | 'line' | 'bar'  // 图表类型
}
```

#### `exportChartAsImage(chart, format)`
将图表导出为图片。

**参数：**
```javascript
{
  chart: Chart,        // Chart.js实例
  format: 'png' | 'jpg' | 'svg'  // 导出格式
}
```

**返回值：**
```javascript
Promise<string>  // 图片的DataURL
```

## 3. 数据存储 API

### 3.1 配置存储

#### `saveConfig(config)`
保存用户配置。

**参数：**
```javascript
{
  language: string,           // 语言设置
  theme: string,            // 主题设置
  defaultTolerance: number, // 默认公差
  autoSave: boolean,       // 自动保存
  simulationCount: number  // 默认模拟次数
}
```

#### `loadConfig()`
加载用户配置。

**返回值：**
```javascript
Promise<{
  language: string,
  theme: string,
  defaultTolerance: number,
  autoSave: boolean,
  simulationCount: number
}>
```

### 3.2 历史记录

#### `saveHistory(record)`
保存计算历史。

**参数：**
```javascript
{
  timestamp: number,      // 时间戳
  params: Object,        // 计算参数
  results: Object,       // 计算结果
  name?: string         // 自定义名称
}
```

#### `loadHistory(options)`
加载历史记录。

**参数：**
```javascript
{
  limit?: number,        // 返回记录数限制
  startTime?: number,   // 开始时间
  endTime?: number      // 结束时间
}
```

**返回值：**
```javascript
Promise<Array<{
  id: string,
  timestamp: number,
  params: Object,
  results: Object,
  name: string
}>>
```

#### `deleteHistory(id)`
删除指定历史记录。

**参数：**
```javascript
string  // 记录ID
```

#### `clearHistory()`
清空所有历史记录。

### 3.3 数据导出

#### `exportToCSV(data, filename)`
导出数据为CSV格式。

**参数：**
```javascript
{
  data: Array<Object>,    // 要导出的数据
  filename: string,      // 文件名
  headers?: Array<string> // 表头 (可选)
}
```

#### `exportToJSON(data, filename)`
导出数据为JSON格式。

**参数：**
```javascript
{
  data: Object,      // 要导出的数据
  filename: string  // 文件名
}
```

## 4. 国际化 API

### 4.1 语言管理

#### `setLanguage(lang)`
设置界面语言。

**参数：**
```javascript
string  // 'zh_CN' | 'en'
```

#### `getCurrentLanguage()`
获取当前语言设置。

**返回值：**
```javascript
string  // 当前语言代码
```

#### `getAvailableLanguages()`
获取支持的语言列表。

**返回值：**
```javascript
Array<{
  code: string,    // 语言代码
  name: string,   // 语言名称
  nativeName: string  // 本地名称
}>
```

### 4.2 文本翻译

#### `t(key, params)`
翻译文本。

**参数：**
```javascript
{
  key: string,           // 翻译键
  params?: Object       // 替换参数 (可选)
}
```

**返回值：**
```javascript
string  // 翻译后的文本
```

#### `loadTranslations(language)`
加载指定语言的翻译文件。

**参数：**
```javascript
string  // 语言代码
```

## 5. 工具函数 API

### 5.1 数学工具

#### `distance(x1, y1, x2, y2)`
计算两点间距离。

**参数：**
```javascript
number, number, number, number  // 坐标值
```

**返回值：**
```javascript
number  // 距离值
```

#### `distanceSq(x1, y1, x2, y2)`
计算两点间距离的平方（性能优化）。

#### `fastCheckCollision(circle1, circle2)`
快速检测两个圆形是否碰撞。

**参数：**
```javascript
{
  x: number, y: number, r: number  // 圆1
},
{
  x: number, y: number, r: number  // 圆2
}
```

**返回值：**
```javascript
boolean  // 是否碰撞
```

#### `fRand(min, max)`
生成指定范围内的随机浮点数。

### 5.2 数据验证

#### `validateNumber(value, options)`
验证数值的有效性。

**参数：**
```javascript
{
  value: any,              // 要验证的值
  options: {
    min?: number,         // 最小值
    max?: number,         // 最大值
    integer?: boolean,    // 是否为整数
    required?: boolean    // 是否必需
  }
}
```

**返回值：**
```javascript
{
  valid: boolean,
  value: number,
  error?: string
}
```

#### `validateWireArray(wires)`
验证导线数组的有效性。

### 5.3 格式化工具

#### `formatNumber(value, decimals, unit)`
格式化数值显示。

**参数：**
```javascript
{
  value: number,        // 数值
  decimals?: number,    // 小数位数 (默认2)
  unit?: string        // 单位 (可选)
}
```

**返回值：**
```javascript
string  // 格式化后的字符串
```

#### `formatDiameter(value)`
专门用于格式化直径值。

#### `formatTolerance(value)`
格式化公差值显示。

## 6. 事件系统 API

### 6.1 事件监听

#### `on(event, callback)`
监听事件。

**支持的事件：**
- `'calculation:start'` - 计算开始
- `'calculation:complete'` - 计算完成
- `'calculation:error'` - 计算错误
- `'config:changed'` - 配置变更
- `'language:changed'` - 语言切换

#### `off(event, callback)`
取消事件监听。

#### `emit(event, data)`
触发事件。

### 6.2 生命周期钩子

#### `beforeCalculation(params)`
计算前的钩子函数。

#### `afterCalculation(results)`
计算后的钩子函数。

#### `onError(error)`
错误处理钩子函数。

## 7. 性能监控 API

### 7.1 性能指标

#### `getPerformanceMetrics()`
获取性能指标。

**返回值：**
```javascript
{
  calculationTime: number,    // 计算耗时 (ms)
  renderTime: number,        // 渲染耗时 (ms)
  memoryUsage: number,       // 内存使用 (MB)
  simulationCount: number    // 模拟次数
}
```

#### `startProfiling()`
开始性能分析。

#### `stopProfiling()`
停止性能分析并返回结果。

### 7.2 内存管理

#### `clearCache()`
清除计算缓存。

#### `gc()`
建议垃圾回收（开发模式）。

#### `getMemoryInfo()`
获取内存使用信息。

## 8. 调试 API

### 8.1 调试模式

#### `setDebugMode(enabled)`
启用/禁用调试模式。

#### `getDebugInfo()`
获取调试信息。

### 8.2 日志系统

#### `log(level, message, data)`
记录日志。

**日志级别：**
- `'error'` - 错误
- `'warn'` - 警告
- `'info'` - 信息
- `'debug'` - 调试

#### `enableLogging(level)`
启用日志记录。

#### `clearLogs()`
清除日志记录。

---

**注意**: 所有API都遵循错误优先的回调模式，异步操作返回Promise。详细的错误信息会在控制台输出，便于调试和问题定位。
