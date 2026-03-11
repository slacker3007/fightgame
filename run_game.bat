@echo off
echo Starting local Gauntlet Arena server...
echo Pointing your browser to http://localhost:8000
start http://localhost:8000
python -m http.server 8000
pause
