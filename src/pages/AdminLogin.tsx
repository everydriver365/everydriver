import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft, Shield, Lock, Award, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      default: return 'Sign in to Admin Portal';
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'signup': return 'Create an account to request admin access';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Enter your new password';
      default: return 'Enter your credentials to access the admin dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EveryDriver</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">
              Admin Control Centre
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Manage instructors, monitor bookings, and oversee the entire 
              platform from one powerful dashboard.
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Full platform oversight" },
                { icon: Lock, text: "Role-based access control" },
                { icon: Award, text: "Real-time analytics" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-slate-500">
            © 2025 EveryDriver. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EveryDriver</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-white">
                  {getTitle()}
                </CardTitle>
                <p className="text-slate-400 text-sm mt-1">
                  {getDescription()}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Alert variant="destructive" className="py-2 bg-red-500/10 border-red-500/20">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {success && (
                    <Alert className="bg-emerald-500/10 border-emerald-500/20">
                      <AlertDescription className="text-emerald-300 text-sm">{success}</AlertDescription>
                    </Alert>
                  )}

                  {viewMode === 'reset' ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm font-medium text-slate-300">New Password</Label>
                        <Input
                          id="newPassword"
                          name="new-password"
                          type="password"
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={loading}
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          name="confirm-password"
                          type="password"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={loading}
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-300">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@example.com"
                          required
                          disabled={loading}
                          className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                          autoComplete="email"
                        />
                      </div>

                      {viewMode !== 'forgot' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-300">Password</Label>
                            <button
                              type="button"
                              onClick={() => { setViewMode('forgot'); setError(''); setSuccess(''); }}
                              className="text-sm text-emerald-400 hover:text-emerald-300"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                            autoComplete="current-password"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium" 
                    disabled={loading}
                  >
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

                  <div className="text-center text-sm space-y-2">
                    {viewMode === 'login' && (
                      <div>
                        <span className="text-slate-400">Need an account? </span>
                        <button
                          type="button"
                          onClick={() => { setViewMode('signup'); setError(''); setSuccess(''); }}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Sign up
                        </button>
                      </div>
                    )}

                    {viewMode === 'signup' && (
                      <div>
                        <span className="text-slate-400">Already have an account? </span>
                        <button
                          type="button"
                          onClick={() => { setViewMode('login'); setError(''); setSuccess(''); }}
                          className="text-emerald-400 hover:text-emerald-300"
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
                          className="inline-flex items-center text-emerald-400 hover:text-emerald-300"
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

          {/* Portal Links Footer */}
          <div className="mt-8 text-center text-xs text-slate-500 space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/drive365" className="hover:text-slate-300 transition-colors">Drive365 Learners</Link>
              <span>·</span>
              <Link to="/pupil/login" className="hover:text-slate-300 transition-colors">Pupil Portal</Link>
              <span>·</span>
              <Link to="/instructor-app" className="hover:text-slate-300 transition-colors">Instructor Home</Link>
              <span>·</span>
              <Link to="/instructor-app/login" className="hover:text-slate-300 transition-colors">Instructor Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}