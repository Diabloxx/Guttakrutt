import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/login-form';
import { RegisterForm } from '@/components/register-form';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { t } = useTranslation();

  // If user is already logged in, redirect to home page
  useEffect(() => {
    if (!isLoading && user) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-wow-darker">
        <div className="animate-spin w-8 h-8 border-4 border-wow-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wow-darker flex flex-col md:flex-row">
      {/* Login/Register Form Column */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="font-cinzel text-wow-gold text-3xl mb-2">
              {t('auth.welcome', 'Welcome to Guttakrutt')}
            </h1>
            <p className="text-wow-light/70">
              {t('auth.account_needed', 'Create an account or sign in to continue')}
            </p>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full bg-wow-dark border border-wow-gold/30 rounded-lg mb-6">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:bg-wow-gold/20 rounded-l-md"
              >
                {t('auth.login', 'Login')}
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-wow-gold/20 rounded-r-md"
              >
                {t('auth.register', 'Register')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="bg-wow-dark/50 p-6 rounded-lg border border-wow-gold/20">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register" className="bg-wow-dark/50 p-6 rounded-lg border border-wow-gold/20">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero/Info Column - Hidden on small screens */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-wow-dark to-wow-darker flex-col justify-center items-center border-l border-wow-gold/20">
        <div className="max-w-md mx-auto p-10 text-center">
          <Shield className="text-wow-gold w-20 h-20 mb-6 mx-auto" />
          
          <h2 className="font-cinzel text-wow-gold text-2xl mb-4">
            {t('auth.join_guild', 'Join Guttakrutt Guild')}
          </h2>
          
          <div className="space-y-4 text-wow-light/80">
            <p>
              {t('auth.about_guild', 'Guttakrutt is a Norwegian WoW guild on Tarren Mill established in 2019.')}
            </p>
            
            <div className="border-t border-b border-wow-gold/20 py-4 my-4">
              <h3 className="font-cinzel text-wow-gold text-lg mb-2">
                {t('auth.raid_teams', 'Raid Teams')}
              </h3>
              <p className="mb-2">
                <strong className="text-wow-gold">Truedream:</strong> {t('auth.truedream_desc', 'Main raid team focused on mythic progression')}
              </p>
              <p>
                <strong className="text-wow-gold">Blåmandag:</strong> {t('auth.blamandag_desc', 'Casual raid team with heroic progression')}
              </p>
            </div>
            
            <p>
              {t('auth.create_account', 'Create an account to access guild information, raid schedules, and apply to join our teams.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}