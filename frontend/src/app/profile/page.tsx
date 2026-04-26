'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Save, Plus, X, Code, Briefcase, Globe } from 'lucide-react';

const EXP_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const COMMON_SKILLS = ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Python', 'Node.js', 'Rust', 'Go', 'Java', 'Flutter', 'Swift', 'Kotlin', 'Vue.js', 'Angular', 'Django', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Firebase', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'TailwindCSS', 'Figma', 'UI/UX', 'Machine Learning', 'AI', 'Blockchain', 'Web3', 'Solidity', 'DevOps', 'Git'];

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experience, setExperience] = useState<typeof EXP_LEVELS[number]>('beginner');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminReason, setAdminReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setSkills(profile.skills || []);
      setExperience(profile.experience || 'beginner');
      setPortfolioLink(profile.portfolio_link || '');
      setGithubUrl(profile.github_url || '');
      setLinkedinUrl(profile.linkedin_url || '');
    }
  }, [profile]);

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ name, bio, skills, experience, portfolio_link: portfolioLink, github_url: githubUrl, linkedin_url: linkedinUrl })
      .eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAdminRequest = async () => {
    if (!user || !adminReason.trim()) return;
    setRequesting(true);
    const { error } = await supabase
      .from('admin_requests')
      .insert({ user_id: user.id, reason: adminReason.trim(), status: 'pending' });
    
    if (!error) {
      setRequestSent(true);
      setAdminReason('');
    }
    setRequesting(false);
  };

  if (authLoading || !user) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-[#a78bfa]" /> Edit Profile
        </h1>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 pb-6 border-b border-white/5">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : name.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your name" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" /> Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="input-field min-h-[100px] resize-y"
              placeholder="Tell us about yourself, your experience, and what you're looking for..."
            />
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Experience Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXP_LEVELS.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setExperience(lvl)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all capitalize ${
                    experience === lvl
                      ? 'gradient-bg text-white'
                      : 'glass-light text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">
              <Code className="w-4 h-4 inline mr-1" /> Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map(s => (
                <span key={s} className="badge badge-primary flex items-center gap-1">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                className="input-field flex-1"
                placeholder="Add a skill..."
              />
              <button onClick={() => addSkill(newSkill)} className="btn-secondary px-3"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {COMMON_SKILLS.filter(s => !skills.includes(s)).slice(0, 12).map(s => (
                <button key={s} onClick={() => addSkill(s)} className="skill-tag hover:bg-[#7c3aed]/20 cursor-pointer transition-all">
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                <Globe className="w-4 h-4 inline mr-1" /> GitHub
              </label>
              <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="input-field" placeholder="https://github.com/you" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" /> LinkedIn
              </label>
              <input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className="input-field" placeholder="https://linkedin.com/in/you" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">
              <Globe className="w-4 h-4 inline mr-1" /> Portfolio
            </label>
            <input value={portfolioLink} onChange={e => setPortfolioLink(e.target.value)} className="input-field" placeholder="https://your-portfolio.com" />
          </div>

          {/* Save */}
          <div className="flex items-center gap-4 pt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 py-3 px-6">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {saved && <span className="text-emerald-400 text-sm font-medium animate-fade-in">✓ Profile saved!</span>}
          </div>
        </div>

        {/* Admin Request Section */}
        {profile?.role === 'user' && (
          <div className="mt-8 glass rounded-2xl p-6 sm:p-8 border border-amber-500/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" /> Request Admin Access
            </h2>
            <p className="text-sm text-[#94a3b8] mb-6">
              Apply to become an administrator. Your request will be reviewed by the Super Admin.
            </p>
            
            {requestSent ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
                Your request has been submitted and is currently pending approval.
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={adminReason}
                  onChange={e => setAdminReason(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="Why do you need admin access?"
                />
                <button 
                  onClick={handleAdminRequest}
                  disabled={requesting || !adminReason.trim()}
                  className="btn-secondary w-full py-3 text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-500/50"
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
