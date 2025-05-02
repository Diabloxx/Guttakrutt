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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

// Define the registration form schema
const registerSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
  displayName: z.string().min(2, {
    message: 'Display name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      const success = await register({
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        password: data.password,
      });
      
      if (success) {
        toast({
          title: t('register.success', 'Registration successful'),
          description: t('register.welcome', 'Welcome to Guttakrutt!'),
        });
      } else {
        toast({
          title: t('register.failed', 'Registration failed'),
          description: t('register.try_again', 'Please try again with different credentials'),
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message?.includes('already exists')) {
        form.setError('username', { 
          message: t('register.username_taken', 'Username already taken')
        });
      } else if (error.message?.includes('email already')) {
        form.setError('email', { 
          message: t('register.email_taken', 'Email already in use')
        });
      } else {
        toast({
          title: t('register.error', 'Registration error'),
          description: t('register.try_again_later', 'Please try again later'),
          variant: 'destructive',
        });
      }
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
                {t('register.username', 'Username')}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('register.choose_username', 'Choose a username')} 
                  className="bg-wow-dark text-wow-light border-wow-gold/20" 
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-wow-light/60 text-xs">
                {t('register.username_description', 'Username will be used to log in')}
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-wow-light">
                {t('register.display_name', 'Display Name')}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('register.enter_display_name', 'Enter display name')} 
                  className="bg-wow-dark text-wow-light border-wow-gold/20" 
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-wow-light/60 text-xs">
                {t('register.display_name_description', 'This is how others will see you')}
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-wow-light">
                {t('register.email', 'Email')}
              </FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder={t('register.enter_email', 'Enter your email')} 
                  className="bg-wow-dark text-wow-light border-wow-gold/20" 
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-wow-light/60 text-xs">
                {t('register.email_description', 'Used for account recovery')}
              </FormDescription>
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
                {t('register.password', 'Password')}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={t('register.choose_password', 'Choose a password')} 
                  className="bg-wow-dark text-wow-light border-wow-gold/20" 
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-wow-light/60 text-xs">
                {t('register.password_requirements', 'Must be at least 8 characters')}
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-wow-light">
                {t('register.confirm_password', 'Confirm Password')}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={t('register.confirm_password', 'Confirm your password')} 
                  className="bg-wow-dark text-wow-light border-wow-gold/20" 
                  {...field} 
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          variant="wow" 
          className="w-full mt-4" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('register.processing', 'Processing...')}
            </span>
          ) : (
            t('register.create_account', 'Create Account')
          )}
        </Button>
      </form>
    </Form>
  );
}