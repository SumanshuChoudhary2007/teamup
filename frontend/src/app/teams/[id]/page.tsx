'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Team, type Application, type Hackathon, type Profile } from '@/lib/supabase';
import { 
  Users, Trophy, Globe, Code, Calendar, ArrowLeft, 
  CheckCircle, XCircle, Clock, Shield, User, MessageSquare,
  AlertCircle, Star, Zap, FileText, Pencil, Check, X as XIcon
} from 'lucide-react';
import TeamChat from '@/components/TeamChat';

export default function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<(Team & { hackathon: Hackathon; creator: Profile }) | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [pendingApps, setPendingApps] = useState<(Application & { user: Profile })[]>([]);
  const [rejectedApps, setRejectedApps] = useState<(Application & { user: Profile })[]>([]);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  // Edit state
  const [editingName, setEditingName] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(false);
  const [editingProjectIdea, setEditingProjectIdea] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedHackathonId, setEditedHackathonId] = useState('');
  const [editedProjectIdea, setEditedProjectIdea] = useState('');
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);

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

        // Fetch applications if current user is leader OR ADMIN
        if (user && (user.id === teamData.created_by || profile?.is_admin)) {
          const { data: allApps } = await supabase
            .from('applications')
            .select('*, user:profiles(*)')
            .eq('team_id', id);
          
          const apps = (allApps || []) as any;
          setPendingApps(apps.filter((a: any) => a.status === 'pending'));
          setRejectedApps(apps.filter((a: any) => a.status === 'rejected'));
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
    // Fetch all hackathons for the edit dropdown
    supabase.from('hackathons').select('*').order('date', { ascending: true }).then(({ data }) => {
      setAllHackathons((data || []) as Hackathon[]);
    });
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

  const handleApplication = async (appId: string, status: 'accepted' | 'rejected' | 'pending') => {
    setActionLoading(appId);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', appId);

      if (error) throw error;

      if (status === 'accepted') {
        const app = pendingApps.find(a => a.id === appId);
        if (app?.user) setMembers(prev => [...prev, app.user]);
        
        // Trigger handle_app_status_change via DB trigger (we already set this up)
        
        if (app?.user_id) {
          await supabase.from('profiles').update({ looking_for: 'none' }).eq('id', app.user_id);
          
          await sendNotification(
            app.user_id,
            'application_accepted',
            'Application Accepted!',
            `Congratulations! You are now a member of ${team?.team_name}`
          );
        }
      } else if (status === 'rejected') {
        const app = pendingApps.find(a => a.id === appId);
        if (app) {
          await sendNotification(
            app.user_id,
            'application_rejected',
            'Application Rejected',
            `Sorry, your application to join ${team?.team_name} was not accepted.`
          );
        }
      }

      // Refresh applications locally
      if (status === 'pending') {
        // This is an UNDO
        const app = rejectedApps.find(a => a.id === appId);
        if (app) {
          setRejectedApps(prev => prev.filter(a => a.id !== appId));
          setPendingApps(prev => [...prev, { ...app, status: 'pending' }]);
        }
      } else if (status === 'accepted') {
        setPendingApps(prev => prev.filter(a => a.id !== appId));
      } else if (status === 'rejected') {
        const app = pendingApps.find(a => a.id === appId);
        setPendingApps(prev => prev.filter(a => a.id !== appId));
        if (app) setRejectedApps(prev => [...prev, { ...app, status: 'rejected' }]);
      }
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
    } catch (err: any) {
      console.error('Error leaving team:', err);
      alert(`Failed to leave team: ${err.message || 'Unknown error'}`);
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
    } catch (err: any) {
      console.error('Error removing member:', err);
      alert(`Failed to remove member: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTeam = async () => {
    if (!user || !team || !isLeader) return;
    if (!confirm('CRITICAL: This will permanently delete your team, all members, chat history, and applications. This cannot be undone. Are you sure?')) return;

    setActionLoading('deleting');
    try {
      // 1. Notify all members first
      const memberIds = members.filter(m => m.id !== user.id).map(m => m.id);
      if (memberIds.length > 0) {
        const notifications = memberIds.map(mId => ({
          recipient_id: mId,
          type: 'team_deleted',
          title: 'Team Dissolved',
          message: `The team "${team.team_name}" has been deleted by the leader.`,
        }));
        await supabase.from('notifications').insert(notifications);
      }

      // 2. Delete the team (Cascades to applications and messages)
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Team deleted successfully.');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error deleting team:', err);
      alert(`Failed to delete team: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const saveTeamEdits = async (field: 'team_name' | 'hackathon_id' | 'project_idea') => {
    if (!team) return;
    if (field === 'team_name') {
      const trimmed = editedName.trim();
      if (!trimmed) return;
      const { error } = await supabase.from('teams').update({ team_name: trimmed }).eq('id', team.id);
      if (!error) { setTeam(prev => prev ? { ...prev, team_name: trimmed } : prev); }
      setEditingName(false);
    } else if (field === 'project_idea') {
      const trimmed = editedProjectIdea.trim();
      if (!trimmed) return;
      const { error } = await supabase.from('teams').update({ project_idea: trimmed }).eq('id', team.id);
      if (!error) { setTeam(prev => prev ? { ...prev, project_idea: trimmed } : prev); }
      setEditingProjectIdea(false);
    } else {
      const { data: h, error } = await supabase
        .from('hackathons').select('*').eq('id', editedHackathonId).single();
      if (!error && h) {
        await supabase.from('teams').update({ hackathon_id: editedHackathonId }).eq('id', team.id);
        setTeam(prev => prev ? { ...prev, hackathon_id: editedHackathonId, hackathon: h as Hackathon } : prev);
      }
      setEditingHackathon(false);
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
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
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

            {/* Team Name */}
            {editingName && (isLeader || profile?.is_admin) ? (
              <div className="flex items-center gap-2 mb-4">
                <input
                  autoFocus
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  className="text-3xl sm:text-4xl font-black bg-white/5 border border-[#7c3aed]/40 rounded-xl px-4 py-2 text-white outline-none flex-1"
                />
                <button onClick={() => saveTeamEdits('team_name')} className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"><Check className="w-5 h-5" /></button>
                <button onClick={() => setEditingName(false)} className="p-2 rounded-xl bg-white/5 text-[#94a3b8] hover:bg-white/10 transition-colors"><XIcon className="w-5 h-5" /></button>
              </div>
            ) : (
              <div className="flex items-start gap-3 mb-4 group/name">
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  {team.team_name}
                </h1>
                {(isLeader || profile?.is_admin) && (
                  <button
                    onClick={() => { setEditedName(team.team_name); setEditingName(true); }}
                    className="mt-2 p-1.5 rounded-lg bg-white/5 text-[#64748b] hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover/name:opacity-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Hackathon */}
            {editingHackathon && (isLeader || profile?.is_admin) ? (
              <div className="flex items-center gap-2 mb-8">
                <select
                  value={editedHackathonId}
                  onChange={e => setEditedHackathonId(e.target.value)}
                  className="flex-1 bg-[#1e1b2e] border border-[#7c3aed]/40 rounded-xl px-4 py-2 text-white outline-none"
                >
                  {allHackathons.map(h => (
                    <option key={h.id} value={h.id} style={{ background: '#1e1b2e' }}>{h.title}</option>
                  ))}
                </select>
                <button onClick={() => saveTeamEdits('hackathon_id')} className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"><Check className="w-5 h-5" /></button>
                <button onClick={() => setEditingHackathon(false)} className="p-2 rounded-xl bg-white/5 text-[#94a3b8] hover:bg-white/10 transition-colors"><XIcon className="w-5 h-5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-8 group/hack">
                <Link href={`/hackathons`} className="inline-flex items-center gap-2 text-[#a78bfa] hover:text-[#c084fc] transition-colors bg-[#a78bfa]/5 px-4 py-2 rounded-xl border border-[#a78bfa]/10">
                  <Trophy className="w-4 h-4" />
                  {team.hackathon?.title}
                </Link>
                {(profile?.is_admin) && (
                  <button
                    onClick={() => { setEditedHackathonId(team.hackathon_id || ''); setEditingHackathon(true); }}
                    className="p-1.5 rounded-lg bg-white/5 text-[#64748b] hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover/hack:opacity-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" /> Project Idea
                  {(isLeader || profile?.is_admin) && !editingProjectIdea && (
                    <button
                      onClick={() => { setEditedProjectIdea(team.project_idea || ''); setEditingProjectIdea(true); }}
                      className="ml-1 p-1 rounded-lg bg-white/5 text-[#64748b] hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </h3>
                {editingProjectIdea && (isLeader || profile?.is_admin) ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={editedProjectIdea}
                      onChange={e => setEditedProjectIdea(e.target.value)}
                      rows={3}
                      className="w-full bg-white/5 border border-[#7c3aed]/40 rounded-xl px-4 py-3 text-white outline-none resize-none text-lg"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveTeamEdits('project_idea')} className="px-4 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-bold transition-colors flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
                      <button onClick={() => setEditingProjectIdea(false)} className="px-4 py-1.5 rounded-xl bg-white/5 text-[#94a3b8] hover:bg-white/10 text-sm font-bold transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl text-white font-medium leading-relaxed">
                    {team.project_idea || 'Working on an innovative project...'}
                  </p>
                )}
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
                  <Link href={`/profile/${member.id}`} className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/20 flex items-center justify-center text-[#a78bfa] font-bold text-lg ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                      {member.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold group-hover:text-[#a78bfa] transition-colors">{member.name}</p>
                        {member.id === team.created_by && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-tighter">Leader</span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] line-clamp-1">{member.skills?.join(' • ') || 'No skills listed'}</p>
                    </div>
                  </Link>
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
                <div className={`p-4 rounded-2xl border text-center ${
                  myApplication.status === 'rejected' 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <div className={`flex items-center justify-center gap-2 font-bold mb-1 ${
                    myApplication.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {myApplication.status === 'rejected' ? (
                      <><XCircle className="w-4 h-4" /> Application Rejected</>
                    ) : (
                      <><Clock className="w-4 h-4" /> Application Pending</>
                    )}
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    {myApplication.status === 'rejected' 
                      ? 'The team leader has rejected your application.' 
                      : 'The team leader is reviewing your request.'}
                  </p>
                  {myApplication.status === 'rejected' && (
                    <div className="mt-3 py-1.5 px-3 rounded-lg bg-red-500/10 border border-red-500/20 inline-flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                      <AlertCircle className="w-3 h-3" /> Re-applications not allowed
                    </div>
                  )}
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
              {isLeader && (
                <button 
                  onClick={deleteTeam}
                  disabled={actionLoading === 'deleting'}
                  className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-sm font-bold mt-4"
                >
                  {actionLoading === 'deleting' ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <><XCircle className="w-4 h-4" /> Delete Team</>}
                </button>
              )}
            </div>
          </div>

          {/* Pending Applications (Leader or Admin Only) */}
          {(isLeader || profile?.is_admin) && (
            <div className="space-y-6">
              <div className="glass rounded-3xl p-6 border border-white/10">
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Pending Applications
                </h3>
                
                {pendingApps.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#64748b] text-sm">No pending applications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApps.map((app) => (
                      <div key={app.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                        <Link href={`/profile/${app.user_id}`} className="flex items-center gap-3 group/user flex-1">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold group-hover/user:scale-105 transition-transform">
                            {app.user.name?.[0]}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm group-hover/user:text-[#a78bfa] transition-colors">{app.user.name}</p>
                            <p className="text-xs text-[#64748b] line-clamp-1">{app.user.skills?.join(', ') || 'No skills listed'}</p>
                          </div>
                        </Link>
                        
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
              </div>

              {/* Rejected Applications (Leader Only) */}
              {rejectedApps.length > 0 && (
                <div className="glass rounded-3xl p-6 border border-red-500/10 bg-red-500/[0.02]">
                  <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" /> Rejected Applicants
                  </h3>
                  <div className="space-y-3">
                    {rejectedApps.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group">
                        <Link href={`/profile/${app.user_id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white font-bold">
                            {app.user.name?.[0]}
                          </div>
                          <p className="text-sm text-[#94a3b8] group-hover:text-white transition-colors">{app.user.name}</p>
                        </Link>
                        <button 
                          onClick={() => handleApplication(app.id, 'pending')}
                          disabled={!!actionLoading}
                          className="text-[10px] font-bold text-[#7c3aed] hover:text-[#a78bfa] transition-colors uppercase tracking-widest"
                        >
                          {actionLoading === app.id ? 'Undoing...' : 'Undo Reject'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team Chat (For all Members) */}
          {isMember && team && user && (
            <div className="animate-slide-up mt-8">
              <TeamChat teamId={team.id} userId={user.id} leaderId={team.created_by} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
