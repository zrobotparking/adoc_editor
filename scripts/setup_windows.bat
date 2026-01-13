@echo off
echo [INFO] Starting AsciiDoc Editor Setup for Windows...

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js is installed.

:: Navigate to project root (assuming script is in /scripts)
cd /d "%~dp0.."

echo [INFO] Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo [INFO] Starting Dev Server...
echo [INFO] The application will be available at http://localhost:5173
call npm run dev

pause
