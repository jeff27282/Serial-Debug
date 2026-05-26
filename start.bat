@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Serial Debug Tool - Starting...
echo ========================================
echo.

if not exist "node_modules\" (
    echo [INFO] First run, installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install failed! Make sure Node.js is installed:
        echo   https://nodejs.org
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed!
    echo.
)

npm start
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start! Try running: npm install
    echo   Or open Serial Debug.html directly in a browser
    echo.
    pause
    exit /b %errorlevel%
)
