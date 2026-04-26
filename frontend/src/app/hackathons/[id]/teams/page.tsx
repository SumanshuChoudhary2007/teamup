'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Team, type Hackathon } from '@/lib/supabase';
import { Users, Search, Plus, ArrowLeft, UserCheck, Trophy, Code, ArrowRight, Filter } from 'lucide-react';

export default function HackathonTeamsPage() {
  const params = useParams();
  const hackathonId = params.id as string;
  const { profile } = useAuth();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<(Team & { leader: { name: string; avatar_url: string | null } })[]>([]);
  const [search, setSearch] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: h } = await supabase.from('hackathons').select('*').eq('id', hackathonId).single();
      setHackathon(h as Hackathon);

      const { data: t } = await supabase
        .from('teams')
        .select('*, leader:profiles!teams_created_by_fkey(name, avatar_url)')
        .eq('hackathon_id', hackathonId)
        .order('created_at', { ascending: false });
      setTeams((t || []) as typeof teams);
      setLoading(false);
    };
    load();
  }, [hackathonId]);

  const isLeader = profile?.role === 'team_leader' || profile?.role === 'admin' || profile?.role === 'super_admin';

  const filtered = teams.filter(t => {
    const matchSearch = t.team_name.toLowerCase().includes(search.toLowerCase()) ||
      t.project_idea?.toLowerCase().includes(search.toLowerCase()) ||
      t.required_skills?.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = showFull || t.status === 'OPEN';
    return matchSearch && matchStatus;
  });

  const matchPercent = (reqSkills: string[]) => {
    if (!profile?.skills?.length || !reqSkills?.length) return 0;
    const matched = reqSkills.filter(s => profile.skills.some(ps => ps.toLowerCase() === s.toLowerCase()));
    return Math.round((matched.length / reqSkills.length) * 100);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="relative z-10">
        {/* Back link + header */}
        <Link href="/hackathons" className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Hackathons
        </Link>

        {hackathon && (
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <Trophy className="w-7 h-7 text-amber-400" /> {hackathon.title}
                </h1>
                <p className="text-[#94a3b8] mt-1">{hackathon.organizer} • {hackathon.mode}</p>
              </div>
              {isLeader && (
                <Link href={`/teams/create?hackathon=${hackathonId}`} className="btn-primary flex items-center gap-2 shrink-0">
                  <Plus className="w-4 h-4" /> Create Team
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-11"
              placeholder="Search teams by name, skill..."
            />
          </div>
          <button
            onClick={() => setShowFull(!showFull)}
            className={`btn-secondary flex items-center gap-2 ${showFull ? 'border-amber-400/40 text-amber-400' : ''}`}
          >
            <Filter className="w-4 h-4" /> {showFull ? 'Show All' : 'Hide Full'}
          </button>
        </div>

        {/* Teams grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No teams yet</h3>
            <p className="text-[#94a3b8] mb-4">Be the first to create a team for this hackathon!</p>
            {isLeader && (
              <Link href={`/teams/create?hackathon=${hackathonId}`} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Team
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((team, i) => {
              const spots = team.max_members - team.current_members;
              const match = matchPercent(team.required_skills);
              return (
                <div key={team.id} className="glass rounded-2xl p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{team.team_name}</h3>
                      <p className="text-xs text-[#64748b] mt-0.5">by {team.leader?.name}</p>
                    </div>
                    <span className={`badge ${team.status === 'OPEN' ? 'badge-success' : 'badge-danger'}`}>
                      {team.status}
                    </span>
                  </div>

                  <p className="text-sm text-[#94a3b8] line-clamp-2 mb-3">{team.project_idea || 'No project idea yet'}</p>

                  {/* Members bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-1 text-[#94a3b8]">
                        <UserCheck className="w-4 h-4 text-[#a78bfa]" />
                        {team.current_members} / {team.max_members} members
                      </span>
                      <span className={`text-xs font-semibold ${spots > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {spots > 0 ? `${spots} spot${spots > 1 ? 's' : ''} left` : 'FULL'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all gradient-bg"
                        style={{ width: `${(team.current_members / team.max_members) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  {team.required_skills?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-xs text-[#64748b] mb-1.5">
                        <Code className="w-3 h-3" /> Required Skills
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {team.required_skills.map(s => (
                          <span key={s} className={`skill-tag ${
                            profile?.skills?.some(ps => ps.toLowerCase() === s.toLowerCase()) ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : ''
                          }`}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Match + CTA */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    {match > 0 && (
                      <span className={`text-xs font-semibold ${match >= 70 ? 'text-emerald-400' : match >= 40 ? 'text-amber-400' : 'text-[#94a3b8]'}`}>
                        {match}% match
                      </span>
                    )}
                    <Link
                      href={`/teams/${team.id}`}
                      className={`btn-primary text-sm py-2 px-4 flex items-center gap-1 ml-auto ${team.status === 'FULL' ? 'opacity-60' : ''}`}
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
