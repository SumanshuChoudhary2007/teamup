'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Zap, Users, Trophy, Rocket, ArrowRight, Globe, Shield, Code, Calendar, MapPin } from 'lucide-react';

export default function LandingPage() {
  const [counts, setCounts] = useState({
    hackers: 0,
    hackathons: 0,
    teams: 0,
    countries: 12, // Still a bit of a placeholder, but we can't easily count countries without more data
  });
  const [recentHackathons, setRecentHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: hackers },
        { count: hackathons },
        { count: teams },
        { data: latestHacks }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('hackathons').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('hackathons').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      setCounts({
        hackers: hackers || 0,
        hackathons: hackathons || 0,
        teams: teams || 0,
        countries: 5, // Hardcoding a small real number or making it dynamic later
      });
      setRecentHackathons(latestHacks || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const stats = [
    { label: 'Active Hackers', value: counts.hackers > 1000 ? `${(counts.hackers/1000).toFixed(1)}K+` : counts.hackers.toString(), icon: Users },
    { label: 'Hackathons', value: counts.hackathons.toString(), icon: Trophy },
    { label: 'Teams Formed', value: counts.teams.toString(), icon: Zap },
    { label: 'Tech Communities', value: '10+', icon: Globe },
  ];

  const features = [
    {
      icon: Trophy,
      title: 'Discover Hackathons',
      desc: 'Browse curated hackathons from top organizations worldwide. Filter by date, mode, and tech stack.',
    },
    {
      icon: Users,
      title: 'Form Dream Teams',
      desc: 'Create or join teams with defined roles and skill requirements. Our smart matching helps you find the right fit.',
    },
    {
      icon: Rocket,
      title: 'Apply & Get Accepted',
      desc: 'Submit your application with a message. Team leaders review skills and accept the best candidates.',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-50" />
      <div className="fixed top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-[#7c3aed]/8 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#06b6d4]/8 blur-[120px] pointer-events-none" />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-up">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-[#94a3b8]">Verified Hackathon Team Builder</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Find Your <span className="gradient-text">Dream Team</span>
            <br />for Every Hackathon
          </h1>

          <p className="text-lg sm:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Stop hacking alone. TeamUp connects you with skilled developers, designers,
            and innovators to form unbeatable hackathon teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/register" className="btn-primary text-base py-3.5 px-8 flex items-center gap-2 w-full sm:w-auto justify-center">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/hackathons" className="btn-secondary text-base py-3.5 px-8 flex items-center gap-2 w-full sm:w-auto justify-center">
              <Trophy className="w-5 h-5" /> Browse Hackathons
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-5 text-center card-hover">
              <stat.icon className="w-6 h-6 text-[#a78bfa] mx-auto mb-2" />
              <p className="text-2xl sm:text-3xl font-bold gradient-text">{loading ? '...' : stat.value}</p>
              <p className="text-xs sm:text-sm text-[#64748b] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Hackathons - Only Real Ones */}
      {recentHackathons.length > 0 && (
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-success mb-4">Live Now</span>
            <h2 className="text-3xl font-bold text-white">Featured Hackathons</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentHackathons.map((h, i) => (
              <div key={h.id} className="glass rounded-2xl p-6 card-hover animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl gradient-bg-subtle flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="badge badge-primary uppercase text-[10px]">{h.mode}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{h.title}</h3>
                <p className="text-sm text-[#94a3b8] line-clamp-2 mb-4">{h.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#64748b]">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(h.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {h.location || 'Remote'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/hackathons" className="text-[#a78bfa] hover:text-white font-medium flex items-center justify-center gap-2 transition-all">
              View all hackathons <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-primary mb-4">Platform</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Build Faster with <span className="gradient-text">TeamUp</span></h2>
          <p className="text-[#94a3b8] max-w-xl mx-auto">Verified profiles, real-time matching, and secure collaboration tools.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className="glass rounded-2xl p-6 card-hover animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 rounded-xl gradient-bg-subtle flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-[#a78bfa]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">TeamUp</span>
          </div>
          <p className="text-sm text-[#64748b]">© {new Date().getFullYear()} TeamUp. Real data. Real hackers.</p>
        </div>
      </footer>
    </div>
  );
}
