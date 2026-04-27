'use client';

import Link from 'next/link';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserPlus, Mail, Lock, User, ArrowRight, Zap, Eye, EyeOff, Shield, Clock } from 'lucide-react';
import { Suspense, useState } from 'react';

function RegisterForm() {
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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20 relative text-center">
        <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
        <div className="fixed top-[10%] left-[20%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none bg-amber-500/10" />
        
        <div className="glass rounded-3xl p-8 sm:p-12 max-w-md w-full border border-amber-500/20 shadow-2xl animate-slide-up relative z-10">
           <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-400 mx-auto mb-6 shadow-lg shadow-amber-500/10">
             <Clock className="w-10 h-10" />
           </div>
           <h2 className="text-3xl font-bold text-white mb-4 italic">Registration Received</h2>
           <p className="text-[#94a3b8] mb-8 leading-relaxed">
             Your administrator account has been created successfully. For security, all admin access must be manually verified.
           </p>
           <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 text-sm mb-8 font-medium">
             Status: Waiting for Approval
           </div>
           <button onClick={() => router.push('/')} className="btn-primary w-full py-4 text-lg">
             Back to Home
           </button>
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
