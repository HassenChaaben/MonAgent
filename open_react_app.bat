@echo off
echo Opening React app in browser...

:: Default port is 3001
set PORT=3001

:: Check if a port was provided as an argument
if not "%~1"=="" (
    set PORT=%~1
)

:: Open the React app in the default browser
start http://localhost:%PORT%/

echo React app opened at http://localhost:%PORT%/
