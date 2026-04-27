'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Mail, Lock, User, ArrowRight, Zap, Eye, EyeOff, Shield } from 'lucide-react';
import { Suspense, useState } from 'react';

function RegisterForm() {
  const { signUp } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await signUp(email, password, name);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      router.push(redirect);
    }
  };

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
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-11"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="admin@teamup.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
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
