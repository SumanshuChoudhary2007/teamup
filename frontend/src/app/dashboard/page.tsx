'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Team, type Application, type Hackathon, type Profile } from '@/lib/supabase';
import {
  LayoutDashboard, Trophy, Users, FileText, Plus, Clock,
  CheckCircle, XCircle, ArrowRight, Zap, UserCheck, AlertCircle, User, Sparkles
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/Skeleton';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const isLookingForMembers = profile?.looking_for === 'members';
  const router = useRouter();
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [suggestedTeams, setSuggestedTeams] = useState<(Team & { hackathon: Hackathon })[]>([]);
  const [suggestedDevelopers, setSuggestedDevelopers] = useState<Profile[]>([]);
  const [myApps, setMyApps] = useState<(Application & { team: Team & { hackathon: Hackathon } })[]>([]);
  const [myInvites, setMyInvites] = useState<(Application & { team: Team & { hackathon: Hackathon } })[]>([]);
  const [pendingApps, setPendingApps] = useState<(Application & { user: { name: string; skills: string[] }; team: { team_name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Redirect admin to admin dashboard
    if (profile?.is_admin) {
      router.push('/admin');
    }
  }, [authLoading, user, profile, router]);

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
      
      // Combine and remove duplicates
      const allTeamsMap = new Map();
      [...(createdTeams || []), ...joinedTeams].forEach(t => allTeamsMap.set(t.id, t));
      setMyTeams(Array.from(allTeamsMap.values()) as Team[]);

       // My applications (pending/rejected/accepted)
      const { data: apps } = await supabase
        .from('applications')
        .select('*, team:teams(*, hackathon:hackathons(*))')
        .eq('user_id', user.id)
        .neq('status', 'invited')
        .order('created_at', { ascending: false });
      setMyApps((apps || []) as typeof myApps);

      // My invitations
      const { data: invites } = await supabase
        .from('applications')
        .select('*, team:teams(*, hackathon:hackathons(*))')
        .eq('user_id', user.id)
        .eq('status', 'invited')
        .order('created_at', { ascending: false });
      setMyInvites((invites || []) as typeof myInvites);

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

      // Recommendations based on 'looking_for'

      if (isLookingForMembers) {
        // Find Developers
        let developerMatches: any[] = [];
        if (profile?.skills && profile.skills.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .overlaps('skills', profile.skills)
            .limit(4);
          developerMatches = data || [];
        }
        if (developerMatches.length === 0) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .limit(4)
            .order('created_at', { ascending: false });
          developerMatches = data || [];
        }
        setSuggestedDevelopers(developerMatches);
        setSuggestedTeams([]);
      } else {
        // Find Teams
        let teamMatches: any[] = [];
        if (profile?.skills && profile.skills.length > 0) {
          const { data } = await supabase
            .from('teams')
            .select('*, hackathon:hackathons(*)')
            .eq('status', 'OPEN')
            .neq('created_by', user.id)
            .overlaps('required_skills', profile.skills)
            .limit(3);
          teamMatches = data || [];
        }
        if (teamMatches.length === 0) {
          const { data } = await supabase
            .from('teams')
            .select('*, hackathon:hackathons(*)')
            .eq('status', 'OPEN')
            .neq('created_by', user.id)
            .limit(3)
            .order('created_at', { ascending: false });
          teamMatches = data || [];
        }
        setSuggestedTeams(teamMatches);
        setSuggestedDevelopers([]);
      }

      setLoading(false);
    };
    load();
  }, [user, profile]);

  const handleInviteAction = async (inviteId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: action })
        .eq('id', inviteId);

      if (error) throw error;
      
      if (action === 'accepted') {
        // If accepted, update profile to 'none' looking_for
        await supabase.from('profiles').update({ looking_for: 'none' }).eq('id', user?.id);
      }

      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Invite Action Error:', err);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <DashboardSkeleton />
    </div>
  );

  if (profile?.is_admin) return null;

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
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Zap className="w-32 h-32 text-amber-400" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-white mb-1">Boost Your Team Matching!</h3>
              <p className="text-sm text-[#94a3b8]">Complete your profile to get personalized suggestions.</p>
            </div>
            <Link href="/profile" className="btn-primary py-3 px-8 bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 whitespace-nowrap">
              Complete Profile
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="relative z-10">
          <DashboardSkeleton />
        </div>
      ) : (
        <div className="relative z-10 space-y-12">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass rounded-2xl p-5">
              <Users className="w-6 h-6 text-[#a78bfa] mb-2" />
              <p className="text-2xl font-bold text-white">{myTeams.length}</p>
              <p className="text-xs text-[#64748b]">My Teams</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <FileText className="w-6 h-6 text-[#22d3ee] mb-2" />
              <p className="text-2xl font-bold text-white">{myApps.length}</p>
              <p className="text-xs text-[#64748b]">Applications</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <CheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-white">{myApps.filter(a => a.status === 'accepted').length}</p>
              <p className="text-xs text-[#64748b]">Accepted</p>
            </div>
            <div className="glass rounded-2xl p-5">
              <Clock className="w-6 h-6 text-amber-400 mb-2" />
              <p className="text-2xl font-bold text-white">{pendingApps.length}</p>
              <p className="text-xs text-[#64748b]">Pending Review</p>
            </div>
          </div>

          {/* Matching */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {suggestedTeams.length > 0 ? <><Zap className="w-6 h-6 text-amber-400" /> Top Team Matches</> : <><Users className="w-6 h-6 text-[#22d3ee]" /> Recommended Developers</>}
              </h2>
              <Link href={suggestedTeams.length > 0 ? "/teams" : "/developers"} className="text-[#a78bfa] hover:text-white flex items-center gap-1 font-medium transition-all group">
                Browse more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            {suggestedTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedTeams.map((team) => (
                  <Link key={team.id} href={`/teams?id=${team.id}`} className="glass rounded-3xl p-6 border border-white/5 hover:bg-white/5 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center text-[#a78bfa] group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="badge badge-success text-[10px]">OPEN</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#a78bfa] mb-2 font-bold tracking-widest uppercase">
                      <Trophy className="w-3.5 h-3.5" /> {team.hackathon?.title}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{team.team_name}</h3>
                    <p className="text-sm text-[#94a3b8] line-clamp-2 mb-4 h-10">{team.project_idea || 'Working on something awesome...'}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {team.required_skills?.slice(0, 3).map(skill => (
                        <span key={skill} className="skill-tag text-[10px]">{skill}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs text-[#64748b]">{team.current_members}/{team.max_members} members</span>
                      <span className="text-xs font-bold text-[#a78bfa] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View Team <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : suggestedTeams.length === 0 && !isLookingForMembers ? (
              <div className="glass rounded-3xl p-12 border border-white/5 text-center max-w-lg mx-auto w-full animate-slide-up">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[#64748b] mx-auto mb-6 shadow-xl border border-white/5">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Team Matches</h3>
                <p className="text-[#94a3b8] mb-8 leading-relaxed">
                  Currently, no teams are looking for your specific skill set. 
                  Try adding more skills to your profile to discover more opportunities!
                </p>
                <Link href="/profile" className="btn-primary py-4 px-10 text-lg shadow-lg shadow-[#7c3aed]/20">
                  Update Profile
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedDevelopers.map((developer) => (
                  <div key={developer.id} className="glass rounded-3xl p-6 border border-white/5 text-center group hover:bg-white/[0.03] transition-all">
                    <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform shadow-xl shadow-black/20">
                      {developer.name?.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-white mb-1">{developer.name}</h3>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-tighter mb-4 line-clamp-1">{developer.skills?.join(' • ')}</p>
                    <Link href={`/profile/${developer.id}`} className="text-xs font-bold text-[#a78bfa] hover:text-white transition-colors">
                      View Profile →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Applications for Leaders */}
          {isLeader && pendingApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" /> Pending Applications
              </h2>
              <div className="space-y-3">
                {pendingApps.map((app) => (
                  <div key={app.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{app.user?.name} → <span className="text-[#a78bfa]">{app.team?.team_name}</span></p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.user?.skills?.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
                      </div>
                    </div>
                    <Link href={`/teams/${app.team_id}`} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                      Review <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Invitations Section */}
          {myInvites.length > 0 && (
            <div className="glass rounded-3xl p-8 border border-[#7c3aed]/20 bg-[#7c3aed]/5 relative overflow-hidden animate-slide-up">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <UserCheck className="w-24 h-24 text-[#7c3aed]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-400" />
                Invitations Received
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myInvites.map(invite => (
                  <div key={invite.id} className="bg-[#1e1b2e] border border-white/10 rounded-2xl p-5 space-y-4 relative z-10 group hover:border-[#7c3aed]/50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white mb-1 group-hover:text-[#a78bfa] transition-colors">{invite.team.team_name}</h3>
                        <p className="text-[10px] text-[#64748b] uppercase font-black tracking-widest">{invite.team.hackathon?.title}</p>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-[#7c3aed]/10 text-[#a78bfa] text-[10px] font-bold">INVITED</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] italic line-clamp-2">"{invite.message || 'No message provided'}"</p>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => handleInviteAction(invite.id, 'accepted')}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleInviteAction(invite.id, 'rejected')}
                        className="flex-1 py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 border border-white/10 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Teams */}
          {myTeams.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#a78bfa]" /> My Teams
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTeams.map((team) => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="glass rounded-2xl p-5 card-hover block">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white">{team.team_name}</h3>
                      <span className={`badge ${team.status === 'OPEN' ? 'badge-success' : 'badge-danger'}`}>{team.status}</span>
                    </div>
                    <p className="text-sm text-[#94a3b8] line-clamp-2 mb-3">{team.project_idea || 'No project idea yet'}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm">
                        <UserCheck className="w-4 h-4 text-[#a78bfa]" />
                        <span className="text-[#94a3b8]">{team.current_members}/{team.max_members}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* My Applications */}
          {myApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#22d3ee]" /> My Applications
              </h2>
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
