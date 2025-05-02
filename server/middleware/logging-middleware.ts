import { Request, Response, NextFunction } from 'express';
import { logOperation } from '../cron-tasks';

/**
 * Admin API request logging middleware
 * Logs all admin API calls
 */
export const adminApiLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only log admin API calls
    if (req.path && req.path.startsWith('/api/admin')) {
      // TypeScript: Cast to any to safely access session properties
      const adminSession = (req.session as any);
      const adminId = adminSession?.adminId || undefined;
      const method = req.method;
      // Safely handle path to avoid URI encoding issues
      const path = req.path ? req.path.toString().replace(/[^\w\s\-\/_.:?=&%]/g, '') : '/unknown';
      
      // Safely stringify query parameters
      let query = '';
      try {
        query = Object.keys(req.query).length > 0 ? 
          JSON.stringify(req.query).slice(0, 200) : '';
      } catch (err) {
        console.error('Error stringifying query params:', err);
      }
      
      // Create a log message with length limits
      const message = `Admin API Call: ${method} ${path.slice(0, 100)}${query ? ` (Query: ${query})` : ''}`;
      
      // Log at the INFO level
      try {
        logOperation('admin_api', 'info', message, adminId)
          .catch(err => console.error('Error logging admin API call:', err));
      } catch (err) {
        console.error('Failed to log admin API call:', err);
      }
      
      // For tracking response status and timing
      const start = Date.now();
      
      // Capture the original end method
      const originalEnd = res.end;
      
      // Override the end method to log the response
      res.end = function(chunk?: any, encoding?: any, callback?: any) {
        try {
          const duration = Date.now() - start;
          const statusCode = res.statusCode;
          
          // Log success or error based on status code
          const status = statusCode >= 400 ? 'error' : 'success';
          const responseMessage = `Admin API Response: ${method} ${path.slice(0, 100)} - ${statusCode} in ${duration}ms`;
          
          logOperation('admin_api_response', status, responseMessage, adminId)
            .catch(err => console.error('Error logging admin API response:', err));
        } catch (err) {
          console.error('Error in admin API response logging:', err);
        }
        
        // Call the original end method
        return originalEnd.call(this, chunk, encoding, callback);
      };
    }
  } catch (err) {
    console.error('Error in adminApiLoggerMiddleware:', err);
  }
  
  // Always proceed to next middleware
  next();
};

/**
 * Public API request logging middleware
 * Logs all public API calls (can be high volume)
 */
export const publicApiLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only log non-admin API calls and exclude common static asset requests
    if (req.path && req.path.startsWith('/api/') && !req.path.startsWith('/api/admin')) {
      const method = req.method;
      // Safely handle path to avoid URI encoding issues
      const path = req.path ? req.path.toString().replace(/[^\w\s\-\/_.:?=&%]/g, '') : '/unknown';
      
      // Create a log message (avoid any potential injection issues)
      const message = `Public API Call: ${method} ${path.slice(0, 100)}`; // Limit length
      
      // Log at the INFO level - wrap in try/catch
      try {
        logOperation('public_api', 'info', message)
          .catch(err => console.error('Error logging public API call:', err));
      } catch (err) {
        console.error('Failed to log API call:', err);
      }
      
      // For tracking response status and timing
      const start = Date.now();
      
      // Capture the original end method
      const originalEnd = res.end;
      
      // Override the end method to log the response
      res.end = function(chunk?: any, encoding?: any, callback?: any) {
        try {
          const duration = Date.now() - start;
          const statusCode = res.statusCode;
          
          // Only log errors from public API responses to avoid log spam
          if (statusCode >= 400) {
            const responseMessage = `Public API Error: ${method} ${path.slice(0, 100)} - ${statusCode} in ${duration}ms`;
            
            logOperation('public_api_error', 'error', responseMessage)
              .catch(err => console.error('Error logging public API error:', err));
          }
        } catch (err) {
          console.error('Error in API response logging:', err);
        }
        
        // Call the original end method
        return originalEnd.call(this, chunk, encoding, callback);
      };
    }
  } catch (err) {
    console.error('Error in publicApiLoggerMiddleware:', err);
  }
  
  // Always call next, even if there's an error in the middleware
  next();
};

/**
 * Error logging middleware
 * Logs all uncaught errors in the request pipeline
 * Ensures application continues running despite errors
 */
export const errorLoggerMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  try {
    // Get admin ID if available (for admin routes)
    const adminSession = (req.session as any);
    const adminId = adminSession?.adminId || undefined;
    const method = req.method || 'UNKNOWN';
    
    // Safely handle path to prevent URI malformed errors
    let path = 'unknown-path';
    try {
      if (req.path) {
        path = req.path.toString().replace(/[^\w\s\-\/_.:?=&%]/g, '').slice(0, 100);
      }
    } catch (pathErr) {
      console.error('Error handling path in error logger:', pathErr);
    }
    
    // Safely get error details with stack trace
    const errorMessage = err?.message || 'Unknown error';
    const errorStack = err?.stack || 'No stack trace available';
    
    // Extract relevant parts of the stack trace (first 5 lines)
    const stackLines = errorStack.split('\n').slice(0, 5).join('\n');
    
    // Create a log message with error details - limit lengths to prevent issues
    const message = `Uncaught Error in ${method} ${path}: ${errorMessage.slice(0, 200)}`;
    
    // Additional details for the database log
    const details = `${message}\n\nStack trace:\n${stackLines}`;
    
    // Log at the ERROR level with safety catch
    try {
      logOperation('system_error', 'error', details, adminId)
        .catch(logErr => console.error('Error logging system error:', logErr));
    } catch (logErr) {
      console.error('Failed to log system error:', logErr);
    }
    
    // Log to console for immediate visibility
    console.error('ERROR CAPTURED:', message);
    console.error('Stack trace:', errorStack);
  } catch (middlewareErr) {
    // Ultimate fallback in case everything else fails
    console.error('Critical error in errorLoggerMiddleware:', middlewareErr);
  }
  
  // If the headers haven't been sent yet, provide an error response
  // This is important for API routes
  if (!res.headersSent) {
    // Determine if this is an API request
    const isApiRequest = req.path?.startsWith('/api/');
    
    if (isApiRequest) {
      // For API requests, return a JSON error
      res.status(500).json({
        success: false,
        error: "An internal server error occurred. The error has been logged and will be investigated.",
        errorId: Date.now() // Provides a reference if user reports the error
      });
    } else {
      // For non-API requests, try to continue normal operation
      // or provide minimal error feedback
      next(err);
    }
  } else {
    // Headers already sent, nothing we can do but log
    console.log('Headers already sent, could not send error response');
    // Still call next for other error handlers
    next(err);
  }
};