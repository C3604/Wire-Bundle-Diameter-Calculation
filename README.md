# 线束直径计算工具 (Wire Bundle Diameter Calculator)

[![Edge Add-on](https://img.shields.io/badge/Edge%20Add--on-v1.0.3.2-blue)](https://microsoftedge.microsoft.com/addons/detail/%E7%BA%BF%E6%9D%9F%E7%9B%B4%E5%BE%84%E8%AE%A1%E7%AE%97%E5%B7%A5%E5%85%B7/dcinhgdofeolfogjefdocphbnmdicopj)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 项目概述

线束直径计算工具是一款专业的浏览器扩展应用，基于二维圆形填充算法，帮助电气工程师快速准确地计算线束外径。通过模拟导线在截面上的最优排列，结合制造公差分析，为线束设计提供可靠的数据支持。

### 主要特点
- 🎯 **专业计算**：基于蒙特卡洛模拟的精确算法
- 📊 **可视化展示**：实时生成截面图和统计图表
- 🌍 **国际化支持**：中英文双语界面
- 💾 **数据持久化**：本地存储配置和历史记录
- 📱 **响应式设计**：适配不同屏幕尺寸

## 环境要求

### 系统要求
- Windows 10 64位 21H2 或更高版本
- macOS 10.14 或更高版本
- Linux (Ubuntu 18.04+)

### 浏览器支持
- Microsoft Edge (Chromium内核) 88+
- Google Chrome 88+
- 其他Chromium内核浏览器

### 硬件要求
- 内存：至少 2GB RAM
- 存储：至少 50MB 可用空间

## 安装部署指南

### 方法一：应用商店安装 (推荐)
1. 访问 [Microsoft Edge 应用商店](https://microsoftedge.microsoft.com/addons/detail/%E7%BA%BF%E6%9D%9F%E7%9B%B4%E5%BE%84%E8%AE%A1%E7%AE%97%E5%B7%A5%E5%85%B7/dcinhgdofeolfogjefdocphbnmdicopj)
2. 点击"获取"按钮
3. 确认安装权限
4. 安装完成后，扩展图标将出现在浏览器工具栏

### 方法二：开发者模式安装
1. 下载项目源码到本地
2. 打开浏览器扩展管理页面：
   - Edge: 地址栏输入 `edge://extensions/`
   - Chrome: 地址栏输入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录（包含 `manifest.json` 文件）
6. 扩展将自动加载并显示在工具栏

### 验证安装
点击浏览器工具栏中的扩展图标，如果能正常打开主界面，说明安装成功。

## 开发规范

### 代码风格
- **缩进**：使用 2 个空格
- **引号**：JavaScript 使用单引号，HTML 使用双引号
- **命名**：
  - 文件名：小驼峰命名法（如 `wireManager.js`）
  - CSS 类名：短横线分隔（如 `.layout-left`）
  - 变量名：小驼峰命名法（如 `circleRadius`）
  - 常量名：全大写+下划线（如 `MAX_SIMULATION_COUNT`）

### 模块组织
```
src/
├── logic/          # 核心业务逻辑
├── components/     # UI 组件
├── pages/          # 页面容器
├── services/       # 数据服务
├── storage/        # 数据持久化
├── utils/          # 工具函数
├── i18n/           # 国际化
└── styles/         # 样式文件
```

### 提交规范
- 使用清晰的提交信息格式：`类型: 简短描述`
- 常见类型：
  - `feat:` 新功能
  - `fix:` 修复bug
  - `docs:` 文档更新
  - `style:` 代码格式
  - `refactor:` 重构
  - `test:` 测试相关
  - `chore:` 构建过程或辅助工具的变动

## 贡献指南

### 如何贡献
1. Fork 项目到个人仓库
2. 创建特性分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m 'feat: 添加新功能'`
4. 推送分支：`git push origin feature/新功能`
5. 创建 Pull Request

### 开发流程
1. 克隆项目到本地
2. 在浏览器中加载扩展（开发者模式）
3. 进行修改和测试
4. 确保所有功能正常工作
5. 更新相关文档
6. 提交更改

### 报告问题
发现问题时，请通过以下方式报告：
- 提供详细的复现步骤
- 说明预期行为和实际行为
- 附上相关截图或错误信息
- 标明使用的浏览器版本和操作系统

### 功能建议
欢迎提出新功能建议，请说明：
- 功能的具体用途
- 预期的用户群体
- 建议的实现方案
- 对现有功能的影响

## 核心功能

### 导线管理
- **标准导线**：内置常用导线规格库，支持AWG、mm²等标准
- **自定义导线**：允许输入特殊导线规格
- **批量操作**：支持多行输入和快速编辑

### 计算引擎
- **二维填充算法**：模拟导线在截面上的最优排列
- **蒙特卡洛模拟**：通过随机采样评估制造公差影响
- **实时计算**：输入数据时自动更新结果

### 可视化展示
- **截面图**：显示导线排列的二维截面
- **统计图表**：直径分布直方图和趋势图
- **数据表格**：详细的计算结果和统计信息

### 数据管理
- **历史记录**：自动保存计算参数和结果
- **配置存储**：保存用户偏好和标准设置
- **数据导出**：支持CSV和图片格式导出

## 数据源说明
- 计算页与查询页的“导线标准”统一读取 `src/storage/Database` 目录下的 indexed JSON（如 `Aptiv_M-Spec.indexed.json`）。
- 标准列表通过解析 [mspec.README.md](./src/storage/Database/mspec.README.md) 自动生成，避免硬编码。
- 字段映射：线规→`WireSize`，类型→`WallThickness`，直径→`Specs["Cable Outside Diameter"]`。
- 检索采用索引级联选择（byWireSize/byWallThickness/byWireType/byConductorDesign），详情参考 mspec.README。
- 旧数据源（`src/storage/WireStandard`、`src/storage/standardWires.js`、`src/storage/wireStandardLoader.js`）已移除。

## 技术架构

### 前端技术
- **HTML5/CSS3**：构建用户界面
- **JavaScript ES6+**：实现业务逻辑
- **Canvas API**：绘制图表和截面图
- **Web Storage API**：本地数据持久化

### 扩展架构
- **Manifest V3**：最新的Chrome扩展标准
- **Service Worker**：后台脚本处理
- **Content Scripts**：页面内容注入
- **Popup Interface**：主用户界面

### 算法核心
- **圆形填充算法**：基于物理模拟的导线排列
- **碰撞检测**：高效的圆形碰撞检测算法
- **统计分析**：标准差、置信区间等统计计算

## 更新日志

详细的版本更新记录请查看 [CHANGELOG.md](./CHANGELOG.md)

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持与联系

如遇到问题或有任何建议，欢迎通过以下方式联系：
- 提交 Issue
- 发送邮件
- 参与讨论

---

**感谢使用线束直径计算工具！** 希望这个工具能为你的工程设计工作带来便利。

# 手动打包脚本（选择性打包）

**作用**
- 将项目核心运行文件按 .buildignore 规则进行过滤打包为 ZIP，便于上线或分发；不依赖第三方构建工具。

**包含范围**
- 必备：manifest.json、popup.html
- 代码与资源：src/**、icons/**、_locales/**
- 运行时静态：src/pages/help/assets/**、src/storage/**

**脚本位置**
- 批处理入口：[build.bat](./build.bat)
- 核心逻辑（PowerShell）：[build-core.ps1](./build-core.ps1)
- 忽略规则模板：[.buildignore](./.buildignore)

**参数说明**
- --version 指定版本号（覆盖 manifest.json）
- --output 指定输出目录（默认 ./release）
- --clean 打包前清理临时目录与同名旧包

**使用示例（Windows）**

```powershell
# 默认打包到 ./release，版本号读取 manifest.json
build.bat

# 指定版本
build.bat --version 10.3.4

# 指定输出目录并清理
build.bat --output C:\dist --clean
```

**命名与版本来源**
- 压缩包命名：项目名称_v[版本号]_[YYYYMMDD].zip
- 项目名称优先取 manifest.name；如为 __MSG_xxx__ 形式则使用仓库文件夹名
- 版本号优先取 --version，否则读取 [manifest.json](./manifest.json) 的 version

**忽略规则**
- .buildignore 语法类似 .gitignore，支持注释、通配符、目录模式与反排除(!)
- 常见排除：IDE目录、构建产物、测试/示例、临时与系统文件、环境配置、扩展产物等

**日志与错误处理**
- 日志文件：logs/build-YYYYMMDD-HHMMSS.log
- 失败场景：缺少 manifest.json、版本解析失败、压缩失败等；脚本返回非零退出码
