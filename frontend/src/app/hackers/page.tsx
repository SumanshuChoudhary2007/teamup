'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Profile } from '@/lib/supabase';
import { Users, Search, Code, MapPin, ExternalLink, Globe, User, Shield, Sparkles } from 'lucide-react';

export default function AllHackersPage() {
  const [hackers, setHackers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setHackers((data || []) as Profile[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = hackers.filter(h => {
    return h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.skills?.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
      h.email?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#7c3aed]/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" /> Discover Hackers
          </h1>
          <p className="text-[#94a3b8] mt-1">Find amazing people to build your next big idea with</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="input-field pl-12 py-4 text-lg" 
            placeholder="Search by name, skill, or tech stack..." 
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#7c3aed]/30 border-t-[#7c3aed] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <User className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hackers found</h3>
            <p className="text-[#94a3b8]">Try a different search term or check back later.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((hacker, i) => (
              <div 
                key={hacker.id} 
                className="glass rounded-3xl p-6 border border-white/10 card-hover animate-slide-up flex flex-col items-center text-center group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-2xl gradient-bg flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-black/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                    {hacker.avatar_url ? (
                      <img src={hacker.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      hacker.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  {hacker.role === 'admin' && (
                    <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 rounded-lg shadow-lg">
                      <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{hacker.name}</h3>
                <p className="text-xs text-[#a78bfa] font-bold tracking-widest uppercase mb-4">{hacker.role?.replace('_', ' ')}</p>
                
                <div className="flex flex-wrap justify-center gap-1.5 mb-6">
                  {hacker.skills?.slice(0, 3).map(skill => (
                    <span key={skill} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-[#94a3b8] font-medium">
                      {skill}
                    </span>
                  ))}
                  {hacker.skills && hacker.skills.length > 3 && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-[#64748b]">
                      +{hacker.skills.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center justify-center gap-4">
                  {hacker.portfolio_link && (
                    <a href={hacker.portfolio_link} target="_blank" className="text-[#94a3b8] hover:text-white transition-colors">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  <Link href={`/profile/${hacker.id}`} className="text-[#a78bfa] hover:text-white text-sm font-bold flex items-center gap-1 transition-colors">
                    View Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
