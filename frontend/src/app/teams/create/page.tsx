'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Hackathon } from '@/lib/supabase';
import { Users, Plus, X, Trophy, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

const COMMON_SKILLS = ['React','Next.js','TypeScript','JavaScript','Python','Node.js','Rust','Go','Java','Flutter','Swift','Kotlin','Vue.js','Django','FastAPI','PostgreSQL','MongoDB','Firebase','AWS','Docker','GraphQL','TailwindCSS','Figma','UI/UX','Machine Learning','AI','Blockchain','Web3','Solidity','DevOps'];

type PreMember = {
  name: string;
  experience: string;
  skills: string[];
  skillInput: string;
  github: string;
  linkedin: string;
  portfolio: string;
  email: string;
};

function CreateTeamForm() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedHackathon = searchParams.get('hackathon');

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [hackathonId, setHackathonId] = useState(preselectedHackathon || '');
  const [teamName, setTeamName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [description, setDescription] = useState('');
  const [currentMembers, setCurrentMembers] = useState(1);
  const [neededMembers, setNeededMembers] = useState(3);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-existing member details (currentMembers - 1, since leader fills their own profile)
  const [preMembers, setPreMembers] = useState<PreMember[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    const isLeader = profile?.role === 'team_leader' || profile?.role === 'admin';
    if (!authLoading && profile && !isLeader) router.push('/dashboard');
  }, [authLoading, profile, router]);

  useEffect(() => {
    supabase.from('hackathons').select('id,title,date').order('date', { ascending: true }).then(({ data }) => {
      setHackathons((data || []) as Hackathon[]);
    });
  }, []);

  // Sync preMembers array length whenever currentMembers changes
  useEffect(() => {
    const extraCount = Math.max(0, currentMembers - 1); // exclude leader
    setPreMembers(prev => {
      if (extraCount > prev.length) {
        // Add empty slots
        const extras: PreMember[] = Array.from({ length: extraCount - prev.length }, () => ({
          name: '', experience: 'beginner', skills: [], skillInput: '',
          github: '', linkedin: '', portfolio: '', email: ''
        }));
        return [...prev, ...extras];
      }
      // Trim if reduced
      return prev.slice(0, extraCount);
    });
  }, [currentMembers]);

  const updateMember = (idx: number, field: keyof PreMember, value: any) => {
    setPreMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const addMemberSkill = (idx: number) => {
    const input = preMembers[idx].skillInput.trim();
    if (!input || preMembers[idx].skills.includes(input)) { updateMember(idx, 'skillInput', ''); return; }
    setPreMembers(prev => prev.map((m, i) => i === idx ? { ...m, skills: [...m.skills, input], skillInput: '' } : m));
  };

  const removeMemberSkill = (idx: number, skill: string) => {
    setPreMembers(prev => prev.map((m, i) => i === idx ? { ...m, skills: m.skills.filter(s => s !== skill) } : m));
  };

  const addSkill = (s: string) => {
    const sk = s.trim();
    if (sk && !skills.includes(sk)) setSkills([...skills, sk]);
    setNewSkill('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathonId) { setError('Please select a hackathon'); return; }
    if (!teamName.trim()) { setError('Team name is required'); return; }

    // Validate pre-existing members have names
    for (let i = 0; i < preMembers.length; i++) {
      if (!preMembers[i].name.trim()) {
        setError(`Please enter a name for Member ${i + 2}`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    const cleanedPreMembers = preMembers.map(m => ({
      name: m.name.trim(),
      experience: m.experience,
      skills: m.skills,
      github: m.github.trim(),
      linkedin: m.linkedin.trim(),
      portfolio: m.portfolio.trim(),
      email: m.email.trim(),
    }));

    const { data, error: err } = await supabase
      .from('teams')
      .insert({
        hackathon_id: hackathonId,
        team_name: teamName.trim(),
        project_idea: projectIdea.trim(),
        description: description.trim(),
        max_members: currentMembers + neededMembers,
        current_members: currentMembers,
        required_skills: skills,
        pre_existing_members: cleanedPreMembers,
        created_by: user!.id,
        status: neededMembers > 0 ? 'OPEN' : 'FULL',
      })
      .select()
      .single();
    if (err) { setError(err.message); setSubmitting(false); return; }
    router.push(`/teams/${data.id}`);
  };

  if (authLoading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="relative z-10">
        <Link href="/teams" className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Teams
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-[#a78bfa]" /> Create a Team
        </h1>

        <div className="glass rounded-2xl p-6 sm:p-8">
          {error && <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Hackathon select */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                <Trophy className="w-4 h-4 inline mr-1" /> Hackathon *
              </label>
              <select value={hackathonId} onChange={e => setHackathonId(e.target.value)} className="input-field" required>
                <option value="">Select a hackathon...</option>
                {hackathons.map(h => (
                  <option key={h.id} value={h.id} style={{ background: '#1e1b2e' }}>
                    {h.title} {h.date ? `(${new Date(h.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Team Name *</label>
              <input value={teamName} onChange={e => setTeamName(e.target.value)} className="input-field" placeholder="e.g. CodeCatalysts" required />
            </div>

            {/* Project Idea */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Project Idea</label>
              <input value={projectIdea} onChange={e => setProjectIdea(e.target.value)} className="input-field" placeholder="A short summary of what you want to build..." />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field min-h-[100px] resize-y" placeholder="Describe your vision, goals, and what kind of teammates you're looking for..." />
            </div>

            {/* Members already in team */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Members already in team</label>
                <input
                  type="number" min={1} max={10} value={currentMembers}
                  onChange={e => setCurrentMembers(Number(e.target.value))}
                  className="input-field" placeholder="e.g. 1" required
                />
                <p className="text-[10px] text-[#64748b] mt-1">Including yourself</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Additional members needed</label>
                <input
                  type="number" min={0} max={10} value={neededMembers}
                  onChange={e => setNeededMembers(Number(e.target.value))}
                  className="input-field" placeholder="e.g. 3" required
                />
                <p className="text-[10px] text-[#64748b] mt-1">Number of spots open for applicants</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#7c3aed]/5 border border-[#7c3aed]/20">
              <p className="text-xs text-[#a78bfa] flex items-center justify-between">
                <span>Total Team Capacity:</span>
                <span className="font-bold text-white">{currentMembers + neededMembers}</span>
              </p>
            </div>

            {/* Pre-existing member details (skip leader = index 0) */}
            {preMembers.length > 0 && (
              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-bold text-[#64748b] uppercase tracking-widest">Current Team Members</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="text-xs text-[#64748b] -mt-2">
                  You (the leader) are Member 1. Fill details for the other {preMembers.length} member{preMembers.length > 1 ? 's' : ''} already on your team.
                </p>

                {preMembers.map((member, idx) => (
                  <div key={idx} className="glass rounded-2xl p-5 border border-[#06b6d4]/20 bg-[#06b6d4]/5 space-y-4">
                    <h3 className="text-sm font-bold text-[#22d3ee] flex items-center gap-2">
                      <User className="w-4 h-4" /> Member {idx + 2}
                    </h3>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-medium text-[#94a3b8] mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={e => updateMember(idx, 'name', e.target.value)}
                        className="input-field"
                        placeholder={`Member ${idx + 2}'s name`}
                        required
                      />
                    </div>

                    {/* Experience */}
                    <div>
                      <label className="block text-xs font-medium text-[#94a3b8] mb-1">Experience Level</label>
                      <select
                        value={member.experience}
                        onChange={e => updateMember(idx, 'experience', e.target.value)}
                        className="input-field"
                      >
                        <option value="beginner">Beginner (1st Hackathon)</option>
                        <option value="intermediate">Intermediate (2–3 Hackathons)</option>
                        <option value="advanced">Advanced (4+ Hackathons)</option>
                        <option value="expert">Expert (Serial Winner)</option>
                      </select>
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-xs font-medium text-[#94a3b8] mb-1">Their Skills (Press Enter to add)</label>
                      <div className="glass rounded-xl p-2 border border-white/5 focus-within:border-[#06b6d4]/50 transition-all">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {member.skills.map(s => (
                            <span key={s} className="bg-[#06b6d4]/20 text-[#22d3ee] px-3 py-0.5 rounded-full text-xs flex items-center gap-1 border border-[#06b6d4]/30">
                              {s}
                              <button type="button" onClick={() => removeMemberSkill(idx, s)} className="hover:text-white">&times;</button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={member.skillInput}
                          onChange={e => updateMember(idx, 'skillInput', e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMemberSkill(idx); } }}
                          className="w-full bg-transparent outline-none text-white px-2 py-1 text-sm"
                          placeholder="e.g. React, Python..."
                        />
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1">GitHub URL</label>
                        <input
                          type="url"
                          value={member.github}
                          onChange={e => updateMember(idx, 'github', e.target.value)}
                          className="input-field text-sm"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1">LinkedIn URL</label>
                        <input
                          type="url"
                          value={member.linkedin}
                          onChange={e => updateMember(idx, 'linkedin', e.target.value)}
                          className="input-field text-sm"
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Portfolio URL</label>
                        <input
                          type="url"
                          value={member.portfolio}
                          onChange={e => updateMember(idx, 'portfolio', e.target.value)}
                          className="input-field text-sm"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Email</label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={e => updateMember(idx, 'email', e.target.value)}
                          className="input-field text-sm"
                          placeholder="member@email.com"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Required Skills (for new applicants)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map(s => (
                  <span key={s} className="badge badge-primary flex items-center gap-1">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter(sk => sk !== s))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                  className="input-field flex-1" placeholder="Add a skill..." />
                <button type="button" onClick={() => addSkill(newSkill)} className="btn-secondary px-3"><Plus className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {COMMON_SKILLS.filter(s => !skills.includes(s)).slice(0, 12).map(s => (
                  <button key={s} type="button" onClick={() => addSkill(s)} className="skill-tag hover:bg-[#7c3aed]/20 cursor-pointer transition-all">+ {s}</button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
              {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
              {submitting ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateTeamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>}>
      <CreateTeamForm />
    </Suspense>
  );
}
