import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

// Define the login form schema
const loginSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const success = await login(data.username, data.password);
      
      if (success) {
        toast({
          title: t('login.success', 'Login successful'),
          description: t('login.welcome_back', 'Welcome back!'),
        });
      } else {
        form.setError('root', { 
          message: t('login.invalid_credentials', 'Invalid username or password')
        });
        
        toast({
          title: t('login.failed', 'Login failed'),
          description: t('login.invalid_credentials', 'Invalid username or password'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('login.error', 'Login error'),
        description: t('login.try_again', 'Please try again later'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-wow-light">
                {t('login.username', 'Username')}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('login.enter_username', 'Enter your username')} 
                  className="bg-wow-dark text-wow-light border-wow-gold/20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-wow-light">
                {t('login.password', 'Password')}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={t('login.enter_password', 'Enter your password')} 
                  className="bg-wow-dark text-wow-light border-wow-gold/20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        {form.formState.errors.root && (
          <div className="text-red-400 text-sm pt-1">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <Button 
          type="submit" 
          variant="wow" 
          className="w-full mt-4" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('login.loading', 'Loading...')}
            </span>
          ) : (
            t('login.login', 'Login')
          )}
        </Button>
      </form>
    </Form>
  );
}