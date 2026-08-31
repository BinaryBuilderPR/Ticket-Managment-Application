import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Sparkles, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = useSession();

  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect to home if already logged in
  useEffect(() => {
    if (session?.user && !isSessionPending) {
      navigate('/', { replace: true });
    }
  }, [session, isSessionPending, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);

    try {
      setIsLoading(true);
      const res = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (res.error) {
        setAuthError(
          res.error.message || 'Invalid email or password. Please try again.'
        );
        setIsLoading(false);
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during sign in.');
      setIsLoading(false);
    }
  };

  if (isSessionPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-border/80 bg-card/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-3 text-center flex flex-col items-center pb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Welcome to Helpdesk
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Sign in with your staff credentials to continue
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Server Auth Error Alert */}
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground flex items-start gap-3 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  className={`pl-10 ${
                    errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  {...register('password')}
                  className={`pl-10 ${
                    errors.password ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-border/40 pt-4 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            AI-Powered Student Support Desk • Database Sessions
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
