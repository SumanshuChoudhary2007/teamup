'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Trophy, Users, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminHackathonPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [hackathon, setHackathon] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.is_admin) {
      router.push('/admin');
      return;
    }

    const fetch = async () => {
      const { data: h } = await supabase
        .from('hackathons')
        .select('*')
        .eq('id', id)
        .single();

      const { data: t } = await supabase
        .from('teams')
        .select('id, team_name, project_idea, current_members, max_members, status')
        .eq('hackathon_id', id)
        .order('created_at', { ascending: false });

      setHackathon(h);
      setTeams(t || []);
      setLoading(false);
    };

    fetch();
  }, [id, profile, authLoading]);

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="relative z-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/admin')} className="p-2 rounded-xl glass hover:bg-white/5 transition-colors text-[#94a3b8] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#7c3aed] mb-1 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> Admin → Hackathons
            </p>
            <h1 className="text-2xl font-bold text-white">{hackathon?.title}</h1>
            {hackathon?.organizer && <p className="text-sm text-[#64748b] mt-1">{hackathon.organizer}</p>}
          </div>
        </div>

        {/* Teams List */}
        <div className="glass rounded-3xl p-8 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#a78bfa]" />
            Registered Teams
            <span className="ml-2 px-2 py-0.5 rounded-lg bg-white/5 text-[#64748b] text-sm font-medium">{teams.length}</span>
          </h2>

          {teams.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
              <p className="text-[#64748b]">No teams have registered for this hackathon yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {teams.map(team => (
                <Link
                  key={team.id}
                  href={`/admin/team/${team.id}`}
                  className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#7c3aed]/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-white group-hover:text-[#a78bfa] transition-colors">{team.team_name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${team.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {team.status}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#64748b] group-hover:text-[#a78bfa] transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm text-[#94a3b8] line-clamp-2 mb-3">{team.project_idea || 'No project idea provided'}</p>
                  <p className="text-xs text-[#64748b]">{team.current_members}/{team.max_members} members</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
