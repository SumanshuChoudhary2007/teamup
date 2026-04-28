'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Bell, MessageSquare, X, Trophy, Users, Info } from 'lucide-react';
import Link from 'next/link';

export default function NotificationToast() {
  const { user } = useAuth();
  const [activeNotif, setActiveNotif] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-toasts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, (payload) => {
        const notif = payload.new;
        setActiveNotif(notif);
        setVisible(true);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
          setVisible(false);
        }, 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!activeNotif) return null;

  const getIcon = (type: string) => {
    if (type.includes('chat')) return <MessageSquare className="w-5 h-5 text-cyan-400" />;
    if (type.includes('hackathon')) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (type.includes('application')) return <Users className="w-5 h-5 text-purple-400" />;
    return <Info className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
      <div className="glass-strong border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50 min-w-[300px] max-w-[400px]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            {getIcon(activeNotif.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-white line-clamp-1">{activeNotif.title}</p>
              <button onClick={() => setVisible(false)} className="text-[#64748b] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2 leading-relaxed">{activeNotif.message}</p>
            {activeNotif.link && (
              <Link 
                href={activeNotif.link}
                onClick={() => setVisible(false)}
                className="inline-block mt-3 text-[10px] font-bold text-[#a78bfa] uppercase tracking-widest hover:text-white transition-colors"
              >
                View Details →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
