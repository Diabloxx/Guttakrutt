-- Add web_logs table for tracking system operations
CREATE TABLE IF NOT EXISTS web_logs (
  id SERIAL PRIMARY KEY,
  operation VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  user_id INTEGER REFERENCES admin_users(id),
  duration INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create index on timestamp for faster retrieval of logs by date
CREATE INDEX IF NOT EXISTS idx_web_logs_timestamp ON web_logs(timestamp);

-- Create index on operation for filtering logs by operation type
CREATE INDEX IF NOT EXISTS idx_web_logs_operation ON web_logs(operation);

-- Create index on status for filtering logs by status
CREATE INDEX IF NOT EXISTS idx_web_logs_status ON web_logs(status);

-- Create index on user_id for filtering logs by user
CREATE INDEX IF NOT EXISTS idx_web_logs_user_id ON web_logs(user_id);