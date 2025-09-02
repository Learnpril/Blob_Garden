# Blob Garden Local Server

## Quick Start

### Option 1: Batch File (Recommended for Windows)

Double-click `start_server.bat` or run from command prompt:

```cmd
start_server.bat
```

### Option 2: PowerShell Script

Right-click `start_server.ps1` and select "Run with PowerShell" or run from PowerShell:

```powershell
.\start_server.ps1
```

### Option 3: Manual Command

Open Command Prompt or PowerShell in the game directory and run:

```cmd
python -m http.server 8000
```

## Accessing the Game

Once the server starts, open your web browser and go to:
**http://localhost:8000**

## Stopping the Server

Press `Ctrl+C` in the terminal window to stop the server.

## Troubleshooting

### Python Not Found

If you get a "Python not found" error:

1. Install Python from https://python.org
2. Make sure to check "Add Python to PATH" during installation
3. Restart your command prompt/PowerShell

### Port Already in Use

If port 8000 is already in use, you can use a different port:

```cmd
python -m http.server 8080
```

Then access the game at http://localhost:8080

### Alternative Servers

If Python isn't available, you can use other local servers:

**Node.js (if installed):**

```cmd
npx serve .
```

**PHP (if installed):**

```cmd
php -S localhost:8000
```

**Live Server (VS Code Extension):**
Install the "Live Server" extension in VS Code and right-click on `index.html` → "Open with Live Server"
