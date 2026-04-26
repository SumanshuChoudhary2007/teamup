'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Team, type Application, type Hackathon, type Profile, type Message } from '@/lib/supabase';
import { Users, ArrowLeft, UserCheck, Code, Trophy, CheckCircle, XCircle, Clock, Send, MessageCircle, Crown, AlertCircle } from 'lucide-react';

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  const { user, profile } = useAuth();
  const [team, setTeam] = useState<(Team & { hackathon: Hackathon; leader: Profile }) | null>(null);
  const [applications, setApplications] = useState<(Application & { user: Profile })[]>([]);
  const [myApp, setMyApp] = useState<Application | null>(null);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: t } = await supabase.from('teams').select('*, hackathon:hackathons(*), leader:profiles!teams_created_by_fkey(*)').eq('id', teamId).single();
      setTeam(t as typeof team);
      if (user) {
        const { data: ma } = await supabase.from('applications').select('*').eq('team_id', teamId).eq('user_id', user.id).maybeSingle();
        setMyApp(ma as Application | null);
        const isL = t?.created_by === user.id;
        setIsMember(isL || ma?.status === 'accepted');
        if (isL) {
          const { data: apps } = await supabase.from('applications').select('*, user:profiles(*)').eq('team_id', teamId).order('created_at', { ascending: false });
          setApplications((apps || []) as typeof applications);
        }
      }
      setLoading(false);
    };
    load();
  }, [teamId, user]);

  useEffect(() => {
    if (!isMember || !showChat) return;
    const loadMsgs = async () => {
      const { data } = await supabase.from('messages').select('*, sender:profiles(*)').eq('team_id', teamId).order('created_at', { ascending: true }).limit(100);
      setMessages((data || []) as typeof messages);
    };
    loadMsgs();
    const channel = supabase.channel(`chat-${teamId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` }, async (p) => {
      const { data: s } = await supabase.from('profiles').select('*').eq('id', p.new.sender_id).single();
      setMessages(prev => [...prev, { ...p.new, sender: s } as Message & { sender: Profile }]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isMember, showChat, teamId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleApply = async () => {
    if (!user || !team || team.status === 'FULL') return;
    setApplying(true);
    const { data } = await supabase.from('applications').insert({ user_id: user.id, team_id: teamId, message }).select().single();
    if (data) {
      setMyApp(data as Application);
      await supabase.from('notifications').insert({ recipient_id: team.created_by, type: 'new_application', title: 'New Application', message: `${profile?.name} applied to ${team.team_name}`, data: { team_id: teamId } });
    }
    setApplying(false);
  };

  const handleDecision = async (appId: string, status: 'accepted' | 'rejected', app: Application & { user: Profile }) => {
    if (!team) return;
    await supabase.from('applications').update({ status }).eq('id', appId);
    if (status === 'accepted') {
      await supabase.from('teams').update({ current_members: team.current_members + 1 }).eq('id', teamId);
      setTeam({ ...team, current_members: team.current_members + 1 });
    }
    await supabase.from('notifications').insert({ recipient_id: app.user_id, type: `application_${status}`, title: status === 'accepted' ? 'Accepted! 🎉' : 'Application Update', message: status === 'accepted' ? `Welcome to ${team.team_name}!` : `Your application to ${team.team_name} was declined.`, data: { team_id: teamId } });
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
  };

  const sendChat = async () => {
    if (!chatMsg.trim() || !user) return;
    await supabase.from('messages').insert({ team_id: teamId, sender_id: user.id, content: chatMsg.trim() });
    setChatMsg('');
  };

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" /></div>;
  if (!team) return <div className="min-h-screen pt-20 flex items-center justify-center text-[#94a3b8]">Team not found</div>;

  const spots = team.max_members - team.current_members;
  const isLeader = user?.id === team.created_by;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="relative z-10">
        <Link href="/teams" className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white mb-4"><ArrowLeft className="w-4 h-4" /> Back</Link>

        {/* Header */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{team.team_name}</h1>
              <p className="text-[#a78bfa] flex items-center gap-1 mt-1"><Trophy className="w-4 h-4" /> {team.hackathon?.title}</p>
            </div>
            <span className={`badge text-sm ${team.status === 'OPEN' ? 'badge-success' : 'badge-danger'}`}>{team.status}</span>
          </div>
          <p className="text-[#94a3b8] mb-4">{team.project_idea || team.description || 'No description.'}</p>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-2 text-[#94a3b8]"><UserCheck className="w-4 h-4 text-[#a78bfa]" /> {team.current_members}/{team.max_members}</span>
              <span className={`font-semibold ${spots > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{spots > 0 ? `${spots} spots left` : 'FULL'}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/5"><div className="h-full rounded-full gradient-bg transition-all" style={{ width: `${(team.current_members / team.max_members) * 100}%` }} /></div>
          </div>
          {team.required_skills?.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-[#64748b] flex items-center gap-1 mb-2"><Code className="w-4 h-4" /> Required Skills</p>
              <div className="flex flex-wrap gap-2">{team.required_skills.map(s => <span key={s} className={`badge badge-primary ${profile?.skills?.some(ps => ps.toLowerCase() === s.toLowerCase()) ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : ''}`}>{s}</span>)}</div>
            </div>
          )}
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-semibold">{team.leader?.name?.charAt(0)}</div>
            <div><p className="text-white font-medium flex items-center gap-1">{team.leader?.name} <Crown className="w-3.5 h-3.5 text-amber-400" /></p><p className="text-xs text-[#64748b]">Team Leader</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            {!isLeader && !isMember && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Apply to this Team</h2>
                {myApp ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                    {myApp.status === 'pending' && <Clock className="w-5 h-5 text-amber-400" />}
                    {myApp.status === 'accepted' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    {myApp.status === 'rejected' && <XCircle className="w-5 h-5 text-red-400" />}
                    <p className="text-white font-medium capitalize">Application {myApp.status}</p>
                  </div>
                ) : team.status === 'FULL' ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Team is full.</div>
                ) : !user ? (
                  <div className="text-center"><p className="text-[#94a3b8] mb-3">Sign in to apply</p><Link href="/login" className="btn-primary">Log In</Link></div>
                ) : (
                  <div className="space-y-4">
                    <textarea value={message} onChange={e => setMessage(e.target.value)} className="input-field min-h-[100px] resize-y" placeholder="Why you'd be a great fit..." />
                    <button onClick={handleApply} disabled={applying} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                      {applying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />} {applying ? 'Sending...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {isMember && (
              <div className="glass rounded-2xl overflow-hidden">
                <button onClick={() => setShowChat(!showChat)} className="w-full p-4 flex items-center justify-between text-white font-semibold hover:bg-white/5 transition-all">
                  <span className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#a78bfa]" /> Team Chat</span>
                  <span className="text-sm text-[#64748b]">{showChat ? 'Hide' : 'Show'}</span>
                </button>
                {showChat && (
                  <div>
                    <div className="h-80 overflow-y-auto p-4 space-y-3 border-t border-white/5">
                      {messages.length === 0 && <p className="text-center text-[#64748b] text-sm py-8">No messages yet.</p>}
                      {messages.map(m => (
                        <div key={m.id} className={`flex gap-2 ${m.sender_id === user?.id ? 'flex-row-reverse' : ''}`}>
                          <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">{m.sender?.name?.charAt(0)}</div>
                          <div className={`max-w-[75%] ${m.sender_id === user?.id ? 'text-right' : ''}`}>
                            <p className="text-xs text-[#64748b] mb-0.5">{m.sender?.name}</p>
                            <div className={`inline-block p-2.5 rounded-xl text-sm ${m.sender_id === user?.id ? 'gradient-bg text-white' : 'bg-white/5 text-[#f1f5f9]'}`}>{m.content}</div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t border-white/5 flex gap-2">
                      <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} className="input-field flex-1 py-2" placeholder="Type a message..." />
                      <button onClick={sendChat} className="btn-primary px-3"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isLeader && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#a78bfa]" /> Applications ({applications.length})</h2>
              {applications.length === 0 ? <p className="text-[#64748b] text-sm">No applications yet.</p> : (
                <div className="space-y-3">
                  {applications.map(app => (
                    <div key={app.id} className="p-4 rounded-xl bg-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white text-sm font-bold">{app.user?.name?.charAt(0)}</div>
                          <div><p className="text-white font-medium">{app.user?.name}</p><p className="text-xs text-[#64748b]">{app.user?.experience}</p></div>
                        </div>
                        <span className={`badge ${app.status === 'pending' ? 'badge-warning' : app.status === 'accepted' ? 'badge-success' : 'badge-danger'}`}>{app.status}</span>
                      </div>
                      {app.user?.skills?.length > 0 && <div className="flex flex-wrap gap-1">{app.user.skills.slice(0, 6).map(s => <span key={s} className="skill-tag">{s}</span>)}</div>}
                      {app.message && <p className="text-sm text-[#94a3b8] italic">&quot;{app.message}&quot;</p>}
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleDecision(app.id, 'accepted', app)} className="btn-success flex-1 py-2 flex items-center justify-center gap-1 text-sm"><CheckCircle className="w-4 h-4" /> Accept</button>
                          <button onClick={() => handleDecision(app.id, 'rejected', app)} className="btn-danger flex-1 py-2 flex items-center justify-center gap-1 text-sm"><XCircle className="w-4 h-4" /> Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
