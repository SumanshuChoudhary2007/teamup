'use client';

import Link from 'next/link';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserPlus, Mail, Lock, User, ArrowRight, Zap, Eye, EyeOff, Shield, Clock, CheckCircle } from 'lucide-react';
import { Suspense, useState, useEffect } from 'react';

function RegisterForm() {
  const { signInWithOAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminType = searchParams.get('type') === 'admin';
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });

    if (err) {
      if (err.message.includes('already registered')) {
        // If user already exists and it's an admin path, check if they have a pending request
        if (isAdminType) {
          const { data: existingUser } = await supabase.from('profiles').select('id, role').eq('email', email).single();
          if (existingUser) {
             const { data: existingReq } = await supabase.from('admin_requests').select('status').eq('user_id', existingUser.id).eq('status', 'pending').single();
             if (existingReq) {
               setSubmitted(true);
               setLoading(false);
               return;
             }
          }
        }
      }
      setError(err.message);
      setLoading(false);
    } else if (data.user) {
      if (isAdminType) {
        // Create admin request - profile is created via DB trigger
        // We insert immediately since RLS now allows public inserts for this table
        const { error: reqErr } = await supabase.from('admin_requests').insert({
          user_id: data.user.id,
          reason: 'Administrator account registration',
          status: 'pending'
        });
        
        if (reqErr) {
          console.error('Error creating admin request:', reqErr);
          // If request fails due to missing profile (foreign key), we try once more after a short delay
          setTimeout(async () => {
             await supabase.from('admin_requests').insert({
                user_id: data.user!.id,
                reason: 'Administrator account registration',
                status: 'pending'
             });
          }, 1000);
        }
        setSubmitted(true);
        setLoading(false);
      } else {
        router.push(redirect);
      }
    }
  };

  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (!submitted || !isAdminType) return;

    // Poll for approval status
    const checkStatus = async () => {
      // Find the request by user_id
      // Since the user might not be logged in yet (if email confirm is on), we use the email from state
      const { data } = await supabase
        .from('admin_requests')
        .select('status, profiles!inner(email)')
        .eq('profiles.email', email)
        .single();
      
      if (data?.status === 'approved') {
        setApprovalStatus('approved');
      } else if (data?.status === 'rejected') {
        setApprovalStatus('rejected');
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [submitted, isAdminType, email]);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20 relative text-center">
        <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
        <div className={`fixed top-[10%] left-[20%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none ${approvalStatus === 'approved' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`} />
        
        <div className={`glass rounded-3xl p-8 sm:p-12 max-w-md w-full border ${approvalStatus === 'approved' ? 'border-emerald-500/20 shadow-emerald-500/10' : 'border-amber-500/20 shadow-amber-500/10'} shadow-2xl animate-slide-up relative z-10`}>
           <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
             {approvalStatus === 'approved' ? <CheckCircle className="w-10 h-10 animate-bounce" /> : <Clock className="w-10 h-10 animate-pulse" />}
           </div>
           
           <h2 className="text-3xl font-bold text-white mb-4 italic">
             {approvalStatus === 'approved' ? 'Congrats! You are Approved' : 'Registration Received'}
           </h2>
           
           <p className="text-[#94a3b8] mb-8 leading-relaxed">
             {approvalStatus === 'approved' 
               ? 'Your administrator account has been verified. You can now access the full admin dashboard.' 
               : 'Your administrator account has been created successfully. For security, all admin access must be manually verified.'}
           </p>

           <div className={`p-4 rounded-xl border mb-8 font-medium ${
             approvalStatus === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
           }`}>
             Status: {approvalStatus === 'approved' ? 'Approved' : 'Waiting for Approval'}
           </div>

           {approvalStatus === 'approved' ? (
             <button onClick={() => router.push('/login?type=admin')} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
               Proceed to Login <ArrowRight className="w-5 h-5" />
             </button>
           ) : (
             <button onClick={() => router.push('/')} className="btn-secondary w-full py-4 text-lg">
               Back to Home
             </button>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      <div className={`fixed top-[10%] left-[20%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none ${isAdminType ? 'bg-amber-500/10' : 'bg-[#7c3aed]/10'}`} />
      <div className={`fixed bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none ${isAdminType ? 'bg-purple-500/10' : 'bg-[#06b6d4]/10'}`} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdminType ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'gradient-bg'}`}>
              {isAdminType ? <Shield className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
            </div>
            <span className={`text-2xl font-bold ${isAdminType ? 'text-white' : 'gradient-text'}`}>
              {isAdminType ? 'Admin Portal' : 'TeamUp'}
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isAdminType ? 'Admin Registration' : 'Create Account'}
          </h1>
          {isAdminType && (
            <div className="flex justify-center mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                Administrator Mode
              </span>
            </div>
          )}
          <p className="text-[#94a3b8]">
            {isAdminType ? 'Register your administrator account' : 'Join the community of builders'}
          </p>
        </div>

        <div className={`glass rounded-2xl p-8 border ${isAdminType ? 'border-amber-500/10' : 'border-white/5'}`}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Full Name</label>
              <div className="input-with-icon">
                <User className="input-icon input-icon-left w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field has-icon-left"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Email</label>
              <div className="input-with-icon">
                <Mail className="input-icon input-icon-left w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field has-icon-left"
                  placeholder="admin@teamup.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon input-icon-left w-5 h-5" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field has-icon-left has-icon-right"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="input-icon input-icon-right text-[#64748b] hover:text-white"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 flex items-center justify-center gap-2 text-base font-bold rounded-xl transition-all shadow-xl ${
                isAdminType 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' 
                : 'btn-primary'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> {isAdminType ? 'Register Admin' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {!isAdminType && (
            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-[#120f24] px-4 text-[#64748b]">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => signInWithOAuth('google')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl glass-strong border border-white/5 hover:bg-white/5 transition-all text-sm font-medium text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => signInWithOAuth('github')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl glass-strong border border-white/5 hover:bg-white/5 transition-all text-sm font-medium text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-[#94a3b8]">
          Already have an account?{' '}
          <Link href={`/login?${searchParams.toString()}`} className={`${isAdminType ? 'text-amber-400' : 'text-[#a78bfa]'} hover:text-white font-medium inline-flex items-center gap-1`}>
            Sign in <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0c1d]" />}>
      <RegisterForm />
    </Suspense>
  );
}
