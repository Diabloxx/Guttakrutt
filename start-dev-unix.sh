#!/bin/bash
# This script sets up the environment variables and runs the application on Linux/macOS

# Create logs directory if it doesn't exist
mkdir -p logs

# Set log file with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOGFILE="logs/guttakrutt_$TIMESTAMP.log"

# Create log file with header
echo "Guttakrutt Guild Website - Database Connection Log" > $LOGFILE
echo "Timestamp: $(date)" >> $LOGFILE
echo "" >> $LOGFILE

# Check if .env file exists and source it if it does
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    echo "Loading environment variables from .env file..." >> $LOGFILE
    
    # Create a temporary file to export variables
    ENV_TEMP=$(mktemp)
    grep -v '^#' .env | sed 's/^/export /' > $ENV_TEMP
    source $ENV_TEMP
    rm $ENV_TEMP
else
    echo "No .env file found. Using default environment variables..."
    echo "No .env file found. Using default environment variables..." >> $LOGFILE
    
    # Set environment variables with defaults
    export NODE_ENV=development
    export DB_TYPE=postgresql
    export DATABASE_URL=postgresql://user:password@localhost:5432/guttakrutt
    
    # These should be replaced with your actual values
    export BLIZZARD_CLIENT_ID="Your Client ID"
    export BLIZZARD_CLIENT_SECRET="Your Client Secret"
    export WARCRAFTLOGS_CLIENT_ID="Your Client ID"
    export WARCRAFTLOGS_CLIENT_SECRET="Your Client Secret"
    export SITE_URL=http://localhost:5000
fi

# Display configuration information
echo "Database Configuration:"
echo "Database Configuration:" >> $LOGFILE
echo "  Type: $DB_TYPE"
echo "  Type: $DB_TYPE" >> $LOGFILE

if [ "$DB_TYPE" = "mysql" ]; then
    echo "  Host: $MYSQL_HOST"
    echo "  Host: $MYSQL_HOST" >> $LOGFILE
    echo "  Port: $MYSQL_PORT"
    echo "  Port: $MYSQL_PORT" >> $LOGFILE
    echo "  User: $MYSQL_USER"
    echo "  User: $MYSQL_USER" >> $LOGFILE
    echo "  Database: $MYSQL_DATABASE"
    echo "  Database: $MYSQL_DATABASE" >> $LOGFILE
    echo "  Password: *********"
    echo "  Password: *********" >> $LOGFILE
else
    echo "  Connection URL: $DATABASE_URL (credentials hidden)"
    echo "  Connection URL: DATABASE_URL present" >> $LOGFILE
fi

echo ""
echo "" >> $LOGFILE
echo "API Keys:"
echo "API Keys:" >> $LOGFILE
echo "  Blizzard API: $([ -n "$BLIZZARD_CLIENT_ID" ] && echo "Configured" || echo "Not configured")"
echo "  Blizzard API: $([ -n "$BLIZZARD_CLIENT_ID" ] && echo "Configured" || echo "Not configured")" >> $LOGFILE
echo "  WarcraftLogs API: $([ -n "$WARCRAFTLOGS_CLIENT_ID" ] && echo "Configured" || echo "Not configured")"
echo "  WarcraftLogs API: $([ -n "$WARCRAFTLOGS_CLIENT_ID" ] && echo "Configured" || echo "Not configured")" >> $LOGFILE
echo ""
echo "" >> $LOGFILE
echo "Starting application..."
echo "Starting application..." >> $LOGFILE
echo "Press Ctrl+C to stop"
echo "Press Ctrl+C to stop" >> $LOGFILE
echo ""
echo "" >> $LOGFILE
echo "Log file: $LOGFILE"
echo "Log file: $LOGFILE" >> $LOGFILE
echo ""

# Ensure all dependencies are installed
echo "Checking required dependencies..."
echo "Checking required dependencies..." >> $LOGFILE
npm list tsx cross-env > /dev/null 2>&1 || npm install -D tsx cross-env > logs/install_$TIMESTAMP.log 2>&1

# Run the application and log output
echo "Running application..."
echo "Running application..." >> $LOGFILE
npx tsx server/index.ts | tee logs/output_$TIMESTAMP.log

# Capture exit code
EXIT_CODE=$?

# Show exit status
echo ""
if [ $EXIT_CODE -ne 0 ]; then
    echo "Application exited with error code $EXIT_CODE"
    echo "Application exited with error code $EXIT_CODE" >> $LOGFILE
    echo "See the log files for details:"
    echo "  - $LOGFILE"
    echo "  - logs/output_$TIMESTAMP.log"
    echo "See the log files for details:" >> $LOGFILE
    echo "  - $LOGFILE" >> $LOGFILE
    echo "  - logs/output_$TIMESTAMP.log" >> $LOGFILE
    echo ""
    echo "Error detected!"
    echo "Error detected!" >> $LOGFILE
else
    echo "Application exited normally."
    echo "Application exited normally." >> $LOGFILE
    echo "See the log files for details:"
    echo "  - $LOGFILE"
    echo "  - logs/output_$TIMESTAMP.log"
    echo "See the log files for details:" >> $LOGFILE
    echo "  - $LOGFILE" >> $LOGFILE
    echo "  - logs/output_$TIMESTAMP.log" >> $LOGFILE
    echo ""
fi