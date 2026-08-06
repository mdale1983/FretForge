@echo off
setlocal

title FretForge Development
pushd "%~dp0"

if not exist "package.json" (
  echo FretForge could not find package.json in:
  echo %CD%
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required to run FretForge.
  echo Install Node.js, then run this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing FretForge development dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting FretForge in development mode...
echo Keep this window open while FretForge is running.
echo.
call npm run tauri dev

if errorlevel 1 (
  echo.
  echo FretForge stopped with an error. Review the messages above.
  pause
)

popd
endlocal
