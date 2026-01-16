# 目标与边界
- 提供一个可执行的 Windows 批处理脚本（build.bat），用于“选择性打包”而非构建（仓库为源码直载型扩展）。
- 仅收集核心运行文件，自动排除开发/临时/非必要资源；排除规则由 .buildignore 决定。
- 产出 ZIP 包，命名为：项目名称_v[版本号]_[YYYYMMDD].zip；版本默认读取 manifest.json，可由 --version 覆盖。
- 纯 Windows 方案：批处理主控 + 调用 PowerShell 完成清单过滤与压缩；不使用任何 Unix 工具。

# 选择性打包范围（默认包含集）
- 必备入口：manifest.json、popup.html。
- 代码与资源：src/**、icons/**、_locales/**。
- 运行时静态：src/pages/help/assets/**、src/storage/**（包括 WireStandard 与 index.json）。
- 说明类文件默认不打包：README.md、CHANGELOG.md、AGENTS.md（可通过 .buildignore 调整）。

# .buildignore 规则设计
- 语法类似 .gitignore，支持：
  - 空行与以 # 开头的注释行
  - 通配符 *、?，目录排除以斜杠结尾（如 node_modules/）
  - 相对路径模式（相对项目根目录）
  - （可选）否定匹配以 ! 开头，用于“反排除”（如 !src/vendor/keep.js）
- 模板（示例，将用于交付的 .buildignore）：
  - .git/、.github/、.vscode/、.idea/、*.code-workspace
  - node_modules/、dist/、build/、out/、coverage/、.cache/、.parcel-cache/、.vite/、.next/
  - tests/、test*/、__tests__/、*.spec.*、*.test.*
  - docs/、examples/
  - *.log、*.tmp、*.bak、*~、Thumbs.db、desktop.ini
  - .env、.env.*、.envrc、*.pem
  - release/、packages/、*.crx、*.xpi
  - .eslintcache、.tsbuildinfo、.nyc_output/、.turbo/、.pnpm-store/

# 脚本实现设计（build.bat）
- 参数：
  - --version 指定版本号（优先级最高）
  - --output 指定输出目录（默认 ./release）
  - --clean 打包前清理：删除临时工作区与旧的同名 ZIP
- 命名：
  - 项目名称优先取 manifest.name；缺失则用仓库文件夹名
  - 版本号优先取 --version；否则读取 manifest.json 的 version
  - 日期格式 YYYYMMDD（本地时区）
- 日志与错误处理：
  - 控制台 + 写入 logs/build-YYYYMMDD-HHMMSS.log；记录步骤、耗时、异常与退出码
  - 对缺失文件、解析失败、权限不足、压缩失败等场景设定非零退出码
- 关键步骤：
  1) 解析参数；设置 ROOT、OUTPUT、TEMP（默认 .build-temp）与 LOG
  2) 读取 manifest.json（PowerShell ConvertFrom-Json）获取 name 与 version
  3) 清理：若 --clean，则删除 TEMP 与 OUTPUT 下的同名历史包
  4) 生成“默认包含集”清单（manifest.json、popup.html、src/**、icons/**、_locales/**、必要静态）
  5) 读取 .buildignore，构造排除匹配器（PowerShell 逐行解析 + 通配符到正则转换）
  6) 遍历包含集，排除命中项；复制保留文件到 TEMP，维持相对路径结构（PowerShell Copy-Item）
  7) 将 TEMP 压缩为 ZIP（Compress-Archive）；文件名：<ProjectName>_v<Version>_<YYYYMMDD>.zip
  8) 校验 ZIP 存在且大小 > 0；输出成功信息与退出码 0

# 交付物
- build.bat：可执行的批处理脚本（CRLF，UTF-8 编码）
- .buildignore：模板文件（上述模式，UTF-8）
- README_BUILD.md：使用说明与示例（中文，UTF-8），包含：
  - 功能概述与工作原理
  - 参数说明（--version/--output/--clean）
  - 命名规则与版本来源
  - 示例命令：
    - build.bat
    - build.bat --version 10.3.4
    - build.bat --output C:\dist --clean
  - 常见问题：未找到 manifest、.buildignore 写法示例、如何反排除

# 测试方案
- 结构适配：
  - 标准结构（当前仓库）：src、icons、_locales、storage；确认 ZIP 包含完整运行时依赖
  - 缺少 _locales 或附加静态目录：确认默认包含集 + .buildignore 能正确取舍
- 规则验证：
  - 在 tests/ 与 docs/ 下放置示例文件，确认按 .buildignore 排除
  - 使用否定规则 !src/vendor/keep.js，确认反排除生效
- 产物校验：
  - 验证命名格式与版本来源正确（--version 与 manifest 两种路径）
  - 打包完成后解压检查：存在 manifest.json、popup.html、src/**、icons/**、_locales/**、storage/**

# 实施与时间线
- 一次提交完成：脚本 + 模板 + 说明文档
- 脚本实现以 PowerShell 为核心的过滤/压缩逻辑，批处理负责参数与流程控制；确保无外部依赖。