'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { LanguagePicker } from './LanguagePicker';
import { 
  ShieldAlert, 
  Search, 
  Bot, 
  Grid, 
  LayoutDashboard, 
  UserCheck, 
  Menu, 
  X, 
  Settings, 
  Bell, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health', { method: 'GET' });
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/schemes?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: ShieldAlert },
    { href: '/schemes', label: 'Schemes', icon: Search },
    { href: '/eligibility', label: 'Eligibility', icon: UserCheck },
    { href: '/chat', label: 'Advisor AI', icon: Bot },
    { href: '/hubs', label: 'Sector Hubs', icon: Grid },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center">
              <Logo variant="with-subtitle" size="md" />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                      : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Input */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:relative sm:block">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-colors ${
                  searchFocused ? 'text-[#A855F7]' : 'text-[#71717A]'
                }`} />
                <input
                  type="text"
                  placeholder="Search schemes, state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-40 md:w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#0D0F14] border border-[#242832] text-[#F5F5F7] placeholder-[#71717A] focus:border-[#8B5CF6] focus:w-64 transition-all duration-200"
                />
              </div>
            </form>

            {/* Backend Health Dot */}
            <div
              className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#101217] border border-[#242832]"
              title={backendOnline === null ? 'Checking backend status...' : backendOnline ? 'API Engine Online' : 'API Engine Offline'}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  backendOnline === null
                    ? 'bg-slate-500 animate-pulse'
                    : backendOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                }`}
              />
              <span className={backendOnline ? 'text-emerald-400' : backendOnline === false ? 'text-rose-400' : 'text-slate-500'}>
                {backendOnline === null ? 'Engine' : backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Language Selector */}
            <LanguagePicker />

            {/* Admin trigger */}
            <Link
              href="/admin"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                pathname === '/admin'
                  ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40 text-[#A855F7]'
                  : 'border-[#242832] text-[#A1A1AA] hover:text-[#F5F5F7] bg-[#101217] hover:bg-[#141720]'
              }`}
              title="Admin Portal"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Admin</span>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-[#242832] bg-[#101217] text-[#A1A1AA] hover:text-white transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#242832] py-4 bg-[#08090D]/95 backdrop-blur-xl animate-slide-down">
            <div className="space-y-1 px-1">
              {/* Mobile Search Form */}
              <form onSubmit={handleSearchSubmit} className="mb-3 px-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
                  <input
                    type="text"
                    placeholder="Search schemes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0D0F14] border border-[#242832] text-[#F5F5F7]"
                  />
                </div>
              </form>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 text-sm font-semibold px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#8B5CF6]/20 text-[#A855F7] border border-[#8B5CF6]/30'
                        : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-[#A855F7]" />
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/about-developer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
              >
                Developer Info
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
              >
                <Settings className="h-4 w-4 text-amber-400" />
                Admin Staging Portal
              </Link>

              <div className="pt-2 px-4 flex items-center justify-between text-xs text-[#71717A] border-t border-[#242832]/60 mt-2">
                <span>System Status</span>
                <span className={`font-semibold ${backendOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {backendOnline ? '● Engine Active' : '○ Engine Offline'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
