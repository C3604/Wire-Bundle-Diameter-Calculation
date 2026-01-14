# 部署运维手册

## 1. 环境准备

### 1.1 系统要求

#### 开发环境
- **操作系统**: Windows 10 64位 21H2+ / macOS 10.14+ / Ubuntu 18.04+
- **Node.js**: 16.0.0 或更高版本
- **浏览器**: Chrome 88+ / Edge 88+ / Firefox 85+
- **代码编辑器**: VS Code (推荐) / WebStorm / Sublime Text

#### 部署环境
- **Web服务器**: Nginx / Apache (可选，用于静态资源托管)
- **CDN服务**: CloudFlare / AWS CloudFront (可选，用于全球分发)
- **域名**: 已备案的域名 (可选，用于在线文档托管)

### 1.2 工具安装

#### Git配置
```bash
# 安装Git后配置用户信息
git config --global user.name "你的姓名"
git config --global user.email "你的邮箱@example.com"

# 配置换行符处理 (Windows)
git config --global core.autocrlf true

# 配置SSH密钥 (推荐)
ssh-keygen -t rsa -b 4096 -C "你的邮箱@example.com"
```

#### Node.js环境
```bash
# 使用nvm管理Node.js版本 (推荐)
# Windows: 下载nvm-windows
# macOS/Linux: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装Node.js
nvm install 16
nvm use 16

# 验证安装
node --version
npm --version
```

## 2. 项目获取与初始化

### 2.1 克隆项目
```bash
# HTTPS方式
git clone https://github.com/your-username/Wire-Bundle-Diameter-Calculation.git

# SSH方式 (推荐)
git clone git@github.com:your-username/Wire-Bundle-Diameter-Calculation.git

# 进入项目目录
cd Wire-Bundle-Diameter-Calculation
```

### 2.2 项目结构确认
```bash
# 检查项目结构
ls -la

# 应该包含以下文件和目录
# manifest.json (扩展配置文件)
# popup.html (主界面入口)
# src/ (源代码目录)
# docs/ (文档目录)
# icons/ (图标资源)
# language/ (国际化资源)
```

### 2.3 依赖检查
由于本项目是纯前端项目，不依赖Node.js模块，但需要检查第三方库：
```bash
# 检查vendor目录下的第三方库
ls -la src/vendor/
# 应该包含:
# - chart.umd.js (Chart.js)
# - html2canvas.min.js (html2canvas)
```

## 3. 开发环境部署

### 3.1 Chrome扩展安装 (开发模式)

#### 步骤1: 打开扩展管理页面
- **Chrome**: 地址栏输入 `chrome://extensions/`
- **Edge**: 地址栏输入 `edge://extensions/`
- **其他Chromium浏览器**: 类似地址

#### 步骤2: 启用开发者模式
1. 找到页面右上角的"开发者模式"开关
2. 点击开关启用开发者模式
3. 页面会显示额外的开发工具按钮

#### 步骤3: 加载扩展
1. 点击"加载已解压的扩展程序"按钮
2. 在文件选择对话框中，选择项目根目录
3. 确保选择的是包含 `manifest.json` 的目录
4. 点击"选择文件夹"

#### 步骤4: 验证安装
成功加载后，你应该看到：
- 扩展出现在扩展列表中
- 浏览器工具栏显示扩展图标
- 扩展图标可以点击并打开主界面

### 3.2 调试配置

#### 开启调试模式
在 `src/utils/debug.js` 中添加：
```javascript
window.DEBUG_MODE = true;
window.LOG_LEVEL = 'debug'; // 'error', 'warn', 'info', 'debug'
```

#### 使用Chrome DevTools
1. 右键点击扩展图标，选择"检查弹出内容"
2. 或者点击扩展图标后，按 F12 打开开发者工具
3. 在Console中查看日志输出
4. 在Network面板中查看存储操作

#### 断点调试
1. 在Sources面板中找到需要调试的JS文件
2. 点击行号设置断点
3. 触发相应操作，代码会在断点处暂停
4. 使用Step Over/Into/Out进行单步调试

### 3.3 热重载设置
由于Chrome扩展的限制，需要手动刷新：
1. 修改代码后保存文件
2. 返回扩展管理页面
3. 点击扩展卡片上的"刷新"按钮
4. 或者使用快捷键 Ctrl+R (Windows) / Cmd+R (Mac)

## 4. 生产环境部署

### 4.1 版本发布准备

#### 版本号管理
1. 更新 `manifest.json` 中的版本号
2. 更新 `README.md` 中的版本标识
3. 在 `CHANGELOG.md` 中添加新版本记录
4. 提交版本更新:
```bash
git add .
git commit -m "chore: 发布版本 1.0.3.2"
git tag v1.0.3.2
git push origin main --tags
```

#### 代码质量检查
```bash
# 检查代码风格 (如果有lint配置)
npm run lint

# 检查潜在问题
# 手动检查清单:
# - 没有console.log在生产代码中
# - 错误处理完善
# - 性能优化到位
# - 国际化文本完整
```

### 4.2 Chrome Web Store发布

#### 准备发布材料
- **扩展包**: 打包扩展目录 (不包含.git和docs)
- **截图**: 1280x800或640x400的PNG图片
- **图标**: 128x128像素的图标
- **详细描述**: 功能介绍、使用说明
- **关键词**: 相关的搜索关键词

#### 打包扩展
```bash
# 创建发布目录
mkdir release
cp -r src release/
cp -r icons release/
cp -r language release/
cp -r _locales release/
cp manifest.json release/
cp popup.html release/

# 创建压缩包
cd release
zip -r ../wire-bundle-calculator-v1.0.3.2.zip .
cd ..
```

#### 上传到Chrome Web Store
1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 点击"上传新扩展"按钮
3. 选择打包好的zip文件
4. 填写扩展信息:
   - 标题: 线束直径计算工具
   - 简短描述: 基于二维填充算法的专业线束直径计算工具
   - 详细描述: 完整的功能介绍
   - 分类: 开发者工具
5. 上传截图和图标
6. 设置可见性选项
7. 提交审核

### 4.3 Microsoft Edge扩展商店发布

#### Edge扩展商店特点
- 审核流程相对宽松
- 支持渐进式Web应用(PWA)
- 更好的Windows集成

#### 发布步骤
1. 访问 [Microsoft Edge Developer Dashboard](https://developer.microsoft.com/en-us/microsoft-edge/extensions/)
2. 注册开发者账户 (需要Microsoft账户)
3. 点击"提交新扩展"
4. 上传扩展包
5. 填写扩展信息 (类似Chrome Web Store)
6. 提交审核

## 5. 自动化部署

### 5.1 GitHub Actions配置
创建 `.github/workflows/deploy.yml`:
```yaml
name: Deploy Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: |
        # 如果有构建依赖
        npm install
    
    - name: Build extension
      run: |
        # 如果有构建步骤
        npm run build
    
    - name: Create release package
      run: |
        mkdir release
        cp -r src release/
        cp -r icons release/
        cp -r language release/
        cp -r _locales release/
        cp manifest.json release/
        cp popup.html release/
        cd release
        zip -r ../extension-${{ github.ref_name }}.zip .
    
    - name: Upload to release
      uses: actions/upload-release-asset@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        upload_url: ${{ github.event.release.upload_url }}
        asset_path: ./extension-${{ github.ref_name }}.zip
        asset_name: extension-${{ github.ref_name }}.zip
        asset_content_type: application/zip
```

### 5.2 持续集成脚本
创建 `scripts/deploy.sh`:
```bash
#!/bin/bash

# 部署脚本
set -e

echo "开始部署流程..."

# 检查版本号参数
if [ -z "$1" ]; then
    echo "错误: 请提供版本号参数"
    echo "用法: ./deploy.sh 1.0.3.2"
    exit 1
fi

VERSION=$1
echo "部署版本: $VERSION"

# 更新版本号
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" manifest.json

# 创建发布包
echo "创建发布包..."
mkdir -p dist
zip -r dist/extension-v$VERSION.zip \
    src/ \
    icons/ \
    language/ \
    _locales/ \
    manifest.json \
    popup.html

echo "发布包创建完成: dist/extension-v$VERSION.zip"

# 可选: 自动上传到Chrome Web Store
if [ ! -z "$CHROME_WEBSTORE_TOKEN" ]; then
    echo "上传到Chrome Web Store..."
    # 这里添加上传命令
fi

echo "部署完成!"
```

## 6. 监控与维护

### 6.1 错误监控

#### 客户端错误收集
在 `src/utils/errorHandler.js` 中添加:
```javascript
class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }
  
  captureError(error, context = {}) {
    const errorInfo = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.errors.push(errorInfo);
    
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // 保存到本地存储
    this.saveErrors();
  }
  
  saveErrors() {
    localStorage.setItem('extension_errors', JSON.stringify(this.errors));
  }
  
  getErrors() {
    return this.errors;
  }
  
  clearErrors() {
    this.errors = [];
    localStorage.removeItem('extension_errors');
  }
}

window.errorMonitor = new ErrorMonitor();

// 全局错误捕获
window.addEventListener('error', (event) => {
  window.errorMonitor.captureError(event.error, {
    type: 'global',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  window.errorMonitor.captureError(new Error(event.reason), {
    type: 'promise',
    reason: event.reason
  });
});
```

#### 性能监控
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      calculationTime: [],
      renderTime: [],
      memoryUsage: []
    };
  }
  
  recordCalculationTime(duration) {
    this.metrics.calculationTime.push({
      timestamp: Date.now(),
      duration: duration
    });
    this.trimArray(this.metrics.calculationTime, 100);
  }
  
  recordRenderTime(duration) {
    this.metrics.renderTime.push({
      timestamp: Date.now(),
      duration: duration
    });
    this.trimArray(this.metrics.renderTime, 100);
  }
  
  recordMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      });
      this.trimArray(this.metrics.memoryUsage, 100);
    }
  }
  
  trimArray(array, maxLength) {
    if (array.length > maxLength) {
      array.splice(0, array.length - maxLength);
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  getAverageCalculationTime() {
    const times = this.metrics.calculationTime.map(m => m.duration);
    return times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0;
  }
}

window.performanceMonitor = new PerformanceMonitor();
```

### 6.2 用户反馈收集

#### 反馈表单
```javascript
class FeedbackCollector {
  constructor() {
    this.feedbackEndpoint = 'https://your-api.com/feedback';
  }
  
  async submitFeedback(feedback) {
    try {
      const response = await fetch(this.feedbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedback,
          timestamp: Date.now(),
          version: chrome.runtime.getManifest().version,
          userAgent: navigator.userAgent
        })
      });
      
      if (!response.ok) {
        throw new Error('反馈提交失败');
      }
      
      return { success: true };
    } catch (error) {
      console.error('反馈提交失败:', error);
      // 本地保存，稍后重试
      this.saveFeedbackLocally(feedback);
      return { success: false, error: error.message };
    }
  }
  
  saveFeedbackLocally(feedback) {
    const pending = JSON.parse(localStorage.getItem('pending_feedback') || '[]');
    pending.push(feedback);
    localStorage.setItem('pending_feedback', JSON.stringify(pending));
  }
  
  async retryPendingFeedback() {
    const pending = JSON.parse(localStorage.getItem('pending_feedback') || '[]');
    if (pending.length === 0) return;
    
    const results = await Promise.allSettled(
      pending.map(feedback => this.submitFeedback(feedback))
    );
    
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length === 0) {
      localStorage.removeItem('pending_feedback');
    }
  }
}
```

### 6.3 版本更新策略

#### 向后兼容性
- 数据格式变更时提供迁移方案
- 保持API接口稳定
- 废弃功能提供过渡期
- 重要变更提前通知用户

#### 自动更新机制
```javascript
class UpdateManager {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24小时
    this.lastCheck = localStorage.getItem('last_update_check') || 0;
  }
  
  async checkForUpdates() {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return;
    }
    
    try {
      const response = await fetch('https://api.github.com/repos/your-repo/releases/latest');
      const release = await response.json();
      
      const currentVersion = chrome.runtime.getManifest().version;
      const latestVersion = release.tag_name.replace('v', '');
      
      if (this.isNewerVersion(latestVersion, currentVersion)) {
        this.notifyUpdateAvailable(release);
      }
      
      localStorage.setItem('last_update_check', now);
    } catch (error) {
      console.error('检查更新失败:', error);
    }
  }
  
  isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    
    return false;
  }
  
  notifyUpdateAvailable(release) {
    // 显示更新通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '更新可用',
      message: `新版本 ${release.tag_name} 可用，点击查看详情`
    }, (notificationId) => {
      // 处理通知点击
      chrome.notifications.onClicked.addListener((id) => {
        if (id === notificationId) {
          chrome.tabs.create({ url: release.html_url });
        }
      });
    });
  }
}
```

## 7. 故障排查

### 7.1 常见问题

#### 扩展无法加载
**症状**: 扩展管理页面显示错误图标
**原因**: 
- manifest.json格式错误
- 文件路径不正确
- 权限声明不完整

**解决**:
1. 检查manifest.json语法
2. 验证所有文件路径
3. 确认权限设置正确

#### 功能无法正常使用
**症状**: 点击计算按钮无反应
**原因**:
- JavaScript错误
- 存储权限未授权
- 第三方库加载失败

**解决**:
1. 打开开发者工具查看控制台错误
2. 检查扩展权限设置
3. 验证第三方库文件完整性

#### 国际化显示异常
**症状**: 文本显示为键名而非翻译文本
**原因**:
- 翻译文件格式错误
- 语言代码不匹配
- 文本键名错误

**解决**:
1. 检查JSON文件格式
2. 验证语言代码一致性
3. 确认文本键名正确

### 7.2 调试技巧

#### 日志调试
```javascript
// 分级日志系统
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(level = LogLevel.INFO) {
    this.level = level;
  }
  
  error(message, ...args) {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
  
  warn(message, ...args) {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
  
  info(message, ...args) {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
  
  debug(message, ...args) {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
}

// 使用示例
const logger = new Logger(LogLevel.DEBUG);
logger.debug('计算参数:', calculationParams);
logger.info('计算开始');
logger.warn('输入参数接近边界值');
logger.error('计算失败', error);
```

#### 性能分析
```javascript
// 性能分析工具
function measurePerformance(name, fn) {
  return async function(...args) {
    const start = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    try {
      const result = await fn.apply(this, args);
      
      const end = performance.now();
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const duration = end - start;
      const memoryDelta = endMemory - startMemory;
      
      console.log(`[Performance] ${name}:`);
      console.log(`  执行时间: ${duration.toFixed(2)}ms`);
      console.log(`  内存变化: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`[Performance] ${name} 失败:`, error);
      console.error(`  执行时间: ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  };
}

// 使用示例
const measuredCalculate = measurePerformance('直径计算', calculateDiameter);
const result = await measuredCalculate(params);
```

---

通过遵循这个部署运维手册，可以确保线束直径计算工具在各种环境中稳定运行，并为用户提供可靠的服务。定期的监控和维护是保证扩展长期健康运行的关键。
