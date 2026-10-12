@echo off
cd /d "%~dp0"
if not exist .venv call run.bat
.venv\Scripts\pip install pyinstaller
.venv\Scripts\pyinstaller --noconfirm --onefile --windowed --name Wisp --collect-all winrt wisp.py
echo.
echo Done: dist\Wisp.exe
pause
