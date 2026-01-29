import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAdminAuth } from '@/context/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ViewMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const { signIn, isAdmin, user } = useAdminAuth();
  const navigate = useNavigate();

  // Check if this is a password reset callback
  useState(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setViewMode('reset');
    }
  });

  // Redirect if already logged in as admin
  if (user && isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (viewMode === 'forgot') {
      const validation = emailSchema.safeParse({ email });
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        return;
      }

      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess('Password reset email sent! Check your inbox.');
      setLoading(false);
      return;
    }

    if (viewMode === 'reset') {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess('Password updated successfully! You can now sign in.');
      setViewMode('login');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
      return;
    }

    // Login or Signup
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    if (viewMode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      setSuccess('Account created! Please contact an administrator to grant you admin access, then sign in.');
      setViewMode('login');
      setLoading(false);
      return;
    }
    
    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'signup': return 'Admin Sign Up';
      case 'forgot': return 'Reset Password';
      case 'reset': return 'Set New Password';
      default: return 'Admin Login';
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'signup': return 'Create an account to request admin access';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Enter your new password';
      default: return 'Sign in with your admin credentials';
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-primary">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mb-4 mx-auto inline-block">
                <img src="/everydriver-logo.png" alt="EveryDriver" className="h-12 mx-auto" />
              </div>
              <CardTitle>{getTitle()}</CardTitle>
              <CardDescription>{getDescription()}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {viewMode === 'reset' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                        disabled={loading}
                      />
                    </div>

                    {viewMode !== 'forgot' && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={loading}
                        />
                      </div>
                    )}
                  </>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {viewMode === 'signup' ? 'Creating account...' : 
                       viewMode === 'forgot' ? 'Sending...' :
                       viewMode === 'reset' ? 'Updating...' : 'Signing in...'}
                    </>
                  ) : (
                    viewMode === 'signup' ? 'Sign Up' : 
                    viewMode === 'forgot' ? 'Send Reset Link' :
                    viewMode === 'reset' ? 'Update Password' : 'Sign In'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground space-y-2">
                  {viewMode === 'login' && (
                    <>
                      <div>
                        <button
                          type="button"
                          onClick={() => { setViewMode('forgot'); setError(''); setSuccess(''); }}
                          className="text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div>
                        Need an account?{' '}
                        <button
                          type="button"
                          onClick={() => { setViewMode('signup'); setError(''); setSuccess(''); }}
                          className="text-primary hover:underline"
                        >
                          Sign up
                        </button>
                      </div>
                    </>
                  )}

                  {viewMode === 'signup' && (
                    <div>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setViewMode('login'); setError(''); setSuccess(''); }}
                        className="text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </div>
                  )}

                  {(viewMode === 'forgot' || viewMode === 'reset') && (
                    <div>
                      <button
                        type="button"
                        onClick={() => { setViewMode('login'); setError(''); setSuccess(''); }}
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Back to sign in
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
