'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Team, type Application, type Hackathon } from '@/lib/supabase';
import {
  LayoutDashboard, Trophy, Users, FileText, Plus, Clock,
  CheckCircle, XCircle, ArrowRight, Zap, UserCheck, AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [suggestedTeams, setSuggestedTeams] = useState<(Team & { hackathon: Hackathon })[]>([]);
  const [suggestedHackers, setSuggestedHackers] = useState<Profile[]>([]);
  const [myApps, setMyApps] = useState<(Application & { team: Team & { hackathon: Hackathon } })[]>([]);
  const [pendingApps, setPendingApps] = useState<(Application & { user: { name: string; skills: string[] }; team: { team_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Teams I created
      const { data: createdTeams } = await supabase
        .from('teams')
        .select('*, hackathon:hackathons(*)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // Teams I joined (accepted applications)
      const { data: joinedApps } = await supabase
        .from('applications')
        .select('team:teams(*, hackathon:hackathons(*))')
        .eq('user_id', user.id)
        .eq('status', 'accepted');
      
      const joinedTeams = joinedApps?.map(a => a.team).filter(Boolean) || [];
      
      // Combine and remove duplicates (though they shouldn't exist if logic is consistent)
      const allTeamsMap = new Map();
      [...(createdTeams || []), ...joinedTeams].forEach(t => allTeamsMap.set(t.id, t));
      setMyTeams(Array.from(allTeamsMap.values()) as Team[]);

      // My applications (all statuses)
      const { data: apps } = await supabase
        .from('applications')
        .select('*, team:teams(*, hackathon:hackathons(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMyApps((apps || []) as typeof myApps);

      // Applications to my teams (for team leaders)
      const createdTeamIds = (createdTeams || []).map(t => t.id);
      if (createdTeamIds.length > 0) {
        const { data: pending } = await supabase
          .from('applications')
          .select('*, user:profiles(name, skills), team:teams(team_name)')
          .eq('status', 'pending')
          .in('team_id', createdTeamIds);
        setPendingApps((pending || []) as typeof pendingApps);
      }

      // Suggested Teams (Skill-based matching)
      let matches: any[] = [];
      if (profile?.skills && profile.skills.length > 0) {
        const { data: teamMatches } = await supabase
          .from('teams')
          .select('*, hackathon:hackathons(*)')
          .eq('status', 'OPEN')
          .neq('created_by', user.id)
          .overlaps('required_skills', profile.skills)
          .limit(3);
        matches = teamMatches || [];
      }

      // Fallback: If no skill matches or profile incomplete, show latest teams
      if (matches.length === 0) {
        const { data: latest } = await supabase
          .from('teams')
          .select('*, hackathon:hackathons(*)')
          .eq('status', 'OPEN')
          .neq('created_by', user.id)
          .limit(3)
          .order('created_at', { ascending: false });
        matches = latest || [];
      }
      setSuggestedTeams(matches);

      // If still no teams found (rare), suggest hackers
      if (matches.length === 0) {
        const { data: hackers } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(4);
        setSuggestedHackers((hackers || []) as Profile[]);
      }

      setLoading(false);
    };
    load();
  }, [user, profile]);

  if (authLoading || !user) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;

  const isLeader = profile?.role === 'team_leader' || profile?.role === 'admin';
  const isProfileIncomplete = !profile?.skills || profile.skills.length === 0 || !profile.bio;

  const statusIcon = (s: string) => {
    if (s === 'accepted') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (s === 'rejected') return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const statusBadge = (s: string) => {
    const cls = s === 'accepted' ? 'badge-success' : s === 'rejected' ? 'badge-danger' : 'badge-warning';
    return <span className={`badge ${cls}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      {/* Header */}
      <div className="relative z-10 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-[#a78bfa]" />
              Dashboard
            </h1>
            <p className="text-[#94a3b8] mt-1">Welcome back, <span className="text-white font-medium">{profile?.name}</span></p>
          </div>
          <div className="flex gap-3">
            {isLeader && (
              <Link href="/teams/create" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Team
              </Link>
            )}
            <Link href="/hackathons" className="btn-secondary flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Hackathons
            </Link>
          </div>
        </div>
      </div>

      {isProfileIncomplete && (
        <div className="relative z-10 mb-8 animate-slide-up">
          <div className="glass-strong border-amber-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-amber-500/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap className="w-32 h-32 text-amber-400" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-white mb-1">Boost Your Team Matching!</h3>
              <p className="text-sm text-[#94a3b8]">Complete your profile with your skills and bio to get personalized team and partner suggestions.</p>
            </div>
            <Link href="/profile" className="btn-primary py-3 px-8 bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 whitespace-nowrap">
              Complete Profile
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative z-10 space-y-12">
          {/* Stats cards ... */}
          
          {/* Matching Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {suggestedTeams.length > 0 ? (
                    <><Zap className="w-6 h-6 text-amber-400" /> Top Team Matches</>
                  ) : (
                    <><Users className="w-6 h-6 text-[#22d3ee]" /> Recommended Hackers</>
                  )}
                </h2>
                <p className="text-sm text-[#64748b] mt-1">
                  {suggestedTeams.length > 0 
                    ? "Based on your skills and interests" 
                    : "No matching teams found right now. Connect with these hackers instead!"}
                </p>
              </div>
              <Link href={suggestedTeams.length > 0 ? "/teams" : "/hackers"} className="text-[#a78bfa] hover:text-white flex items-center gap-1 font-medium transition-all group">
                Browse more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {suggestedTeams.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedTeams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="glass rounded-3xl p-6 card-hover border-white/5 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-white text-lg truncate flex-1">{team.team_name}</h3>
                      <span className="badge badge-success text-[10px]">OPEN</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#a78bfa] mb-4 font-bold tracking-widest uppercase">
                      <Trophy className="w-3.5 h-3.5" /> {team.hackathon?.title}
                    </div>
                    <p className="text-sm text-[#94a3b8] line-clamp-2 mb-6 h-10">{team.project_idea || 'Working on something awesome...'}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex -space-x-2">
                        {[...Array(team.current_members)].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-[#1e1b2e] bg-[#2a2640] flex items-center justify-center text-[10px] text-white">
                            <User className="w-3 h-3" />
                          </div>
                        ))}
                        {[...Array(team.max_members - team.current_members)].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-dashed border-white/10 flex items-center justify-center" />
                        ))}
                      </div>
                      <span className="text-xs text-emerald-400 font-black">APPLY NOW →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedHackers.map((hacker) => (
                  <div key={hacker.id} className="glass rounded-3xl p-6 border border-white/5 text-center group hover:bg-white/[0.03] transition-all">
                    <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform shadow-xl shadow-black/20">
                      {hacker.name?.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-white mb-1">{hacker.name}</h3>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-tighter mb-4 line-clamp-1">{hacker.skills?.join(' • ')}</p>
                    <Link href={`/profile/${hacker.id}`} className="text-xs font-bold text-[#a78bfa] hover:text-white transition-colors">
                      View Profile →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending applications ... */}
              <div className="space-y-3">
                {myApps.map((app) => (
                  <div key={app.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {statusIcon(app.status)}
                      <div>
                        <p className="text-white font-medium">{app.team?.team_name}</p>
                        <p className="text-xs text-[#64748b]">{app.team?.hackathon?.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusBadge(app.status)}
                      <Link href={`/teams/${app.team_id}`} className="text-[#a78bfa] text-sm hover:text-white flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {myTeams.length === 0 && myApps.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <Zap className="w-12 h-12 text-[#a78bfa] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Ready to get started?</h3>
              <p className="text-[#94a3b8] mb-6">Browse hackathons and find a team to join, or create your own.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/hackathons" className="btn-primary flex items-center gap-2 justify-center">
                  <Trophy className="w-4 h-4" /> Browse Hackathons
                </Link>
                <Link href="/teams" className="btn-secondary flex items-center gap-2 justify-center">
                  <Users className="w-4 h-4" /> Find Teams
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
