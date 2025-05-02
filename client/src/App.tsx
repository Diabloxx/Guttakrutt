import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import React, { useEffect, Suspense } from "react";
import CookieConsent from "@/components/CookieConsent";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginStatusPage from "@/pages/login-status";
import GuttakruttTest from "@/pages/guttakrutt-test";
import BattleNetAuthDebug from "@/pages/bnet-auth-debug";
import ApiDebugPage from "@/pages/api-debug";
import { AuthProvider } from "@/contexts/auth-context";
import { ProfileSidebar } from "@/components/profile-sidebar";
// Temporarily remove TestAuthButton import due to security scan issues
// import { TestAuthButton } from "@/components/test-auth-button";

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <ErrorBoundary>
            <Home />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/admin">
        {() => {
          const AdminPage = React.lazy(() => import('@/pages/admin-fixed'));
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <AdminPage />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* New admin dashboard */}
      <Route path="/admin-dashboard">
        {() => {
          const AdminDashboard = React.lazy(() => import('@/pages/admin-dashboard'));
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <AdminDashboard />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* Admin login page */}
      <Route path="/admin-login">
        {() => {
          const AdminLogin = React.lazy(() => import('@/pages/admin-login'));
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <AdminLogin />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* User profile page */}
      <Route path="/profile">
        {() => {
          const ProfilePage = React.lazy(() => import('@/pages/profile'));
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <ProfilePage />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* Battle.net auth test page */}
      <Route path="/login-test">
        {() => {
          const LoginTestPage = React.lazy(() => import('@/pages/login-test'));
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <LoginTestPage />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* Login status page with direct form submission */}
      <Route path="/login-status">
        {() => {
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <LoginStatusPage />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* Test page for guttakrutt.org domain */}
      <Route path="/guttakrutt-test">
        {() => {
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <GuttakruttTest />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* Battle.net Authentication Debug Page */}
      <Route path="/bnet-auth-debug">
        {() => {
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <BattleNetAuthDebug />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* API Debug Page */}
      <Route path="/api-debug">
        {() => {
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <ApiDebugPage />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* Auth Debug Page */}
      <Route path="/auth-debug">
        {() => {
          const AuthDebugPage = React.lazy(() => import('@/pages/auth-debug'));
          return (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex items-center justify-center min-h-screen bg-black">
                  <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
                </div>
              }>
                <AuthDebugPage />
              </React.Suspense>
            </ErrorBoundary>
          );
        }}
      </Route>
      
      {/* Error pages for auth */}
      <Route path="/login-failed">
        {() => (
          <ErrorBoundary>
            <div className="container py-10 px-4 mx-auto">
              <div className="max-w-md mx-auto bg-wow-dark border border-red-500/30 rounded-lg p-6">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Login Failed</h1>
                <p className="text-wow-light mb-6">There was a problem with the Battle.net authentication.</p>
                <a href="/" className="text-wow-green hover:underline">Return to home page</a>
              </div>
            </div>
          </ErrorBoundary>
        )}
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        {() => (
          <ErrorBoundary>
            <NotFound />
          </ErrorBoundary>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Set document title
    document.title = "Guttakrutt - World of Warcraft Guild";
    
    // Add meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Official website for Guttakrutt, an elite World of Warcraft raiding guild on Tarren Mill EU.';
      document.head.appendChild(meta);
    }
    
    // Add favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      // Import will be resolved at build time to the correct path
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/assets/guild-logo.png'; // This will be accessible at runtime
      document.head.appendChild(link);
    }
    
    // Add Cinzel and Inter fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800&family=Inter:wght@300;400;500;700&display=swap';
    document.head.appendChild(fontLink);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <ProfileSidebar />
          {/* Temporarily removed TestAuthButton due to security scan issues */}
          <CookieConsent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
