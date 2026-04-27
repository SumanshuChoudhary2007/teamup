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
      const { data: teams } = await supabase
        .from('teams')
        .select('*, hackathon:hackathons(*)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      setMyTeams((teams || []) as Team[]);

      // My applications
      const { data: apps } = await supabase
        .from('applications')
        .select('*, team:teams(*, hackathon:hackathons(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMyApps((apps || []) as typeof myApps);

      // Applications to my teams (for team leaders)
      if (profile?.role === 'team_leader' || profile?.role === 'admin') {
        const { data: pending } = await supabase
          .from('applications')
          .select('*, user:profiles(name, skills), team:teams(team_name)')
          .eq('status', 'pending')
          .in('team_id', (teams || []).map(t => t.id));
        setPendingApps((pending || []) as typeof pendingApps);
      }
      setLoading(false);
    };
    load();
  }, [user, profile]);

  if (authLoading || !user) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;

  const isLeader = profile?.role === 'team_leader' || profile?.role === 'admin';

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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative z-10 space-y-8">
          {/* Stats cards */}
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

          {/* Pending applications for leaders */}
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
                      <span className="text-xs text-[#64748b]">{team.max_members - team.current_members} spots left</span>
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
