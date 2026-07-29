'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Globe, Search, MessageSquare, ShieldCheck, Menu, X, Settings, User, Landmark } from 'lucide-react';
import { LanguagePicker } from './LanguagePicker';
import Logo from '../common/Logo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health', { method: 'GET' });
        if (res.ok) setBackendOnline(true);
        else setBackendOnline(false);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: t('findSchemes'), icon: ShieldCheck },
    { href: '/schemes', label: t('browseSchemes'), icon: Search },
    { href: '/chat', label: t('chatAssistant'), icon: MessageSquare },
    { href: '/about-developer', label: t('about'), icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Official Government Announcement & Tricolor Accent Strip */}
      <div className="w-full bg-[#071328] border-b border-white/[0.08] text-[11px] py-1 px-4 sm:px-6 lg:px-8 flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2">
          {/* Subtle Tricolor Indicator Bar */}
          <div className="flex h-3 w-4 flex-col rounded-xs overflow-hidden shrink-0 border border-white/20">
            <div className="h-1 bg-[#FF9933]" />
            <div className="h-1 bg-white" />
            <div className="h-1 bg-[#138808]" />
          </div>
          <span className="font-semibold text-slate-300">
            {language === 'hi'
              ? 'भारत सरकार नागरिक कल्याण योजना पोर्टल'
              : 'Government of India • Citizen Welfare Portal'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-[10px] text-slate-400 font-medium">
          <span>Accessibility Compliance (WCAG 2.1 AA)</span>
          <span>•</span>
          <span>Official Department Rule Evaluation</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="w-full border-b border-white/[0.08] bg-[#0b132b]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 group hover:opacity-95 transition-opacity">
                <Logo variant="full" size="md" />
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Backend Health Status */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/[0.06] text-[10px] font-bold uppercase tracking-wider"
                title={backendOnline === null ? 'Checking backend status...' : backendOnline ? 'Backend service online' : 'Backend offline — ensure server runs on port 8000'}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    backendOnline === null
                      ? 'bg-slate-500 animate-pulse'
                      : backendOnline
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse'
                      : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                  }`}
                />
                <span className={backendOnline ? 'text-emerald-400' : backendOnline === false ? 'text-red-400' : 'text-slate-400'}>
                  {backendOnline === null ? 'Checking' : backendOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Admin Panel link */}
              <Link
                href="/admin"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  pathname === '/admin'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-900/80'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                {t('adminPanel')}
              </Link>

              {/* Language Selector */}
              <LanguagePicker />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.08] hover:border-white/20 bg-slate-900/60 transition-all cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4 text-slate-300" />
                ) : (
                  <Menu className="h-4 w-4 text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/[0.08] py-3 animate-slide-down">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all"
                >
                  <Settings className="h-4 w-4" />
                  {t('adminPanel')}
                </Link>

                <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400 border-t border-white/[0.06] mt-2 pt-3">
                  <div className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-red-500'}`} />
                  Server Status: {backendOnline ? 'Online ✓' : 'Offline'}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
export default Navbar;

