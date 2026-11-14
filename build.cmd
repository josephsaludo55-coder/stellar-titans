@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
pushd "%~dp0"
call "C:\Program Files\nodejs\npm.cmd" run build
set "buildExitCode=%ERRORLEVEL%"
popd
exit /b %buildExitCode%