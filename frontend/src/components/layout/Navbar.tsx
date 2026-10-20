'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api';
import { Logo } from '../common/Logo';
import { AmazingButton } from '../common/AmazingButton';
import { LanguagePicker } from './LanguagePicker';
import { 
  Home, 
  Layers, 
  Bot, 
  Grid, 
  LayoutDashboard, 
  Menu, 
  X, 
  Settings,
  Scale,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [compareCount, setCompareCount] = useState<number>(0);

  // Check backend health engine on mount
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const isOnline = await api.getHealth();
      if (isMounted) setBackendOnline(isOnline);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Check compare count from localStorage
  useEffect(() => {
    const updateCompareCount = () => {
      if (typeof window !== 'undefined') {
        try {
          const list = JSON.parse(localStorage.getItem('govscheme_compare') || '[]');
          if (Array.isArray(list)) setCompareCount(list.length);
        } catch {
          setCompareCount(0);
        }
      }
    };
    updateCompareCount();
    window.addEventListener('storage', updateCompareCount);
    const interval = setInterval(updateCompareCount, 2000);
    return () => {
      window.removeEventListener('storage', updateCompareCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/schemes', label: 'Schemes', icon: Layers },
    { href: '/compare', label: 'Compare', icon: Scale, count: compareCount },
    { href: '/chat', label: 'Advisor AI', icon: Bot },
    { href: '/hubs', label: 'Sector Hubs', icon: Grid },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#090A0F]/90 backdrop-blur-md">
      {/* Top Citizen Service Utility Strip */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1 bg-[#06070B] border-b border-white/[0.04] text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            <span>GovSchemeAI</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>Verified Central & State Government Welfare Schemes Index</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/eligibility" className="hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span>Eligibility Quick-Scan</span>
          </Link>
          <span className="text-slate-600">•</span>
          <span>Direct .gov.in Application Verification</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="group flex items-center focus-visible:outline-none">
              <Logo variant="with-subtitle" size="md" />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150 relative ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500 text-white">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Backend Engine Status Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0E1017] border border-white/[0.08]"
              title={backendOnline === null ? 'Checking API status...' : backendOnline ? 'API Engine Active' : 'API Engine Offline'}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  backendOnline === null
                    ? 'bg-slate-500 animate-pulse'
                    : backendOnline
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                    : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                }`}
              />
              <span className={backendOnline ? 'text-emerald-400' : backendOnline === false ? 'text-rose-400' : 'text-slate-500'}>
                {backendOnline === null ? 'Engine' : backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Eligibility Quick Action */}
            <AmazingButton
              href="/eligibility"
              variant="gradient"
              size="sm"
              icon={<Sparkles className="h-3 w-3" />}
              className="hidden lg:inline-flex text-[11px] py-1.5 px-3"
            >
              Eligibility Scan
            </AmazingButton>

            {/* Language Picker */}
            <LanguagePicker />

            {/* Admin Portal Link */}
            <Link
              href="/admin"
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                pathname === '/admin'
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                  : 'border-white/[0.08] text-slate-400 hover:text-slate-100 bg-[#0E1017] hover:bg-[#161924]'
              }`}
              title="Admin Portal"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Admin</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.08] bg-[#0E1017] text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.08] py-3 bg-[#090A0F]/95 backdrop-blur-xl animate-fade-in">
            <div className="space-y-1 px-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between text-xs font-semibold px-4 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-purple-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500 text-white">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}

              <Link
                href="/eligibility"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-xs font-semibold px-4 py-2.5 rounded-lg text-purple-300 bg-purple-600/15 border border-purple-500/20 hover:bg-purple-600/25 mt-1"
              >
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Check My Eligibility</span>
              </Link>

              <Link
                href="/about-developer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-xs font-medium px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04]"
              >
                Developer Info & Architecture
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-xs font-medium px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04]"
              >
                <Settings className="h-4 w-4 text-amber-400" />
                Admin Staging Portal
              </Link>

              <div className="pt-2 px-4 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/[0.06] mt-2">
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
