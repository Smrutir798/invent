@echo off
title DURGA CYCLE STORE - Installation
color 0A

echo ========================================
echo   DURGA CYCLE STORE - First Time Setup
echo ========================================
echo.

:: Check if Node.js is installed
echo [1/4] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo       Node.js found: 
node -v
echo.

:: Check if npm is available
echo [2/4] Checking npm...
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    pause
    exit /b 1
)
echo       npm found: 
npm -v
echo.

:: Install dependencies
echo [3/4] Installing dependencies...
echo       This may take a few minutes...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.
echo       Dependencies installed successfully!
echo.

:: Check for .env file
echo [4/4] Checking configuration...
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo Creating sample .env file...
    (
        echo # Google Sheets Configuration
        echo GOOGLE_SPREADSHEET_ID=1i5b3HHaWIBYj4aLXgPdhSTKDMqkGYoNuGiEDgzviRMs
        echo.
        echo # Add your Google Service Account credentials below
        echo # GOOGLE_CREDENTIALS={"type":"service_account",...}
    ) > .env
    echo.
    echo IMPORTANT: Edit the .env file and add your GOOGLE_CREDENTIALS
    echo.
) else (
    echo       Configuration file found!
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo To start the application, run:
echo   start-dev.bat
echo.
echo Or manually run:
echo   1. node local-server.cjs  (Terminal 1)
echo   2. npm run dev            (Terminal 2)
echo.
echo Then open: http://localhost:5173
echo.
pause
