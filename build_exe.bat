@echo off
cd /d "%~dp0"
if not exist .venv call run.bat
.venv\Scripts\pip install pyinstaller
.venv\Scripts\pyinstaller --noconfirm --onedir --windowed --noupx --name Wisp --icon packaging\wisp.ico --collect-all winrt --collect-submodules screen_brightness_control --collect-submodules pycaw wisp.py
echo.
echo Done: dist\Wisp\Wisp.exe
pause
