'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Globe, Search, MessageSquare, ShieldAlert, Award, Menu, X, Settings } from 'lucide-react';
import { LanguagePicker } from './LanguagePicker';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

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
    // Re-check every 60 seconds
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: t('findSchemes'), icon: ShieldAlert },
    { href: '/schemes', label: t('browseSchemes'), icon: Search },
    { href: '/chat', label: t('chatAssistant'), icon: MessageSquare },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0f172a]/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-blue-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0f172a]">
                  <Award className="h-5 w-5 text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-orange-400">GovScheme</span>
                <span className="text-blue-400 font-extrabold">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Backend Health Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
              title={backendOnline === null ? 'Checking backend...' : backendOnline ? 'Backend online' : 'Backend offline — start the server on port 8000'}
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
              <span className={`${backendOnline ? 'text-emerald-500' : backendOnline === false ? 'text-red-400' : 'text-slate-500'}`}>
                {backendOnline === null ? 'Checking' : backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Admin link */}
            <Link
              href="/admin"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                pathname === '/admin'
                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  : 'border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-slate-200 bg-white/[0.02] hover:bg-white/[0.06]'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Admin
            </Link>

            {/* Language Picker Dropdown */}
            <LanguagePicker />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.08] hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-slate-300" />
              ) : (
                <Menu className="h-4 w-4 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
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
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Admin Link */}
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all"
              >
                <Settings className="h-4 w-4" />
                Admin Panel
              </Link>

              {/* Mobile Backend Status */}
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
                <div className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-400' : backendOnline === false ? 'bg-red-500' : 'bg-slate-600'}`} />
                Backend: {backendOnline === null ? 'Checking...' : backendOnline ? 'Online ✓' : 'Offline — start server on :8000'}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
