'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api';
import { Logo } from '../common/Logo';
import { LanguagePicker } from './LanguagePicker';
import { 
  Home, 
  Layers, 
  Bot, 
  Grid, 
  LayoutDashboard, 
  Menu, 
  X, 
  Settings 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Check backend health engine on mount
  useEffect(() => {
    const checkHealth = async () => {
      const isOnline = await api.getHealth();
      setBackendOnline(isOnline);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/schemes', label: 'Schemes', icon: Layers },
    { href: '/chat', label: 'Advisor AI', icon: Bot },
    { href: '/hubs', label: 'Sector Hubs', icon: Grid },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#242832]/80 bg-[#08090D]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          
          {/* Brand Logo */}
          <div className="flex items-center shrink-0">
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
                  className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-[#8B5CF6]/15 text-[#A855F7] border border-[#8B5CF6]/30'
                      : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#A855F7]' : 'text-[#71717A]'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Backend Engine Status */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#101217] border border-[#242832]"
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

            {/* Language Picker */}
            <LanguagePicker />

            {/* Admin Portal Link */}
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

            {/* Mobile Menu Button */}
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
          <div className="lg:hidden border-t border-[#242832] py-3 bg-[#08090D]/95 backdrop-blur-xl animate-fade-in">
            <div className="space-y-1 px-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all ${
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
                className="flex items-center gap-3 text-xs font-medium px-4 py-2.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
              >
                Developer Info
              </Link>

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-xs font-medium px-4 py-2.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
              >
                <Settings className="h-4 w-4 text-amber-400" />
                Admin Staging Portal
              </Link>

              <div className="pt-2 px-4 flex items-center justify-between text-[11px] text-[#71717A] border-t border-[#242832]/60 mt-2">
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
