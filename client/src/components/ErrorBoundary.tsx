import React, { Component, ErrorInfo, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of crashing the entire app.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  // Lifecycle method that's invoked after a descendant component throws an error
  public static getDerivedStateFromError(_: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  // Lifecycle method that's called after an error has been thrown by a descendant component
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log the error to the server
    this.logErrorToServer(error, errorInfo);
    
    // Also log to console for debugging
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  // Log error to server for tracking
  private logErrorToServer(error: Error, errorInfo: ErrorInfo) {
    try {
      apiRequest("POST", "/api/admin/client-error", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }).catch(e => console.error("Failed to log error to server:", e));
    } catch (e) {
      console.error("Failed to send error log to server:", e);
    }
  }

  // Reset the error state to allow users to try again
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-red-600 dark:text-red-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold mb-2 text-center">Something went wrong</h2>
              <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                The application encountered an error. The error has been logged and we'll look into it.
              </p>
              
              <div className="mb-4 w-full">
                <details className="bg-slate-100 dark:bg-slate-700/50 rounded p-2 text-xs">
                  <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    Technical details (for support)
                  </summary>
                  <div className="mt-2 p-2 bg-slate-200 dark:bg-slate-800 rounded overflow-auto max-h-40">
                    <p className="font-mono whitespace-pre-wrap text-red-600 dark:text-red-400">
                      {this.state.error?.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <p className="font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 mt-2">
                        {this.state.errorInfo.componentStack}
                      </p>
                    )}
                  </div>
                </details>
              </div>
              
              <div className="flex space-x-4">
                <Button
                  onClick={this.handleReset}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="border-slate-300 dark:border-slate-600"
                >
                  Go to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;