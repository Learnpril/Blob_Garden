#!/usr/bin/env pwsh

Write-Host "Starting Blob Garden local server..." -ForegroundColor Green
Write-Host ""
Write-Host "The game will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    # Try Python 3 first
    python -m http.server 8000
}
catch {
    try {
        # Fallback to Python 2
        Write-Host "Python 3 not found, trying Python 2..." -ForegroundColor Yellow
        python -m SimpleHTTPServer 8000
    }
    catch {
        Write-Host "Error: Python not found or not in PATH" -ForegroundColor Red
        Write-Host "Please install Python or add it to your PATH" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}