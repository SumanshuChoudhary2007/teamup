'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Team, type Application, type Hackathon, type Profile } from '@/lib/supabase';
import { 
  Users, Trophy, Globe, Code, Calendar, ArrowLeft, 
  CheckCircle, XCircle, Clock, Shield, User, MessageSquare,
  AlertCircle, Star, Zap, FileText
} from 'lucide-react';
import TeamChat from '@/components/TeamChat';

export default function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<(Team & { hackathon: Hackathon; creator: Profile }) | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [applications, setApplications] = useState<(Application & { user: Profile })[]>([]);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        // Fetch team with hackathon and creator info
        // Note: Using a joined query to get creator from profiles
        const { data: teamData, error } = await supabase
          .from('teams')
          .select('*, hackathon:hackathons(*), creator:profiles!teams_created_by_fkey(*)')
          .eq('id', id)
          .single();

        if (error || !teamData) {
          console.error('Error fetching team:', error);
          router.push('/dashboard');
          return;
        }

        setTeam(teamData as any);

        // Fetch accepted members via applications
        const { data: memberApps } = await supabase
          .from('applications')
          .select('user:profiles(*)')
          .eq('team_id', id)
          .eq('status', 'accepted');
        
        const memberList = memberApps?.map(a => a.user as unknown as Profile) || [];
        // The creator is always the first member
        const allMembers = [teamData.creator, ...memberList.filter(m => m.id !== teamData.created_by)];
        setMembers(allMembers as Profile[]);

        // Fetch pending applications if current user is leader
        if (user && user.id === teamData.created_by) {
          const { data: pendingApps } = await supabase
            .from('applications')
            .select('*, user:profiles(*)')
            .eq('team_id', id)
            .eq('status', 'pending');
          setApplications((pendingApps || []) as any);
        }

        // Check if current user has an application
        if (user && user.id !== teamData.created_by) {
          const { data: myAppData } = await supabase
            .from('applications')
            .select('*')
            .eq('team_id', id)
            .eq('user_id', user.id)
            .maybeSingle();
          setMyApplication(myAppData);
        }
      } catch (err) {
        console.error('Load Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [id, user, router]);

  const sendNotification = async (recipientId: string, type: string, title: string, message: string) => {
    try {
      await supabase.from('notifications').insert({
        recipient_id: recipientId,
        type,
        title,
        message,
        is_read: false
      });
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !team || myApplication) return;
    
    setActionLoading('applying');
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          team_id: id,
          message: applyMessage,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      setMyApplication(data);
      setShowApplyForm(false);

      // Notify Leader
      await sendNotification(
        team.created_by,
        'application',
        'New Application',
        `${profile?.name || 'Someone'} applied to join ${team.team_name}`
      );

      alert('Application sent successfully!');
    } catch (err: any) {
      console.error('Error applying:', err);
      alert(`Failed to send application: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplication = async (appId: string, status: 'accepted' | 'rejected') => {
    setActionLoading(appId);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', appId);

      if (error) throw error;

      if (status === 'accepted') {
        // Update local member list
        const app = applications.find(a => a.id === appId);
        if (app?.user) setMembers(prev => [...prev, app.user]);
        
        // Increment the member count in the teams table
        await supabase.rpc('increment_team_members', { team_id_input: id });

        // Remove user from developers list by updating their status
        if (app?.user_id) {
          await supabase.from('profiles').update({ looking_for: 'none' }).eq('id', app.user_id);
          
          // Notify Member
          await sendNotification(
            app.user_id,
            'application_accepted',
            'Application Accepted!',
            `Congratulations! You are now a member of ${team?.team_name}`
          );
        }
      }

      setApplications(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      console.error('Error updating application:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const leaveTeam = async () => {
    if (!user || !team || isLeader) return;
    if (!confirm('Are you sure you want to leave this team?')) return;

    setActionLoading('leaving');
    try {
      // Use RPC for atomic leave operation
      const { error } = await supabase.rpc('leave_team_rpc', { team_id_input: id });

      if (error) throw error;

      // Notify Leader
      await sendNotification(
        team.created_by,
        'member_left',
        'Member Left',
        `${profile?.name || 'A member'} has left your team ${team.team_name}`
      );

      window.location.reload();
    } catch (err) {
      console.error('Error leaving team:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (!user || !team || !isLeader || memberId === user.id) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    setActionLoading(memberId);
    try {
      // Use RPC for atomic remove operation
      const { error } = await supabase.rpc('remove_team_member_rpc', { 
        team_id_input: id,
        user_id_input: memberId
      });

      if (error) throw error;

      // Notify Member
      await sendNotification(
        memberId,
        'member_removed',
        'Removed from Team',
        `You have been removed from the team ${team.team_name}`
      );

      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
    </div>
  );

  if (!team) return null;

  const isLeader = user?.id === team.created_by;
  const isMember = members.some(m => m.id === user?.id);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      
      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#7c3aed]/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#06b6d4]/5 blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white mb-8 transition-colors group relative z-10">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Team Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Shield className="w-32 h-32" />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${
                team.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {team.status}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#94a3b8] text-xs font-bold uppercase tracking-widest">
                Team Size: {team.max_members}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              {team.team_name}
            </h1>
            
            <Link href={`/hackathons`} className="inline-flex items-center gap-2 text-[#a78bfa] hover:text-[#c084fc] transition-colors mb-8 bg-[#a78bfa]/5 px-4 py-2 rounded-xl border border-[#a78bfa]/10">
              <Trophy className="w-4 h-4" />
              {team.hackathon?.title}
            </Link>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" /> Project Idea
                </h3>
                <p className="text-xl text-white font-medium leading-relaxed">
                  {team.project_idea || 'Working on an innovative project...'}
                </p>
              </div>

              {team.description && (
                <div>
                  <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#7c3aed]" /> Description
                  </h3>
                  <p className="text-[#94a3b8] leading-relaxed">
                    {team.description}
                  </p>
                </div>
              )}

              {team.required_skills && team.required_skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#06b6d4]" /> Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {team.required_skills.map(skill => (
                      <span key={skill} className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="glass rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-[#a78bfa]" />
              Team Members <span className="text-sm font-normal text-[#64748b]">({members.length}/{team.max_members})</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {members.map((member) => (
                <div key={member.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/20 flex items-center justify-center text-[#a78bfa] font-bold text-lg ring-1 ring-white/10">
                      {member.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold">{member.name}</p>
                        {member.id === team.created_by && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-tighter">Leader</span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] line-clamp-1">{member.skills?.join(' • ') || 'No skills listed'}</p>
                    </div>
                  </div>
                  {isLeader && member.id !== user?.id && (
                    <button 
                      onClick={() => removeMember(member.id, member.name || 'Member')}
                      disabled={!!actionLoading}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Applications */}
        <div className="space-y-8">
          {/* Status Card */}
          <div className="glass rounded-3xl p-6 border border-white/10">
            <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-4">Team Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="text-white font-medium">
                    {team.status === 'OPEN' ? 'Recruiting' : 'Full'}
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${team.status === 'OPEN' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`} />
              </div>
              
              {!isMember && team.status === 'OPEN' && !myApplication && (
                <>
                  {!showApplyForm ? (
                    <button 
                      onClick={() => setShowApplyForm(true)}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                      Apply to Join <MessageSquare className="w-4 h-4" />
                    </button>
                  ) : (
                    <form onSubmit={handleApply} className="space-y-4 animate-slide-up">
                      <textarea
                        value={applyMessage}
                        onChange={(e) => setApplyMessage(e.target.value)}
                        placeholder="Introduce yourself and why you want to join..."
                        className="input-field min-h-[100px] text-sm"
                        required
                      />
                      <div className="flex gap-2">
                        <button 
                          type="submit"
                          disabled={actionLoading === 'applying'}
                          className="btn-primary flex-1 py-3 text-sm"
                        >
                          {actionLoading === 'applying' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Send Request'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowApplyForm(false)}
                          className="btn-secondary px-4 py-3 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {myApplication && !isMember && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-bold mb-1">
                    <Clock className="w-4 h-4" /> Application Pending
                  </div>
                  <p className="text-xs text-[#94a3b8]">The team leader is reviewing your request.</p>
                </div>
              )}

              {isMember && !isLeader && (
                <button 
                  onClick={leaveTeam}
                  disabled={actionLoading === 'leaving'}
                  className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                >
                  {actionLoading === 'leaving' ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <><ArrowLeft className="w-4 h-4" /> Leave Team</>}
                </button>
              )}

              {isMember && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-sm font-medium">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  You are a member of this team
                </div>
              )}
            </div>
          </div>

          {/* Pending Applications (Leader Only) */}
          {isLeader && (
            <div className="glass rounded-3xl p-6 border border-white/10">
              <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Pending Applications
              </h3>
              
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#64748b] text-sm">No pending applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold">
                          {app.user.name?.[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{app.user.name}</p>
                          <p className="text-xs text-[#64748b] line-clamp-1">{app.user.skills?.join(', ') || 'No skills listed'}</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-[#94a3b8] italic">"{app.message || 'No message provided'}"</p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApplication(app.id, 'accepted')}
                          disabled={!!actionLoading}
                          className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          {actionLoading === app.id ? <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Accept</>}
                        </button>
                        <button 
                          onClick={() => handleApplication(app.id, 'rejected')}
                          disabled={!!actionLoading}
                          className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isMember && team && user && (
                <div className="animate-slide-up">
                  <TeamChat teamId={team.id} userId={user.id} leaderId={team.created_by} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
