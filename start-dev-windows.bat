@echo off
:: This batch file sets up the environment variables for MySQL and runs the application on Windows

:: Create logs directory if it doesn't exist
if not exist logs mkdir logs

:: Set log file with timestamp
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOGFILE=logs\guttakrutt_%TIMESTAMP%.log

:: Create log file with header
echo Guttakrutt Guild Website - MySQL Connection Log > %LOGFILE%
echo Timestamp: %date% %time% >> %LOGFILE%
echo. >> %LOGFILE%

:: Set environment variables
set NODE_ENV=development
set DB_TYPE=mysql
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set MYSQL_USER=root
set MYSQL_PASSWORD=databasepassword
set MYSQL_DATABASE=guttakrutt
Set SITE_URL=https://guttakrutt.org

:: Blizzard and WarcraftLogs API keys
set BLIZZARD_CLIENT_ID=YOURCLIENTID
set BLIZZARD_CLIENT_SECRET=CLIENTSECRET
set WARCRAFTLOGS_CLIENT_ID=CLIENTID
set WARCRAFTLOGS_CLIENT_SECRET=CLIENTSECRET

:: Display configuration information
echo MySQL Configuration:
echo MySQL Configuration: >> %LOGFILE%
echo   Host: %MYSQL_HOST%
echo   Host: %MYSQL_HOST% >> %LOGFILE%
echo   Port: %MYSQL_PORT%
echo   Port: %MYSQL_PORT% >> %LOGFILE%
echo   User: %MYSQL_USER%
echo   User: %MYSQL_USER% >> %LOGFILE%
echo   Database: %MYSQL_DATABASE%
echo   Database: %MYSQL_DATABASE% >> %LOGFILE%
echo   Password: *********
echo   Password: ********* >> %LOGFILE%
echo.
echo. >> %LOGFILE%
echo API Keys:
echo API Keys: >> %LOGFILE%
echo   Blizzard API: Configured
echo   Blizzard API: Configured >> %LOGFILE%
echo   WarcraftLogs API: Configured
echo   WarcraftLogs API: Configured >> %LOGFILE%
echo.
echo. >> %LOGFILE%
echo Starting application with MySQL database...
echo Starting application with MySQL database... >> %LOGFILE%
echo Press Ctrl+C to stop
echo Press Ctrl+C to stop >> %LOGFILE%
echo.
echo. >> %LOGFILE%
echo Log file: %LOGFILE%
echo. >> %LOGFILE%
echo.

:: Ensure all dependencies are installed
echo Installing required dependencies...
echo Installing required dependencies... >> %LOGFILE%
call npm install -g tsx cross-env > logs\install_%TIMESTAMP%.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install global dependencies. Trying with npx...
    echo Failed to install global dependencies. Trying with npx... >> %LOGFILE%
)

:: Run the application and log output
echo Running application...
echo Running application... >> %LOGFILE%
call npx cross-env NODE_ENV=%NODE_ENV% DB_TYPE=%DB_TYPE% ^
MYSQL_HOST=%MYSQL_HOST% MYSQL_PORT=%MYSQL_PORT% ^
MYSQL_USER=%MYSQL_USER% MYSQL_PASSWORD=%MYSQL_PASSWORD% ^
MYSQL_DATABASE=%MYSQL_DATABASE% ^
BLIZZARD_CLIENT_ID=%BLIZZARD_CLIENT_ID% ^
BLIZZARD_CLIENT_SECRET=%BLIZZARD_CLIENT_SECRET% ^
WARCRAFTLOGS_CLIENT_ID=%WARCRAFTLOGS_CLIENT_ID% ^
WARCRAFTLOGS_CLIENT_SECRET=%WARCRAFTLOGS_CLIENT_SECRET% ^
npx tsx server/index.ts > logs\output_%TIMESTAMP%.log 2>&1

:: Keep window open regardless of result
set ERRORLEVEL_VALUE=%ERRORLEVEL%
if %ERRORLEVEL_VALUE% NEQ 0 (
    echo.
    echo Application exited with error code %ERRORLEVEL_VALUE%
    echo Application exited with error code %ERRORLEVEL_VALUE% >> %LOGFILE%
    echo See the log files for details:
    echo   - %LOGFILE%
    echo   - logs\output_%TIMESTAMP%.log
    echo See the log files for details: >> %LOGFILE%
    echo   - %LOGFILE% >> %LOGFILE%
    echo   - logs\output_%TIMESTAMP%.log >> %LOGFILE%
    echo.
    echo Error detected! Window will remain open so you can read the messages.
    echo Error detected! >> %LOGFILE%
) else (
    echo.
    echo Application exited normally.
    echo Application exited normally. >> %LOGFILE%
    echo See the log files for details:
    echo   - %LOGFILE%
    echo   - logs\output_%TIMESTAMP%.log
    echo See the log files for details: >> %LOGFILE%
    echo   - %LOGFILE% >> %LOGFILE%
    echo   - logs\output_%TIMESTAMP%.log >> %LOGFILE%
    echo.
)

echo Press any key to close this window...
pause >nul
