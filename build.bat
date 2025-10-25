@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 设置颜色
color 0A

echo 线束直径计算工具 - Chromium 扩展打包脚本
echo ====================================
echo.

set "TARGET=%~1"
if "%TARGET%"=="" (
    set "TARGET=chrome"
)

if /i "%TARGET%"=="chrome" (
    echo 正在构建 Chromium 系浏览器扩展...
    copy /y manifest.chrome.json manifest.json >nul
    if !errorlevel! neq 0 (
        echo 错误: 无法复制 manifest 文件
        exit /b 1
    )
) else (
    echo 错误: 当前版本仅支持 Chromium 内核浏览器 (chrome / edge 等)
    echo 请使用: .\build.bat [chrome]
    exit /b 1
)

echo.
echo manifest.json 已更新
echo 构建完成
echo.

REM 显示当前使用的 manifest 版本
echo 当前配置:
type manifest.json | findstr "manifest_version"
echo.

endlocal
