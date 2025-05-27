@echo off
chcp 65001
setlocal enabledelayedexpansion

REM 设置颜色
color 0A

echo 线束直径计算工具 - 浏览器扩展打包脚本
echo ====================================
echo.

if "%1"=="" (
    echo 请指定目标浏览器：
    echo 1. chrome  - 构建Chrome扩展
    echo 2. firefox - 构建Firefox扩展
    echo.
    echo 使用方法: .\build.bat [chrome^|firefox]
    exit /b 1
)

if /i "%1"=="chrome" (
    echo 正在构建Chrome扩展...
    copy /y manifest.chrome.json manifest.json
    if !errorlevel! neq 0 (
        echo 错误: 无法复制manifest文件
        exit /b 1
    )
) else if /i "%1"=="firefox" (
    echo 正在构建Firefox扩展...
    copy /y manifest.firefox.json manifest.json
    if !errorlevel! neq 0 (
        echo 错误: 无法复制manifest文件
        exit /b 1
    )
) else (
    echo 错误: 无效的目标浏览器 "%1"
    echo 请使用 chrome 或 firefox
    exit /b 1
)

echo.
echo manifest.json 已更新
echo 构建完成
echo.

REM 显示当前使用的manifest版本
echo 当前配置:
type manifest.json | findstr "manifest_version"
echo.

endlocal 