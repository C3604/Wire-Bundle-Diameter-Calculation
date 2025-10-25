@echo off
:::========================================
:::  GitHub 同步工具
:::  功能：Pull / Push 选择 + 代理支持 + 网络检测
:::  作者：你
:::  说明：回车 = 默认 Push
:::========================================

setlocal EnableExtensions EnableDelayedExpansion

chcp 65001 >nul

git config --global http.proxy http://127.0.0.1:10809
git config --global https.proxy http://127.0.0.1:10809

title Git 同步工具 - Pull / Push 选择

cls

echo.
echo ========================================
echo     GitHub 仓库同步工具
echo ========================================
echo.
echo 已设置代理：127.0.0.1:10809
echo 当前目录: %cd%
echo.

rem 前置检查：Git/Curl 可用性
call :preflight

rem 网络连通性（有 curl 时检查）
if "%HAS_CURL%"=="1" (
  echo [INFO] 正在检查网络连接（通过代理）...
  curl -x http://127.0.0.1:10809 --connect-timeout 10 --head https://github.com >nul 2>&1
  if %errorlevel% neq 0 (
    echo [ERROR] 无法连接到 GitHub，请检查：
    echo      1. 代理工具（如 Clash、V2RayN）是否已启动
    echo      2. 代理端口是否正确（当前设置为 10809）
    echo      3. 是否开启了系統代理
    echo.
    echo [HINT] 其他软件可用不代表 Git 可用；需在 Git 中显式配置代理。
    echo        Clash 默认端口 7890，如不同请修改脚本端口。
    echo.
    pause
    exit /b 1
  )
  echo [OK] 网络连接正常，可以访问 GitHub。
) else (
  echo [WARN] 未检测到 curl，跳过网络连通性检查。
)
echo.

echo 请选择操作：
echo.
echo   1) 从 GitHub 拉取最新内容 (智能拉取)
echo   2) 推送本地更改到 GitHub (智能推送)
echo   0) 退出
echo.
echo 提示：直接按回车将默认执行【推送 (Push)】
echo.

set /p choice=请输入选项 [0-2]（回车默认 Push）: 

if "%choice%"=="" set choice=2

if "%choice%"=="1" goto pull
if "%choice%"=="2" goto push
if "%choice%"=="0" goto exit

echo.
echo [ERROR] 无效输入："%choice%"
echo.
pause
exit /b 1

:pull
cls

echo.
echo 正在执行：智能拉取 (fetch + ff-only)
echo.

if not exist ".git" (
    echo [ERROR] 当前目录不是 Git 仓库！
    echo        请确保此文件夹已通过 git clone 或 git init 初始化。
    echo.
    pause
    exit /b 1
)

rem 采集仓库信息
call :detect_repo_info

if "%HAS_ORIGIN%"=="0" (
    echo [ERROR] 未配置远程 origin。
    echo        运行示例：git remote add origin https://github.com/<owner>/<repo>.git
    echo.
    pause
    exit /b 1
)

echo [STEP] 获取远程更新：git fetch origin --prune
git fetch origin --prune
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] fetch 失败。常见原因：
    echo   - 网络或代理异常
    echo   - 身份凭证无效或权限不足
    echo   - 远程地址错误（执行 git remote -v 排查）
    echo.
    echo [HINT] 可尝试：git remote -v  /  git config --global --edit  检查代理/凭证
    echo.
    pause
    exit /b 1
)

echo [INFO] 当前分支：!CURRENT_BRANCH!
if "%HAS_UPSTREAM%"=="1" (
    echo [STEP] 使用上游分支进行快进合并：git pull --ff-only
    git pull --ff-only
) else (
    echo [WARN] 当前分支未设置上游，将尝试从 origin/!CURRENT_BRANCH! 拉取。
    echo [STEP] 检查远程是否存在该分支：origin/!CURRENT_BRANCH!
    git ls-remote --heads origin !CURRENT_BRANCH! >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] 远程不存在分支：origin/!CURRENT_BRANCH!
        echo        可选择：
        echo          1) 切换到远程默认分支：!REMOTE_DEFAULT_BRANCH!
        echo          2) 创建并推送新分支后再设置上游
        echo        示例：git branch -M main ^& git push -u origin main
        echo.
        pause
        exit /b 1
    )
    git pull --ff-only origin !CURRENT_BRANCH!
)

if %errorlevel% equ 0 (
    echo.
    echo [OK] 拉取成功！本地文件已更新。
) else (
    echo.
    echo [ERROR] 拉取失败。可能原因：
    echo   - 本地存在未提交的更改阻止快进（快进合并失败）
    echo   - 发生冲突需要手动解决
    echo   - 网络或权限问题
    echo.
    echo [HINT] 可尝试：
    echo   - git status  查看未提交文件
    echo   - git stash   暂存修改后再拉取（完毕后 git stash pop）
    echo   - 手动解决冲突后：git add . ^& git commit，再重试
)
echo.
pause
exit /b 0

:push
cls

echo.
echo 正在执行：智能推送
echo.

if not exist ".git" (
    echo [ERROR] 当前目录不是 Git 仓库！
    echo        请确保此文件夹已通过 git clone 或 git init 初始化。
    echo.
    pause
    exit /b 1
)

rem 采集仓库信息
call :detect_repo_info

if "%HAS_ORIGIN%"=="0" (
    echo [ERROR] 未配置远程 origin。
    echo        运行示例：git remote add origin https://github.com/<owner>/<repo>.git
    echo.
    pause
    exit /b 1
)

echo 正在添加所有更改：git add .
git add .

echo.
set /p msg=请输入提交信息（回车使用默认信息）: 
if "%msg%"=="" set msg=Update files automatically

git commit -m "%msg%"

if %errorlevel% equ 1 (
    echo.
    echo [INFO] 无新更改，无需推送。
    echo.
    pause
    exit /b 0
)

echo.
if "%HAS_UPSTREAM%"=="1" (
    echo [STEP] 推送到上游：git push
    git push
) else (
    echo [WARN] 当前分支未设置上游，将尝试设置上游：origin/!CURRENT_BRANCH!
    echo [STEP] 推送并设置上游：git push -u origin !CURRENT_BRANCH!
    git push -u origin !CURRENT_BRANCH!
)

if %errorlevel% equ 0 (
    echo.
    echo [OK] 推送成功！已同步到 GitHub。
) else (
    echo.
    echo [ERROR] 推送失败。可能原因：
    echo   - 网络或代理异常
    echo   - 身份凭证无效（请使用 Personal Access Token）
    echo   - 远程受保护分支/权限不足
    echo   - 远程分支有更新，需要先拉取并合并
    echo.
    echo [HINT] 可尝试：
    echo   - git pull --ff-only    先快进合并
    echo   - git remote -v         检查远程地址
    echo   - git config --global credential.helper manager  启用凭证管理
    echo   - 使用 PAT：https://github.com 生成 Token 并更新远程凭证
)
echo.
pause
exit /b 0

:exit

echo.
echo 已退出，再见！

timeout /t 2 >nul
exit /b 0

:preflight
rem 检查 Git 是否可用
where git >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] 未检测到 Git。请安装 Git 并确保其在 PATH 中。
  echo        下载地址：https://git-scm.com/
  echo.
  pause
  exit /b 1
)

rem 检查 curl 是否可用（可选）
set "HAS_CURL=1"
where curl >nul 2>&1
if %errorlevel% neq 0 set "HAS_CURL=0"
exit /b 0

:detect_repo_info
set "CURRENT_BRANCH="
set "HAS_ORIGIN=0"
set "HAS_UPSTREAM=0"
set "REMOTE_DEFAULT_BRANCH=main"

for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURRENT_BRANCH=%%i"

rem 检查 origin 存在
git remote get-url origin >nul 2>&1
if !errorlevel! equ 0 set "HAS_ORIGIN=1"

rem 检查是否有上游分支
git rev-parse --abbrev-ref --symbolic-full-name @{u} >nul 2>&1
if !errorlevel! equ 0 set "HAS_UPSTREAM=1"

rem 远程默认分支
for /f "tokens=3" %%i in ('git remote show origin ^| findstr /C:"HEAD branch:"') do set "REMOTE_DEFAULT_BRANCH=%%i"

exit /b 0