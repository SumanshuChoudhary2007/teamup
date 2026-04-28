'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type Profile, type Team } from '@/lib/supabase';
import { 
  User, Mail, Globe, ArrowLeft, 
  Loader2, Sparkles, Code, Briefcase, Zap, 
  ExternalLink, MessageSquare, Trophy
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Send, X } from 'lucide-react';

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setProfile(data as Profile);

        // Fetch teams they created
        const { data: createdTeams } = await supabase
          .from('teams')
          .select('*, hackathon:hackathons(*)')
          .eq('created_by', id);
        
        // Fetch teams they joined
        const { data: joinedApps } = await supabase
          .from('applications')
          .select('team:teams(*, hackathon:hackathons(*))')
          .eq('user_id', id)
          .eq('status', 'accepted');

        const joinedTeams = joinedApps?.map(a => a.team).filter(Boolean) || [];
        
        // Merge and remove duplicates
        const allTeams = [...(createdTeams || [])];
        joinedTeams.forEach((t: any) => {
          if (!allTeams.find(at => at.id === t.id)) {
            allTeams.push(t);
          }
        });
        
        setTeams(allTeams as Team[]);

        // If current user is a leader, fetch their teams for invitation
        if (currentUser && (currentProfile?.role === 'team_leader' || currentProfile?.is_admin)) {
          const { data: leaderTeams } = await supabase
            .from('teams')
            .select('*')
            .eq('created_by', currentUser.id)
            .eq('status', 'OPEN');
          setMyTeams(leaderTeams || []);
        }

      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError('Profile not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleInvite = async () => {
    if (!selectedTeam || !id || !currentUser) return;
    setInviteLoading(true);
    try {
      const { error } = await supabase.from('applications').insert({
        team_id: selectedTeam,
        user_id: id,
        message: inviteMsg,
        status: 'invited'
      });

      if (error) throw error;

      // Notify User
      const team = myTeams.find(t => t.id === selectedTeam);
      await supabase.from('notifications').insert({
        recipient_id: id,
        type: 'team_invite',
        title: 'Team Invitation',
        message: `You have been invited to join "${team?.team_name}" by ${currentProfile?.name}`,
        link: '/dashboard'
      });

      alert('Invitation sent successfully!');
      setInviting(false);
      setInviteMsg('');
      setSelectedTeam('');
    } catch (err: any) {
      console.error('Invite Error:', err);
      alert(`Failed to send invite: ${err.message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0c1d]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#7c3aed] animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8] animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0c1d] px-4">
        <div className="glass p-10 rounded-3xl text-center max-w-md">
          <User className="w-16 h-16 text-[#64748b] mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-[#94a3b8] mb-8">The user you're looking for doesn't exist or has a private profile.</p>
          <button onClick={() => router.back()} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#7c3aed]/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#06b6d4]/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 rounded-xl glass hover:bg-white/5 transition-colors text-[#94a3b8] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-3">
            {currentUser && currentUser.id !== id && (currentProfile?.role === 'team_leader' || currentProfile?.is_admin) && (
              <button 
                onClick={() => setInviting(true)}
                className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" /> Invite to Team
              </button>
            )}
            <a href={`mailto:${profile.email}`} className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4" /> Message
            </a>
          </div>
        </div>

        {/* Invite Modal */}
        {inviting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInviting(false)} />
            <div className="glass-strong rounded-3xl p-8 w-full max-w-md relative z-10 animate-scale-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#7c3aed]" />
                  Invite to Team
                </h2>
                <button onClick={() => setInviting(false)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-[#64748b] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase tracking-widest mb-3">Select Team</label>
                  {myTeams.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      You don't have any open teams to invite members to.
                    </div>
                  ) : (
                    <select 
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Choose a team...</option>
                      {myTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.team_name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#64748b] uppercase tracking-widest mb-3">Personal Message (Optional)</label>
                  <textarea
                    value={inviteMsg}
                    onChange={(e) => setInviteMsg(e.target.value)}
                    placeholder="Tell them why you want them on your team..."
                    className="input-field w-full min-h-[100px] text-sm"
                  />
                </div>

                <button 
                  onClick={handleInvite}
                  disabled={!selectedTeam || inviteLoading || myTeams.length === 0}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                >
                  {inviteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Invitation</>}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Personal Info */}
          <div className="space-y-8">
            <div className="glass rounded-3xl p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7c3aed]/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative mx-auto w-32 h-32 mb-6">
                <div className="w-full h-full rounded-2xl gradient-bg flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-black/40 ring-4 ring-white/5">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    profile.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-[#1e1b2e] rounded-xl border border-white/10 shadow-xl">
                  {profile.looking_for === 'members' ? (
                    <Trophy className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Zap className="w-5 h-5 text-[#22d3ee]" />
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
              <p className="text-[#a78bfa] text-xs font-black tracking-[0.2em] uppercase mb-6">
                {profile.role?.replace('_', ' ')}
              </p>

              <div className="flex justify-center gap-3">
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" className="p-3 rounded-xl glass hover:bg-white/10 transition-all text-[#94a3b8] hover:text-white">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" className="p-3 rounded-xl glass hover:bg-white/10 transition-all text-[#94a3b8] hover:text-white">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {profile.portfolio_link && (
                  <a href={profile.portfolio_link} target="_blank" className="p-3 rounded-xl glass hover:bg-white/10 transition-all text-[#94a3b8] hover:text-white">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div className="glass rounded-3xl p-8 space-y-6">
              <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#94a3b8] text-sm">Experience</span>
                  <span className="text-white text-sm font-medium capitalize">{profile.experience || 'Beginner'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94a3b8] text-sm">Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${profile.looking_for === 'members' ? 'bg-[#06b6d4]/10 text-[#22d3ee]' : 'bg-[#7c3aed]/10 text-[#a78bfa]'}`}>
                    {profile.looking_for === 'members' ? 'Leading a Team' : 'Looking for Team'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94a3b8] text-sm">Member Since</span>
                  <span className="text-white text-sm font-medium">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <div className="glass rounded-3xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-400" /> 
                {profile.looking_for === 'members' ? 'Team Vision' : 'About Me'}
              </h2>
              <p className="text-[#94a3b8] leading-relaxed text-lg whitespace-pre-wrap">
                {profile.bio || "No description provided yet. This developer is busy building the future!"}
              </p>
            </div>

            {/* Skills */}
            <div className="glass rounded-3xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-[#22d3ee]" /> 
                {profile.looking_for === 'members' ? "Leader's Skills" : 'Tech Stack'}
              </h2>
              <div className="flex flex-wrap gap-3">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map(skill => (
                    <span 
                      key={skill} 
                      className="px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 bg-[#7c3aed]/10 border-[#7c3aed]/20 text-[#a78bfa]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-[#64748b] italic">No skills listed yet.</p>
                )}
              </div>
            </div>

            {/* Teams */}
            {teams.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 px-2">
                  <Trophy className="w-6 h-6 text-amber-400" /> Current Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map(team => (
                    <Link 
                      key={team.id} 
                      href={`/teams/${team.id}`}
                      className="glass rounded-2xl p-6 border border-white/5 hover:bg-white/[0.03] transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white group-hover:text-[#a78bfa] transition-colors">{team.team_name}</h3>
                        <ExternalLink className="w-4 h-4 text-[#64748b]" />
                      </div>
                      <p className="text-sm text-[#94a3b8] line-clamp-2 mb-4 h-10">{team.project_idea || 'Working on something awesome...'}</p>
                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#64748b]">
                          {(team as any).hackathon?.title}
                        </span>
                        <span className="badge badge-success text-[10px]">ACTIVE</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
