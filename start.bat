@echo off
echo Starting RPL Client Portal with PostgreSQL...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Setting up environment...
if not exist "server\.env" (
    copy "server\config.env" "server\.env"
    echo Environment file created. Please edit server\.env if needed.
)

echo.
echo Setting up PostgreSQL database...
call npm run setup-db

echo.
echo Starting development servers...
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:3000
echo.
echo Admin credentials: admin / admin123
echo.

call npm run dev

pause 