'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Profile } from '@/lib/supabase';
import { User, Mail, Globe, Save, Zap, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    experience: 'beginner',
    looking_for: 'team',
    github_url: '',
    linkedin_url: '',
    portfolio_link: '',
    team_name: '',
    project_idea: ''
  });

  // Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        bio: profile.bio || '',
        experience: profile.experience || 'beginner',
        looking_for: profile.looking_for || 'team',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_link: profile.portfolio_link || ''
      }));
      setSkills(profile.skills || []);

      // Fetch team data if they are/were a leader
      supabase.from('teams').select('*').eq('created_by', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setFormData(prev => ({
            ...prev,
            team_name: data.team_name || '',
            project_idea: data.project_idea || ''
          }));
        }
      });
    }
  }, [user, profile, router]);

  const [hackathonId, setHackathonId] = useState<string | null>(null);
  useEffect(() => {
    supabase.from('hackathons').select('id').limit(1).then(({ data }) => {
      if (data?.[0]) setHackathonId(data[0].id);
    });
  }, []);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          name: formData.name,
          bio: formData.bio,
          experience: formData.experience,
          looking_for: formData.looking_for,
          role: formData.looking_for === 'members' ? 'team_leader' : 'user',
          github_url: formData.github_url,
          linkedin_url: formData.linkedin_url,
          portfolio_link: formData.portfolio_link,
          skills: skills,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Update or Create Team if they have a team
      if (formData.looking_for === 'members' && hackathonId) {
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('created_by', user.id)
          .maybeSingle();

        const teamPayload = {
          created_by: user.id,
          hackathon_id: hackathonId,
          team_name: formData.team_name || `${formData.name}'s Team`,
          project_idea: formData.project_idea,
          description: formData.bio,
          required_skills: skills,
          updated_at: new Date().toISOString()
        };

        if (existingTeam) {
          await supabase.from('teams').update(teamPayload).eq('id', existingTeam.id);
        } else {
          await supabase.from('teams').insert(teamPayload);
        }
      }

      await refreshProfile();
      setSuccess(true);
      
      // Auto redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      
      <div className="relative z-10 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-xl glass hover:bg-white/5 transition-colors text-[#94a3b8] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-8 h-8 text-[#22d3ee]" />
              Your Profile
            </h1>
            <p className="text-[#94a3b8] mt-1">Complete your profile to get better team matches</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 glass rounded-3xl p-6 sm:p-10">
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 animate-slide-up">
            <CheckCircle2 className="w-5 h-5" />
            Profile updated successfully! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Choice Toggle Moved to Top */}
          <div className="space-y-6 mb-10">
            <div className="glass rounded-2xl p-4 border border-white/5">
              <label className="block text-sm font-bold text-[#64748b] uppercase tracking-widest mb-4 px-2">Your Objective</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, looking_for: 'team'})}
                  className={`py-4 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    formData.looking_for === 'team' 
                      ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#a78bfa] shadow-lg shadow-[#7c3aed]/10' 
                      : 'glass border-white/5 text-[#94a3b8] hover:bg-white/5'
                  }`}
                >
                  <Zap className="w-4 h-4" /> I need a Team
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, looking_for: 'members'})}
                  className={`py-4 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    formData.looking_for === 'members' 
                      ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#22d3ee] shadow-lg shadow-[#06b6d4]/10' 
                      : 'glass border-white/5 text-[#94a3b8] hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" /> I have a Team
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Basic Info - Always shown but simplified */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Basic Info</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Full Name</label>
                <div className="input-with-icon">
                  <User className="input-icon input-icon-left w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="input-field has-icon-left"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Email (Read Only)</label>
                <div className="input-with-icon">
                  <Mail className="input-icon input-icon-left w-5 h-5" />
                  <input
                    type="email"
                    value={user.email}
                    className="input-field has-icon-left opacity-50 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              {formData.looking_for === 'team' && (
                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Your Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    className="input-field min-h-[120px] py-3"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              )}
            </div>

            {/* Conditional Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Details</h2>

              {formData.looking_for === 'team' ? (
                <div className="space-y-6 animate-slide-up">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Experience Level</label>
                    <select
                      value={formData.experience}
                      onChange={e => setFormData({...formData, experience: e.target.value})}
                      className="input-field"
                    >
                      <option value="beginner">Beginner (1st Hackathon)</option>
                      <option value="intermediate">Intermediate (2-3 Hackathons)</option>
                      <option value="advanced">Advanced (4+ Hackathons)</option>
                      <option value="expert">Expert (Serial Winner)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Your Skills (Press Enter to add)</label>
                    <div className="glass rounded-xl p-2 border border-white/5 focus-within:border-[#7c3aed]/50 focus-within:ring-1 focus-within:ring-[#7c3aed]/50 transition-all">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skills.map(skill => (
                          <span key={skill} className="bg-[#7c3aed]/20 text-[#a78bfa] px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-[#7c3aed]/30">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white">&times;</button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="w-full bg-transparent outline-none text-white px-2 py-1 text-sm"
                        placeholder="e.g. React, Python, UI/UX..."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-slide-up">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Team Name</label>
                    <input
                      type="text"
                      value={formData.team_name}
                      onChange={e => setFormData({...formData, team_name: e.target.value})}
                      className="input-field"
                      placeholder="e.g. Code Catalysts"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Project Idea</label>
                    <input
                      type="text"
                      value={formData.project_idea}
                      onChange={e => setFormData({...formData, project_idea: e.target.value})}
                      className="input-field"
                      placeholder="What are you planning to build?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Skills Needed (Press Enter to add)</label>
                    <div className="glass rounded-xl p-2 border border-white/5 focus-within:border-[#06b6d4]/50 focus-within:ring-1 focus-within:ring-[#06b6d4]/50 transition-all">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skills.map(skill => (
                          <span key={skill} className="bg-[#06b6d4]/20 text-[#22d3ee] px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-[#06b6d4]/30">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white">&times;</button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="w-full bg-transparent outline-none text-white px-2 py-1 text-sm"
                        placeholder="e.g. Backend, UI/UX, AI..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-6 pt-6 border-t border-white/5">
            <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Links</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">GitHub</label>
                <div className="input-with-icon">
                  <svg className="input-icon input-icon-left w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={e => setFormData({...formData, github_url: e.target.value})}
                    className="input-field has-icon-left"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">LinkedIn</label>
                <div className="input-with-icon">
                  <svg className="input-icon input-icon-left w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={e => setFormData({...formData, linkedin_url: e.target.value})}
                    className="input-field has-icon-left"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Portfolio</label>
                <div className="input-with-icon">
                  <Globe className="input-icon input-icon-left w-5 h-5" />
                  <input
                    type="url"
                    value={formData.portfolio_link}
                    onChange={e => setFormData({...formData, portfolio_link: e.target.value})}
                    className="input-field has-icon-left"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-8 py-3"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
