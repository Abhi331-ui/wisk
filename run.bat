@echo off
cd /d "%~dp0"
if not exist .venv (
  echo First run: setting up Wisp...
  py -3 -m venv .venv || python -m venv .venv
  .venv\Scripts\python -m pip install --upgrade pip
  .venv\Scripts\pip install -r requirements.txt
)
start "" .venv\Scripts\pythonw.exe wisp.py --show
