@echo off
cd /d "%~dp0"
echo フロントエンドサーバーを起動します...
echo ポート: 8081
echo 終了するには Ctrl+C を押してください
echo.
node front-server.js
pause
