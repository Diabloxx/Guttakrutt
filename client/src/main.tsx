import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n";
// Import error boundary
import ErrorBoundary from "./components/ErrorBoundary";

// Add global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Log the error to server if possible
  try {
    fetch('/api/admin/client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'window.onerror',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(e => console.error('Failed to log global error to server:', e));
  } catch (e) {
    console.error('Failed to send global error log to server:', e);
  }
  
  // Allow the default error handling to continue
  return false;
});

// Add global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Log the error to server if possible
  try {
    fetch('/api/admin/client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'unhandledrejection',
        reason: event.reason?.toString?.() || 'Unknown reason',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(e => console.error('Failed to log unhandled rejection to server:', e));
  } catch (e) {
    console.error('Failed to send unhandled rejection log to server:', e);
  }
});

// Wrap the application in an ErrorBoundary to prevent the entire app from crashing
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
