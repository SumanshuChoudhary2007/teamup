'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Profile } from '@/lib/supabase';
import { User, Mail, Github, Linkedin, Globe, Save, Zap, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
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
    portfolio_link: ''
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
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        experience: profile.experience || 'beginner',
        looking_for: profile.looking_for || 'team',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_link: profile.portfolio_link || ''
      });
      setSkills(profile.skills || []);
    }
  }, [user, profile, router]);

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
        .update({
          name: formData.name,
          bio: formData.bio,
          experience: formData.experience,
          looking_for: formData.looking_for,
          github_url: formData.github_url,
          linkedin_url: formData.linkedin_url,
          portfolio_link: formData.portfolio_link,
          skills: skills,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

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

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Basic Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Basic Info</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Full Name</label>
                <div className="input-with-icon">
                  <User className="input-icon input-icon-left w-5 h-5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="input-field has-icon-left"
                    required
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

              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  className="input-field min-h-[120px] py-3"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Hackathon Preferences */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Preferences</h2>

              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">What are you looking for?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, looking_for: 'team'})}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      formData.looking_for === 'team' 
                        ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#a78bfa]' 
                        : 'glass border-white/5 text-[#94a3b8] hover:bg-white/5'
                    }`}
                  >
                    I need a Team
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, looking_for: 'members'})}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      formData.looking_for === 'members' 
                        ? 'bg-[#06b6d4]/20 border-[#06b6d4] text-[#22d3ee]' 
                        : 'glass border-white/5 text-[#94a3b8] hover:bg-white/5'
                    }`}
                  >
                    I have a Team
                  </button>
                </div>
              </div>

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
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Skills (Press Enter to add)</label>
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
          </div>

          {/* Social Links */}
          <div className="space-y-6 pt-6 border-t border-white/5">
            <h2 className="text-xl font-semibold text-white border-b border-white/5 pb-2">Links</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">GitHub</label>
                <div className="input-with-icon">
                  <Github className="input-icon input-icon-left w-5 h-5" />
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
                  <Linkedin className="input-icon input-icon-left w-5 h-5" />
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
