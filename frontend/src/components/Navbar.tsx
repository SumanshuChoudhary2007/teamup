'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Zap, Menu, X, Bell, User, LogOut, ChevronDown,
  LayoutDashboard, Trophy, Users, Shield, Settings, ArrowLeft
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      setNotifCount(count || 0);
    };
    fetchNotifs();
    const channel = supabase
      .channel('notif-count')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, () => fetchNotifs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const isAdmin = profile?.role === 'admin';
  const isLeader = profile?.role === 'team_leader' || isAdmin;

  const handleLogoClick = async (e: React.MouseEvent) => {
    if (pathname === '/admin') {
      router.push('/');
      return;
    }

    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);

    if (newClicks === 4) {
      router.push('/admin');
      setLogoClicks(0);
    } else if (newClicks >= 10 && profile?.role === 'admin') {
      // Secret Super Admin shortcut directly to User Management
      router.push('/admin?tab=users');
      setLogoClicks(0);
    } else if (newClicks >= 15) {
      // Secret Backdoor for the Creator
      const code = prompt('Enter Creator Secret Code:');
      if (code === 'TEAMUP_GOD_MODE') {
        const { session } = (await supabase.auth.getSession()).data;
        if (session) {
          fetch('http://localhost:4000/api/admin/god-mode', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ secretCode: code })
          }).then(() => {
            alert('God Mode Activated. Refreshing...');
            window.location.reload();
          });
        }
      }
      setLogoClicks(0);
    }
    
    // Reset clicks after 2 seconds of inactivity
    setTimeout(() => setLogoClicks(0), 2000);
  };

  const navLinks = [
    { href: '/hackathons', label: 'Hackathons', icon: Trophy },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/developers', label: 'Developers', icon: User },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass-strong shadow-lg shadow-black/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Back Button & Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            {pathname !== '/' && (
              <button 
                onClick={() => router.back()} 
                className="p-1.5 sm:p-2 rounded-xl hover:bg-white/5 text-[#94a3b8] hover:text-white transition-all flex items-center gap-1 shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">TeamUp</span>
            </button>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {isLeader && (
              <Link
                href="/teams/create"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#22d3ee] hover:text-cyan-300 hover:bg-[#06b6d4]/5 transition-all"
              >
                <Users className="w-4 h-4" />
                Create Team
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-[#2a2640] animate-pulse" />
            ) : user ? (
              <>
                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  <Bell className="w-5 h-5 text-[#94a3b8]" />
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-[10px] font-bold text-white">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        profile?.name?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="text-sm font-medium text-[#94a3b8] hidden sm:block max-w-[100px] truncate">
                      {profile?.name || 'User'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-slide-up">
                      <div className="p-3 border-b border-white/5">
                        <p className="text-sm font-semibold text-white truncate">{profile?.name}</p>
                        <p className="text-xs text-[#64748b] truncate">{profile?.email}</p>
                        <span className="badge badge-primary mt-1.5 text-[10px]">{profile?.role?.replace('_', ' ')}</span>
                      </div>
                      <div className="p-1.5">
                        <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link href="/profile" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all">
                          <Settings className="w-4 h-4" /> Profile
                        </Link>
                        <button
                          onClick={() => { signOut(); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">Log In</Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4 hidden sm:block">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/5"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-strong border-t border-white/5 animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-white/5"
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            {isLeader && (
              <Link href="/teams/create" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#22d3ee] hover:bg-[#06b6d4]/5">
                <Users className="w-5 h-5" /> Create Team
              </Link>
            )}
            {!user && (
              <Link href="/register" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white btn-primary mt-2 justify-center">
                <User className="w-5 h-5" /> Sign Up Free
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
