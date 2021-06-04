@echo off

set HOME=addons\.electron-gyp

for /D %%i in (addons/*) do call :build %%i
exit /B %ERRORLEVEL%

:build
call node-gyp rebuild --directory=addons\%~1 --target=13.0.1 --arch=x64 --dist-url=https://electronjs.org/headers
move /y addons\%~1\build\Release\addon.node app\resources\addons\%~1.node