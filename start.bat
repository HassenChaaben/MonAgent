@echo off
echo Starting Chat Application...

:: Start the backend in a new window
start "Backend" cmd /c "python app.py"

:: Navigate to frontend directory and start npm
cd frontend
start "Frontend" cmd /c "npm start"

echo Application started! Check the opened windows for details.
