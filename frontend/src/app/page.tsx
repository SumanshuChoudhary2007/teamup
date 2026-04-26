'use client';

import Link from 'next/link';
import { Zap, Users, Trophy, Rocket, ArrowRight, Star, Globe, Shield, Code } from 'lucide-react';

const stats = [
  { label: 'Active Hackers', value: '10K+', icon: Users },
  { label: 'Hackathons Listed', value: '50+', icon: Trophy },
  { label: 'Teams Formed', value: '2,500+', icon: Zap },
  { label: 'Countries', value: '30+', icon: Globe },
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
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Whether you\'re a solo hacker, team leader, or admin — the platform adapts to your role.',
  },
  {
    icon: Code,
    title: 'Skill Matching',
    desc: 'Teams list required skills. See your match percentage and apply where you fit best.',
  },
  {
    icon: Star,
    title: 'Real-time Updates',
    desc: 'Get instant notifications when your application is accepted, or when someone applies to your team.',
  },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Sign up and showcase your skills, experience, and portfolio.' },
  { num: '02', title: 'Browse Hackathons', desc: 'Explore upcoming hackathons and find the one that excites you.' },
  { num: '03', title: 'Join or Create a Team', desc: 'Apply to existing teams or create your own with specific requirements.' },
  { num: '04', title: 'Build & Win', desc: 'Collaborate with your team and ship an amazing project.' },
];

export default function LandingPage() {
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
            <span className="text-sm font-medium text-[#94a3b8]">The #1 Hackathon Team Builder</span>
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
              <p className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs sm:text-sm text-[#64748b] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-primary mb-4">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to <span className="gradient-text">Win</span></h2>
          <p className="text-[#94a3b8] max-w-xl mx-auto">From discovery to deployment, TeamUp has every tool you need to form and manage your hackathon team.</p>
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

      {/* How it works */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-accent mb-4">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Four Steps to <span className="gradient-text">Victory</span></h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative glass rounded-2xl p-6 card-hover animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="text-5xl font-black gradient-text opacity-30 absolute top-4 right-4">{s.num}</span>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-2 mt-6">{s.title}</h3>
                <p className="text-sm text-[#94a3b8]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
        <div className="glass rounded-3xl p-10 sm:p-14 gradient-border">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to <span className="gradient-text">TeamUp</span>?</h2>
          <p className="text-[#94a3b8] mb-8 max-w-md mx-auto">
            Join thousands of hackers who are already forming incredible teams. Your next big win starts here.
          </p>
          <Link href="/register" className="btn-primary text-base py-3.5 px-10 inline-flex items-center gap-2">
            Start Building Your Team <ArrowRight className="w-5 h-5" />
          </Link>
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
          <p className="text-sm text-[#64748b]">© 2025 TeamUp. Built for Hackers, by Hackers.</p>
        </div>
      </footer>
    </div>
  );
}
