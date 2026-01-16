@echo off
set "ROOT=%~dp0"
for %%A in ("%ROOT%") do set "ROOT=%%~fA"
set "PS_VERSION="
set "PS_OUTPUT="
set "PS_CLEAN="
:parse
if "%~1"=="" goto run
if /I "%~1"=="--version" (
  set "PS_VERSION=-Version %~2"
  shift
  shift
  goto parse
)
if /I "%~1"=="--output" (
  set "PS_OUTPUT=-Output %~2"
  shift
  shift
  goto parse
)
if /I "%~1"=="--clean" (
  set "PS_CLEAN=-Clean 1"
  shift
  goto parse
)
shift
goto parse
:run
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%build-core.ps1" -Root "%ROOT%" %PS_VERSION% %PS_OUTPUT% %PS_CLEAN%
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
  echo Packaging failed, exit code %EC%
  exit /b %EC%
)
echo Packaging done
exit /b 0
