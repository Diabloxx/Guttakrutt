import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import cookieParser from "cookie-parser";
import { databaseType } from "./db-config";
import { pool } from "./db";
import memorystore from "memorystore";
import axios from "axios";
import { storage } from "./storage";
// For PostgreSQL session store
import connectPgSimple from "connect-pg-simple";
// Import database migration utility
import { applyMigrations } from "./apply-migrations";
// Import scheduled tasks
import { initScheduledTasks, logOperation } from './cron-tasks';
// Import logging middleware
import { 
  adminApiLoggerMiddleware, 
  publicApiLoggerMiddleware, 
  errorLoggerMiddleware 
} from './middleware/logging-middleware';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Add cookie parser middleware

// Apply system-wide error logging middleware
app.use(errorLoggerMiddleware);

// Create session store based on database type
let sessionStore;
if (databaseType === 'mysql') {
  // Use memory store for MySQL
  console.log('Using memory session store for MySQL');
  const MemoryStore = memorystore(session);
  sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
} else {
  // Use PostgreSQL session store for Postgres
  console.log('Using PostgreSQL session store');
  const PgSession = connectPgSimple(session);
  sessionStore = new PgSession({ 
    pool,
    createTableIfMissing: true
  });
}

// Set up express-session with appropriate store
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "guttakrutt-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Allow for both HTTP and HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Apply API request logging middleware
app.use(adminApiLoggerMiddleware);
app.use(publicApiLoggerMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Set up global error handlers for uncaught exceptions and unhandled rejections
// These ensure the server keeps running even when unexpected errors occur
process.on('uncaughtException', (error) => {
  try {
    console.error('⚠️ UNCAUGHT EXCEPTION ⚠️');
    console.error(error);
    
    // Log to database if possible
    logOperation('system_critical', 'error', `Uncaught Exception: ${error.message}\n\n${error.stack?.split('\n').slice(0, 10).join('\n')}`)
      .catch(logErr => console.error('Error logging uncaught exception:', logErr));
  } catch (handlerError) {
    console.error('Failed to properly handle uncaught exception:', handlerError);
  }
  
  // Don't exit the process - let the application continue running
  // This allows the admin to investigate through the logs panel
});

process.on('unhandledRejection', (reason, promise) => {
  try {
    console.error('⚠️ UNHANDLED PROMISE REJECTION ⚠️');
    console.error('Reason:', reason);
    
    // Convert reason to a string for logging, handling various types
    let reasonStr = 'Unknown reason';
    if (reason instanceof Error) {
      reasonStr = `${reason.message}\n\n${reason.stack?.split('\n').slice(0, 10).join('\n')}`;
    } else if (reason) {
      reasonStr = String(reason);
    }
    
    // Log to database if possible
    logOperation('system_critical', 'error', `Unhandled Promise Rejection: ${reasonStr}`)
      .catch(logErr => console.error('Error logging unhandled rejection:', logErr));
  } catch (handlerError) {
    console.error('Failed to properly handle unhandled rejection:', handlerError);
  }
  
  // Don't exit the process - let the application continue running
});

(async () => {
  try {
    // Apply database migrations first
    console.log('Applying database migrations...');
    await applyMigrations(pool);
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error applying database migrations:', error);
    // Log to database if possible
    try {
      await logOperation('system_critical', 'error', `Migration failure: ${(error as Error).message || 'Unknown error'}`);
    } catch (logErr) {
      console.error('Failed to log migration error:', logErr);
    }
    // Continue with server startup even if migrations fail
    // This allows the server to start with existing schema
  }
  
  const server = await registerRoutes(app);
  
  // Final error handler - will be called if no other error middleware handles the error
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Log the error to ensure it's captured
    try {
      const adminSession = (req.session as any);
      const adminId = adminSession?.adminId || undefined;
      
      // Ensure we have a good error message
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const errorStack = err.stack || 'No stack trace available';
      
      // Log the error with details
      logOperation('system_error', 'error', 
        `Express Error Handler: ${message}\n\nStatus: ${status}\n\nStack: ${errorStack}`, 
        adminId
      ).catch(logErr => console.error('Error logging from final error handler:', logErr));
      
      // If headers haven't been sent yet, send an appropriate response
      if (!res.headersSent) {
        if (req.path.startsWith('/api/')) {
          // For API requests, return JSON
          res.status(status).json({ 
            success: false, 
            message, 
            errorId: Date.now() // Reference for error reporting
          });
        } else {
          // For web requests, send a basic error message
          // The client-side error handling will take care of displaying it
          res.status(status).send(`
            <html>
              <head><title>Error</title></head>
              <body>
                <h1>Something went wrong</h1>
                <p>The application encountered an error. Please try again or contact support.</p>
                <p><a href="/">Return to homepage</a></p>
              </body>
            </html>
          `);
        }
      }
    } catch (handlerError) {
      console.error('Critical error in final error handler:', handlerError);
      // Last resort if everything else fails
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
    
    // DO NOT throw the error again, as that would crash the server
    // Instead, we've logged it and can now move on
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Different configuration based on OS for Windows compatibility
  const isWindows = process.platform === 'win32';
  const host = isWindows ? "10.0.0.31" : "0.0.0.0";
  
  // On Windows, we use a simpler configuration without reusePort
  if (isWindows) {
    server.listen(port, host, () => {
      log(`serving on ${host}:${port} (Windows compatible mode)`);
    });
  } else {
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      log(`serving on ${host}:${port}`);
    });
  }
  
  // Set up scheduled tasks for guild data refresh using node-cron
  // Initialize scheduled tasks with the server URL
  const protocol = app.get("env") === "development" ? "http" : "https";
  const serverUrl = `${protocol}://localhost:5000`;
  initScheduledTasks(serverUrl);
})();
