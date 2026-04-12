@echo off
pushd "%~dp0"
echo Starting local Gauntlet Arena server...
echo Pointing your browser to http://127.0.0.1:8000
start http://127.0.0.1:8000
python -m http.server 8000 --bind 127.0.0.1
popd
pause
