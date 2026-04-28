'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, type Profile, type Team } from '@/lib/supabase';
import { 
  User, Mail, Globe, Github, Linkedin, ArrowLeft, 
  Loader2, Sparkles, Code, Briefcase, Zap, 
  ExternalLink, MessageSquare, Trophy
} from 'lucide-react';
import Link from 'next/link';

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
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

        // Fetch teams they belong to
        const { data: teamData } = await supabase
          .from('teams')
          .select('*, hackathon:hackathons(*)')
          .eq('created_by', id);
        
        setTeams(teamData || []);

      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError('Profile not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

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
            <a href={`mailto:${profile.email}`} className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4" /> Message
            </a>
          </div>
        </div>

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
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" className="p-3 rounded-xl glass hover:bg-white/10 transition-all text-[#94a3b8] hover:text-white">
                    <Linkedin className="w-5 h-5" />
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
                {profile.bio || "No description provided yet. This hacker is busy building the future!"}
              </p>
            </div>

            {/* Skills */}
            <div className="glass rounded-3xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-[#22d3ee]" /> 
                {profile.looking_for === 'members' ? 'Skills Needed' : 'Tech Stack'}
              </h2>
              <div className="flex flex-wrap gap-3">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map(skill => (
                    <span 
                      key={skill} 
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105 ${
                        profile.looking_for === 'members' 
                          ? 'bg-[#06b6d4]/10 border-[#06b6d4]/20 text-[#22d3ee]' 
                          : 'bg-[#7c3aed]/10 border-[#7c3aed]/20 text-[#a78bfa]'
                      }`}
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
