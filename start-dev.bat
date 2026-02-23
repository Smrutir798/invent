@echo off
title Inventory System - Local Development
echo ========================================
echo   Inventory Management System
echo   Starting Local Development Server
echo ========================================
echo.

cd /d "%~dp0"

echo Stopping any existing Node processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo Starting API server on port 3001...

start "API Server" cmd /k "node local-server.cjs"

timeout /t 2 >nul

echo Starting Vite frontend on port 5173...
start "Frontend" cmd /k "npx vite --port 5173"

timeout /t 3 >nul

echo.
echo ========================================
echo   Servers Started!
echo   Frontend: http://localhost:5173
echo   API:      http://localhost:3001
echo ========================================
echo.
echo Press any key to open the app in browser...
pause >nul

start http://localhost:5173
