@echo off
echo Starting InboxOwl Development Servers...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d E:\InboxOwl\backend && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d E:\InboxOwl\frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173 (or check terminal for actual port)
echo.
echo Press any key to exit...
pause > nul