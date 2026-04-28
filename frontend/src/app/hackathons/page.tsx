'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Hackathon } from '@/lib/supabase';
import { Trophy, Calendar, MapPin, Globe, Search, Filter, Users, ArrowRight, Wifi, Building2 } from 'lucide-react';
import { HackathonSkeleton } from '@/components/Skeleton';

export default function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('hackathons').select('*').order('date', { ascending: true });
      setHackathons(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = hackathons.filter(h => {
    const matchSearch = h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.description?.toLowerCase().includes(search.toLowerCase()) ||
      h.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchMode = modeFilter === 'all' || h.mode === modeFilter;
    return matchSearch && matchMode;
  });

  const modeIcon = (m: string) => {
    if (m === 'online') return <Wifi className="w-3.5 h-3.5" />;
    if (m === 'offline') return <Building2 className="w-3.5 h-3.5" />;
    return <Globe className="w-3.5 h-3.5" />;
  };

  const modeBadge = (m: string) => {
    const cls = m === 'online' ? 'badge-success' : m === 'offline' ? 'badge-accent' : 'badge-warning';
    return <span className={`badge ${cls} capitalize`}>{modeIcon(m)} {m}</span>;
  };

  if (loading) return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
        <div className="flex justify-center"><Skeleton className="w-32 h-6 rounded-full" /></div>
        <div className="flex justify-center"><Skeleton className="w-3/4 h-12 rounded-xl" /></div>
        <div className="flex justify-center"><Skeleton className="w-full h-6 rounded-lg" /></div>
      </div>
      <div className="flex gap-4 mb-12"><Skeleton className="flex-1 h-14 rounded-2xl" /><Skeleton className="w-40 h-14 rounded-2xl" /></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <HackathonSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-30" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" /> Hackathons
          </h1>
          <p className="text-[#94a3b8] mt-1">Discover upcoming hackathons and find your next challenge</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="input-with-icon flex-1">
            <Search className="input-icon input-icon-left w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field has-icon-left"
              placeholder="Search hackathons by name, tag..."
            />
          </div>
          <div className="flex gap-2">
            {['all', 'online', 'offline', 'hybrid'].map(m => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                  modeFilter === m ? 'gradient-bg text-white' : 'glass text-[#94a3b8] hover:text-white'
                }`}
              >
                {m === 'all' ? <Filter className="w-4 h-4 inline mr-1" /> : null}
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <HackathonSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Trophy className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hackathons found</h3>
            <p className="text-[#94a3b8]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((h, i) => (
              <div key={h.id} className="glass rounded-2xl overflow-hidden card-hover animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Banner gradient */}
                <div className="h-32 gradient-bg-subtle relative flex items-end p-5">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b2e] to-transparent" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white">{h.title}</h3>
                    <p className="text-sm text-[#c4b5fd]">{h.organizer}</p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-sm text-[#94a3b8] line-clamp-2">{h.description}</p>

                  <div className="space-y-2 text-sm">
                    {h.date && (
                      <div className="flex items-center gap-2 text-[#94a3b8]">
                        <Calendar className="w-4 h-4 text-[#a78bfa]" />
                        {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {h.end_date && ` - ${new Date(h.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </div>
                    )}
                    {h.location && (
                      <div className="flex items-center gap-2 text-[#94a3b8]">
                        <MapPin className="w-4 h-4 text-[#22d3ee]" />
                        {h.location}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    {modeBadge(h.mode)}
                    {h.prize && <span className="text-sm font-semibold text-amber-400">{h.prize}</span>}
                  </div>

                  {h.tags && h.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {h.tags.slice(0, 4).map(t => <span key={t} className="skill-tag">{t}</span>)}
                    </div>
                  )}

                  <Link
                    href={`/hackathons/${h.id}/teams`}
                    className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    <Users className="w-4 h-4" /> View Teams <ArrowRight className="w-4 h-4" />
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
