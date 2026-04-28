'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Notification } from '@/lib/supabase';
import { Bell, CheckCheck, CheckCircle, XCircle, Users, Trophy, Info, Trash2, MessageSquare } from 'lucide-react';

const typeIcon = (type: string) => {
  if (type.includes('accept')) return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
  if (type.includes('reject')) return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
  if (type.includes('application')) return <Users className="w-5 h-5 text-[#a78bfa] shrink-0" />;
  if (type.includes('hackathon')) return <Trophy className="w-5 h-5 text-amber-400 shrink-0" />;
  if (type.includes('chat')) return <MessageSquare className="w-5 h-5 text-[#22d3ee] shrink-0" />;
  return <Info className="w-5 h-5 text-[#22d3ee] shrink-0" />;
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(50);
      setNotifs((data || []) as Notification[]);
      setLoading(false);
    };
    load();
    const channel = supabase.channel('notifs-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        (p) => setNotifs(prev => [p.new as Notification, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id).eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const clearAll = async () => {
    if (!user || !confirm('Are you sure you want to delete all notifications?')) return;
    await supabase.from('notifications').delete().eq('recipient_id', user.id);
    setNotifs([]);
  };

  const unread = notifs.filter(n => !n.is_read).length;

  if (authLoading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Bell className="w-8 h-8 text-[#a78bfa]" /> Notifications</h1>
            {unread > 0 && <p className="text-sm text-[#94a3b8] mt-1">{unread} unread</p>}
          </div>
          <div className="flex gap-2">
            {unread > 0 && (
              <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm"><CheckCheck className="w-4 h-4" /> Mark all read</button>
            )}
            {notifs.length > 0 && (
              <button onClick={clearAll} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all" title="Clear all notifications"><Trash2 className="w-5 h-5" /></button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>
        ) : notifs.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
            <p className="text-[#94a3b8]">You&apos;ll be notified about team and application updates.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((n) => (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                className={`glass rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/5 ${!n.is_read ? 'border-l-2 border-[#7c3aed]' : ''}`}>
                {typeIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{n.title}</p>
                  <p className="text-[#94a3b8] text-sm mt-0.5">{n.message}</p>
                  <p className="text-[#64748b] text-xs mt-1">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#7c3aed] mt-1.5 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
