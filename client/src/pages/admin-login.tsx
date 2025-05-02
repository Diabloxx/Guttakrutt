import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GuildLogo from '@/components/GuildLogo';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Check if already authenticated
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ['/api/admin/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/status');
      return await response.json();
    }
  });
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthLoading && authData?.loggedIn) {
      navigate('/admin-dashboard');
    }
  }, [isAuthLoading, authData, navigate]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    
    try {
      const response = await apiRequest('POST', '/api/admin/login', { username, password });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Login successful. Redirecting to dashboard...",
        });
        // Force a hard redirect to ensure clean state
        window.location.href = '/admin-dashboard';
      } else {
        toast({
          title: "Authentication Failed",
          description: data.message || "Invalid username or password",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error", error);
      toast({
        title: "Authentication Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  // If checking authentication status
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-black"
      style={{
        backgroundImage: `url('/assets/wow-background.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <GuildLogo size="xl" />
          </div>
          <h2 className="text-xl font-semibold text-wow-gold mt-2 drop-shadow-md">Admin Dashboard</h2>
        </div>
        
        <Card className="bg-black/70 border-wow-gold/30 shadow-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-wow-gold text-xl flex items-center justify-center">
              <ShieldCheck className="mr-2 h-5 w-5" />
              Admin Login
            </CardTitle>
            <CardDescription className="text-center text-wow-light font-medium">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="login-form" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-wow-gold font-medium">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-wow-light/50" />
                    <Input
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      required
                      className="pl-10 bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-wow-gold font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-wow-light/50" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                      className="pl-10 bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                    />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit"
              form="login-form"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 text-wow-light border border-green-700/50 shadow-md"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Logging in</span>
                  <div className="h-4 w-4 border-2 border-wow-light rounded-full border-t-transparent animate-spin" />
                </>
              ) : (
                'Login'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-wow-light text-sm font-medium drop-shadow-md">
            © {new Date().getFullYear()} Guttakrutt. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}