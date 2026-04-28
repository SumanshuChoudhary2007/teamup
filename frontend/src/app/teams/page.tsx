'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Team } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Users, Search, Filter, UserCheck, Code, ArrowRight, Trophy, Plus } from 'lucide-react';

export default function AllTeamsPage() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<(Team & { leader: { name: string }; hackathon: { title: string } })[]>([]);
  const [search, setSearch] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('teams')
        .select('*, leader:profiles!teams_created_by_fkey(name), hackathon:hackathons(title)')
        .order('created_at', { ascending: false });
      setTeams((data || []) as typeof teams);
      setLoading(false);
    };
    load();
  }, []);

  const isLeader = profile?.role === 'team_leader' || profile?.role === 'admin';

  const filtered = teams.filter(t => {
    const matchSearch = t.team_name.toLowerCase().includes(search.toLowerCase()) ||
      t.project_idea?.toLowerCase().includes(search.toLowerCase()) ||
      t.required_skills?.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
      t.hackathon?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = showFull || t.status === 'OPEN';
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-[#a78bfa]" /> Browse Teams
            </h1>
            <p className="text-[#94a3b8] mt-1">Find your perfect team across all hackathons</p>
          </div>
          {isLeader && (
            <Link href="/teams/create" className="btn-primary flex items-center gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Create Team
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="input-with-icon flex-1">
            <Search className="input-icon input-icon-left w-5 h-5" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="input-field has-icon-left" 
              placeholder="Search teams..." 
            />
          </div>
          <button
            onClick={() => setShowFull(!showFull)}
            className={`btn-secondary flex items-center gap-2 ${showFull ? 'border-amber-400/40 text-amber-400' : ''}`}
          >
            <Filter className="w-4 h-4" /> {showFull ? 'Showing All' : 'Open Only'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No teams found</h3>
            <p className="text-[#94a3b8]">Try adjusting your search or check back later.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((team, i) => {
              const spots = team.max_members - team.current_members;
              return (
                <Link key={team.id} href={`/teams/${team.id}`} className="glass rounded-2xl p-5 card-hover block animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{team.team_name}</h3>
                    <span className={`badge ${team.status === 'OPEN' ? 'badge-success' : 'badge-danger'}`}>{team.status}</span>
                  </div>
                  <p className="text-xs text-[#a78bfa] flex items-center gap-1 mb-2">
                    <Trophy className="w-3 h-3" /> {team.hackathon?.title}
                  </p>
                  <p className="text-sm text-[#94a3b8] line-clamp-2 mb-3">{team.project_idea || 'No project idea yet'}</p>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="flex items-center gap-1 text-[#94a3b8]">
                      <UserCheck className="w-4 h-4 text-[#a78bfa]" /> {team.current_members}/{team.max_members}
                    </span>
                    <span className={`text-xs font-semibold ${spots > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {spots > 0 ? `${spots} spots` : 'FULL'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full gradient-bg" style={{ width: `${(team.current_members / team.max_members) * 100}%` }} />
                  </div>

                  {team.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {team.required_skills.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
                      {team.required_skills.length > 4 && <span className="skill-tag">+{team.required_skills.length - 4}</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-3 text-sm text-[#a78bfa] font-medium">
                    View Details <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
