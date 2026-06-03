@echo off
cd /d "%~dp0"
echo Project: %CD%
echo.
where node >nul 2>&1 || (
  echo Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)
if not exist "node_modules\" (
  echo Installing dependencies...
  call npm run install:all
)
echo Starting API http://localhost:3000 and site http://localhost:4200 ...
echo Close this window with Ctrl+C to stop.
echo.
call npm run dev
pause
