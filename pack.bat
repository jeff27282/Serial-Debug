@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo   Serial Debug Tool - Packing...
echo ========================================
echo.

:: 添加排除目录，防止杀毒软件误删
powershell -Command "Add-MpPreference -ExclusionPath '%~dp0dist' -ErrorAction SilentlyContinue" 2>nul

:: 运行打包（输出会实时显示）
npx electron-builder --win portable --config.win.signAndEditExecutable=false

echo.
echo ========================================
echo   Pack complete!
echo   Output: dist\SerialDebug_Portable.exe
echo ========================================

:: 弹出完成提示
powershell -Command "& {Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('SerialDebug_Portable.exe packaging complete!', 'Serial Debug Tool', 'OK', 'Information')}" 2>nul

pause
