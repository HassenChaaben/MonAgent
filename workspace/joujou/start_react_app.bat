@echo off
cd "C:\Users\user\Desktop\PFE\V2\HassenV1\workspace\joujou"
set PORT=3001
set HOST=0.0.0.0
set BROWSER=chrome
set REACT_APP_BROWSER=chrome
set WDS_SOCKET_HOST=localhost
set WDS_SOCKET_PORT=3001

:: Start the React app - this will open the browser automatically
npm start
