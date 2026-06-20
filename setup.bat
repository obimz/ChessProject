@echo off
REM ============================================================
REM  Grandmaster Chess — Windows Setup Script
REM  Run this once from the project root: setup.bat
REM ============================================================

echo.
echo  [1/4] Creating Python virtual environment...
py -3.13 -m venv venv
if errorlevel 1 (
    echo  ERROR: Python not found. Install Python 3.13+ from https://python.org
    pause
    exit /b 1
)

echo.
echo  [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo  [3/4] Installing dependencies...
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo  ERROR: pip install failed. Check your internet connection.
    pause
    exit /b 1
)

echo.
echo  [4/4] Done! 
echo.
echo  To start the server, run:
echo.
echo     venv\Scripts\activate.bat
echo     python backend\main.py
echo.
echo  Then open your browser at:  http://127.0.0.1:8000
echo  API docs available at:      http://127.0.0.1:8000/docs
echo.
pause
