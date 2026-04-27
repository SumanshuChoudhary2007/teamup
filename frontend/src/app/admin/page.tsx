'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Hackathon, type Team, type Profile } from '@/lib/supabase';
import { Shield, Trophy, Users, Plus, X, Calendar, Globe, Edit3, Trash2, UserCog, CheckCircle, XCircle, Clock } from 'lucide-react';

const ROLES = ['user', 'team_leader', 'admin'] as const;

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [tab, setTab] = useState<'hackathons' | 'teams' | 'users'>('hackathons');

  // New hackathon form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState<'online' | 'offline' | 'hybrid'>('online');
  const [location, setLocation] = useState('');
  const [prize, setPrize] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.is_admin === true;

  useEffect(() => {
    // Removed automatic redirect to admin-apply
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('hackathons').select('*').order('date', { ascending: true }).then(({ data }) => setHackathons((data || []) as Hackathon[]));
    supabase.from('teams').select('*, hackathon:hackathons(title)').order('created_at', { ascending: false }).then(({ data }) => setTeams((data || []) as Team[]));
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => setUsers((data || []) as Profile[]));
  }, [isAdmin]);

  // ... (handleCreateHackathon, deleteHackathon)
  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase.from('hackathons').insert({
      title, description, date: date || null, end_date: endDate || null,
      mode, location, prize, organizer, website_url: websiteUrl,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      created_by: user!.id,
    }).select().single();
    if (data) setHackathons(prev => [...prev, data as Hackathon]);
    setShowForm(false);
    setSaving(false);
    setTitle(''); setDescription(''); setDate(''); setEndDate(''); setLocation(''); setPrize(''); setOrganizer(''); setWebsiteUrl(''); setTags('');
  };

  const deleteHackathon = async (id: string) => {
    if (!confirm('Delete this hackathon? This will also delete all associated teams.')) return;
    await supabase.from('hackathons').delete().eq('id', id);
    setHackathons(prev => prev.filter(h => h.id !== id));
  };

  const updateRole = async (userId: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as Profile['role'] } : u));
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
  };

  if (authLoading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center relative">
        <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
        <div className="relative z-10 glass rounded-3xl p-8 sm:p-12 text-center max-w-md w-full border border-white/5 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-purple-500/20">
            <Shield className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Admin Portal</h1>
          <p className="text-[#94a3b8] mb-8">
            {user ? "Your account does not have administrator privileges." : "You must log in to access the administrator dashboard."}
          </p>
          <div className="space-y-4">
            <button 
              onClick={async () => {
                if (user) {
                  await supabase.auth.signOut();
                  // Force a reload to clear all auth state
                  window.location.href = '/login?type=admin&redirect=/admin';
                } else {
                  router.push('/login?type=admin&redirect=/admin');
                }
              }} 
              className="btn-primary w-full py-4 text-lg"
            >
              {user ? "Login with Admin Account" : "Log In"}
            </button>
            <button 
              onClick={() => router.push('/register?type=admin&redirect=/admin')}
              className="text-sm text-[#64748b] hover:text-white transition-all block w-full text-center"
            >
              Don't have an account? Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" /> Admin Dashboard
          </h1>
          <span className="badge badge-warning">Admin</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-2xl p-5 text-center"><Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" /><p className="text-2xl font-bold text-white">{hackathons.length}</p><p className="text-xs text-[#64748b]">Hackathons</p></div>
          <div className="glass rounded-2xl p-5 text-center"><Users className="w-6 h-6 text-[#a78bfa] mx-auto mb-1" /><p className="text-2xl font-bold text-white">{teams.length}</p><p className="text-xs text-[#64748b]">Teams</p></div>
          <div className="glass rounded-2xl p-5 text-center"><UserCog className="w-6 h-6 text-[#22d3ee] mx-auto mb-1" /><p className="text-2xl font-bold text-white">{users.length}</p><p className="text-xs text-[#64748b]">Users</p></div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['hackathons', 'teams', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize flex items-center gap-2 ${tab === t ? 'gradient-bg text-white' : 'glass text-[#94a3b8] hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Hackathons Tab */}
        {tab === 'hackathons' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Manage Hackathons</h2>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showForm ? 'Cancel' : 'Add Hackathon'}
              </button>
            </div>
            {showForm && (
              <div className="glass rounded-2xl p-6 mb-6 animate-slide-up">
                <h3 className="text-lg font-semibold text-white mb-4">New Hackathon</h3>
                <form onSubmit={handleCreateHackathon} className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><label className="block text-sm text-[#94a3b8] mb-1">Title *</label><input value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Hackathon name" required /></div>
                  <div className="sm:col-span-2"><label className="block text-sm text-[#94a3b8] mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field min-h-[80px] resize-y" placeholder="Brief description..." /></div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">Start Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" /></div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" /></div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">Mode</label>
                    <select value={mode} onChange={e => setMode(e.target.value as typeof mode)} className="input-field">
                      <option value="online" style={{background:'#1e1b2e'}}>Online</option>
                      <option value="offline" style={{background:'#1e1b2e'}}>Offline</option>
                      <option value="hybrid" style={{background:'#1e1b2e'}}>Hybrid</option>
                    </select>
                  </div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">Location</label><input value={location} onChange={e => setLocation(e.target.value)} className="input-field" placeholder="City or Online" /></div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">Prize Pool</label><input value={prize} onChange={e => setPrize(e.target.value)} className="input-field" placeholder="e.g. $50,000" /></div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">Organizer</label><input value={organizer} onChange={e => setOrganizer(e.target.value)} className="input-field" placeholder="Organization name" /></div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">Website URL</label><input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="input-field" placeholder="https://..." /></div>
                  <div><label className="block text-sm text-[#94a3b8] mb-1">Tags (comma-separated)</label><input value={tags} onChange={e => setTags(e.target.value)} className="input-field" placeholder="AI, Web3, Mobile" /></div>
                  <div className="sm:col-span-2">
                    <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />} Create Hackathon
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hackathons.map(h => (
                <div key={h.id} className="glass rounded-xl p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white">{h.title}</h3>
                    <button onClick={() => deleteHackathon(h.id)} className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-[#94a3b8] mb-2">{h.organizer}</p>
                  {h.date && <p className="text-xs text-[#64748b] flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(h.date).toLocaleDateString()}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">{h.tags?.slice(0, 3).map(t => <span key={t} className="skill-tag">{t}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {tab === 'teams' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">All Teams ({teams.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(t => (
                <div key={t.id} className="glass rounded-xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{t.team_name}</h3>
                    <span className={`badge ${t.status === 'OPEN' ? 'badge-success' : 'badge-danger'}`}>{t.status}</span>
                  </div>
                  <p className="text-sm text-[#94a3b8] line-clamp-2 mb-2">{t.project_idea}</p>
                  <p className="text-xs text-[#64748b]">{t.current_members}/{t.max_members} members</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">All Users ({users.length})</h2>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-semibold shrink-0">
                    {u.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{u.name}</p>
                    <p className="text-xs text-[#64748b] truncate">{u.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">{u.skills?.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => toggleAdmin(u.id, u.is_admin)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        u.is_admin 
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30' 
                          : 'bg-white/5 text-[#94a3b8] hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  )}
                  {!isAdmin && u.is_admin && <span className="badge badge-warning text-xs">Admin</span>}
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
