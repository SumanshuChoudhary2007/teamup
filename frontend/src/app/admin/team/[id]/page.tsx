'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Users, Lightbulb, FileText, User, Loader2, Trophy } from 'lucide-react';

export default function AdminTeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.is_admin) {
      router.push('/admin');
      return;
    }

    const fetch = async () => {
      // Fetch team with creator and hackathon name
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, team_name, project_idea, description, hackathon_id, created_by, hackathon:hackathons(title), creator:profiles!created_by(id, name, email)')
        .eq('id', id)
        .single();

      // Fetch all accepted members (excluding leader who is already in creator)
      const { data: apps } = await supabase
        .from('applications')
        .select('user:profiles(id, name, email)')
        .eq('team_id', id)
        .eq('status', 'accepted');

      const acceptedMembers = apps?.map(a => a.user).filter(Boolean) || [];

      // Combine leader + members, deduplicate
      const allMembers: any[] = [];
      if (teamData?.creator) {
        allMembers.push({ ...teamData.creator, isLeader: true });
      }
      acceptedMembers.forEach((m: any) => {
        if (!allMembers.find(existing => existing.id === m.id)) {
          allMembers.push({ ...m, isLeader: false });
        }
      });

      setTeam(teamData);
      setMembers(allMembers);
      setLoading(false);
    };

    fetch();
  }, [id, profile, authLoading]);

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
    </div>
  );

  if (!team) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#64748b]">Team not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="relative z-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl glass hover:bg-white/5 transition-colors text-[#94a3b8] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#7c3aed] mb-1 flex items-center gap-2">
              <Trophy className="w-3 h-3" /> {team.hackathon?.title}
            </p>
            <h1 className="text-2xl font-bold text-white">{team.team_name}</h1>
          </div>
        </div>

        {/* Project Idea */}
        <div className="glass rounded-3xl p-8 border border-white/10">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#64748b] mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Project Idea
          </h2>
          <p className="text-white text-lg font-semibold leading-relaxed">
            {team.project_idea || 'No project idea provided.'}
          </p>
        </div>

        {/* Description */}
        <div className="glass rounded-3xl p-8 border border-white/10">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#64748b] mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#22d3ee]" /> Description
          </h2>
          <p className="text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
            {team.description || 'No description provided.'}
          </p>
        </div>

        {/* Team Members */}
        <div className="glass rounded-3xl p-8 border border-white/10">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#64748b] mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#a78bfa]" /> Team Members ({members.length})
          </h2>
          <div className="space-y-3">
            {members.map((member: any) => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{member.name}</p>
                  <p className="text-xs text-[#64748b] truncate">{member.email}</p>
                </div>
                {member.isLeader && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-[#7c3aed]/10 text-[#a78bfa] shrink-0">
                    Leader
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
