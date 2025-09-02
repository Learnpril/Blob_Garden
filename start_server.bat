@echo off
echo Starting Blob Garden local server...
echo.
echo The game will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Try Python 3 first, then Python 2 as fallback
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    echo Python 3 not found, trying Python 2...
    python -m SimpleHTTPServer 8000 2>nul
    if %errorlevel% neq 0 (
        echo Error: Python not found or not in PATH
        echo Please install Python or add it to your PATH
        pause
        exit /b 1
    )
)