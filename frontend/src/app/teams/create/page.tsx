'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Hackathon } from '@/lib/supabase';
import { Users, Plus, X, Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const COMMON_SKILLS = ['React','Next.js','TypeScript','JavaScript','Python','Node.js','Rust','Go','Java','Flutter','Swift','Kotlin','Vue.js','Django','FastAPI','PostgreSQL','MongoDB','Firebase','AWS','Docker','GraphQL','TailwindCSS','Figma','UI/UX','Machine Learning','AI','Blockchain','Web3','Solidity','DevOps'];

export default function CreateTeamPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedHackathon = searchParams.get('hackathon');

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [hackathonId, setHackathonId] = useState(preselectedHackathon || '');
  const [teamName, setTeamName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    const isLeader = profile?.role === 'team_leader' || profile?.role === 'admin' || profile?.role === 'super_admin';
    if (!authLoading && profile && !isLeader) router.push('/dashboard');
  }, [authLoading, profile, router]);

  useEffect(() => {
    supabase.from('hackathons').select('id,title,date').order('date', { ascending: true }).then(({ data }) => {
      setHackathons((data || []) as Hackathon[]);
    });
  }, []);

  const addSkill = (s: string) => {
    const sk = s.trim();
    if (sk && !skills.includes(sk)) setSkills([...skills, sk]);
    setNewSkill('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathonId) { setError('Please select a hackathon'); return; }
    if (!teamName.trim()) { setError('Team name is required'); return; }
    setSubmitting(true);
    setError('');
    const { data, error: err } = await supabase
      .from('teams')
      .insert({
        hackathon_id: hackathonId,
        team_name: teamName.trim(),
        project_idea: projectIdea.trim(),
        description: description.trim(),
        max_members: maxMembers,
        current_members: 1,
        required_skills: skills,
        created_by: user!.id,
        status: 'OPEN',
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
              <select
                value={hackathonId}
                onChange={e => setHackathonId(e.target.value)}
                className="input-field"
                required
              >
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

            {/* Max members */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">
                Max Team Size: <span className="text-white font-bold">{maxMembers}</span>
              </label>
              <input type="range" min={2} max={10} value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value))}
                className="w-full accent-[#7c3aed]" />
              <div className="flex justify-between text-xs text-[#64748b] mt-1"><span>2</span><span>10</span></div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-2">Required Skills</label>
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
