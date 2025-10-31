@echo off

:: ----------------------------------------------------
:: Configuration - Update these paths and commands as needed
:: ----------------------------------------------------
SET FRONTEND_DIR=frontend
SET FRONTEND_CMD=npm run dev

SET BACKEND_DIR=backend
SET BACKEND_CMD=npm start
:: ----------------------------------------------------

:: 1. Start the Frontend (VITE) in a new window
echo Starting Frontend (VITE)...
START "Frontend (VITE)" /D "%FRONTEND_DIR%" cmd /k "%FRONTEND_CMD%"

:: 2. Start the Backend (Node/Express) in a new window
echo Starting Backend (Node/Express)...
START "Backend (Node/Express)" /D "%BACKEND_DIR%" cmd /k "%BACKEND_CMD%"

echo.
echo Launch sequence complete. Check the new windows for server status.
echo.

:: Optional: Wait for user input to keep the main script window open
::pause