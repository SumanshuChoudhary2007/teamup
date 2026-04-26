'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Shield, Send, CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AdminApplyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'submitted'>('none');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      supabase
        .from('admin_requests')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()
        .then(({ data }) => {
          if (data) setRequestStatus('pending');
        });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason.trim()) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('admin_requests')
      .insert({ user_id: user.id, reason: reason.trim(), status: 'pending' });

    if (!error) {
      setRequestStatus('submitted');
    }
    setSubmitting(false);
  };

  if (authLoading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      
      <div className="relative z-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="glass rounded-3xl p-8 sm:p-10 text-center border border-white/5 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-purple-500/20">
            <Shield className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">Admin Application</h1>
          <p className="text-[#94a3b8] mb-10 max-w-md mx-auto">
            You've discovered the secret entrance! Apply here to become a TeamUp administrator and help manage our hackathons.
          </p>

          {requestStatus === 'submitted' ? (
            <div className="animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xl mb-4">
                <CheckCircle className="w-6 h-6" /> Application Submitted!
              </div>
              <p className="text-[#64748b] text-sm">
                Your request is now in the queue. The Super Admin will review your application soon.
              </p>
              <button onClick={() => router.push('/dashboard')} className="btn-secondary mt-8 w-full py-3">
                Return to Dashboard
              </button>
            </div>
          ) : requestStatus === 'pending' ? (
            <div>
              <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xl mb-4">
                <Clock className="w-6 h-6" /> Already Pending
              </div>
              <p className="text-[#64748b] text-sm">
                You already have an active application. Please wait for the Super Admin to review it.
              </p>
              <button onClick={() => router.push('/dashboard')} className="btn-secondary mt-8 w-full py-3">
                Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Why do you want to be an Admin?</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="input-field min-h-[150px] text-base"
                  placeholder="Tell us about your experience managing communities or events..."
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting || !reason.trim()} 
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20"
              >
                {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
