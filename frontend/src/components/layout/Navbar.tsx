'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import {
  Globe, Search, MessageSquare, ShieldCheck, Menu, X, Settings, User, Landmark,
  Bell, GraduationCap, Rocket, Tractor, HeartHandshake, Briefcase, LayoutDashboard, ArrowUpDown
} from 'lucide-react';
import { LanguagePicker } from './LanguagePicker';
import Logo from '../common/Logo';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hubsDropdownOpen, setHubsDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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

  // Keyboard shortcut Cmd/Ctrl + K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { href: '/', label: t('findSchemes'), icon: ShieldCheck },
    { href: '/schemes', label: t('browseSchemes'), icon: Search },
    { href: '/dashboard', label: 'Citizen Dashboard', icon: LayoutDashboard },
    { href: '/compare', label: 'Compare Schemes', icon: ArrowUpDown },
    { href: '/chat', label: t('chatAssistant'), icon: MessageSquare },
  ];

  const hubsList = [
    { href: '/hubs/student', label: 'Student Hub', icon: GraduationCap, color: 'text-blue-400' },
    { href: '/hubs/startup', label: 'Startup Hub', icon: Rocket, color: 'text-amber-400' },
    { href: '/hubs/farmer', label: 'Farmer Hub', icon: Tractor, color: 'text-emerald-400' },
    { href: '/hubs/women', label: 'Women Hub', icon: HeartHandshake, color: 'text-pink-400' },
    { href: '/hubs/youth', label: 'Youth Hub', icon: Briefcase, color: 'text-cyan-400' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Announcement Strip */}
      <div className="w-full bg-[#071328] border-b border-white/[0.08] text-[11px] py-1 px-4 sm:px-6 lg:px-8 flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex h-3 w-4 flex-col rounded-xs overflow-hidden shrink-0 border border-white/20">
            <div className="h-1 bg-[#FF9933]" />
            <div className="h-1 bg-white" />
            <div className="h-1 bg-[#138808]" />
          </div>
          <span className="font-semibold text-slate-300">
            {language === 'hi'
              ? 'भारत सरकार नागरिक कल्याण सेवा पोर्टल'
              : 'Government of India • National Citizen Welfare Portal'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-[10px] text-slate-400 font-medium">
          <span>500+ Active Schemes</span>
          <span>•</span>
          <span>WCAG 2.1 AA Compliant</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="w-full border-b border-white/[0.08] bg-[#0b132b]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 group hover:opacity-95 transition-opacity">
                <Logo variant="full" size="md" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Hubs Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setHubsDropdownOpen(!hubsDropdownOpen)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    pathname.startsWith('/hubs')
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Landmark className="h-3.5 w-3.5 text-amber-400" />
                  <span>Sector Hubs</span>
                </button>

                {hubsDropdownOpen && (
                  <div className="absolute top-[110%] left-0 w-48 gov-card rounded-2xl border border-white/[0.1] shadow-2xl p-2 z-50 space-y-1">
                    {hubsList.map((h) => {
                      const HIcon = h.icon;
                      return (
                        <Link
                          key={h.href}
                          href={h.href}
                          onClick={() => setHubsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-200 hover:text-white hover:bg-white/[0.04] transition-all"
                        >
                          <HIcon className={`h-4 w-4 ${h.color}`} />
                          <span>{h.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Global Search Button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-blue-500/40 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Global Search (Ctrl + K)"
              >
                <Search className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden xl:inline">Global Search</span>
                <kbd className="hidden sm:inline-block text-[9px] bg-slate-800 px-1.5 py-0.5 rounded border border-white/10 text-slate-400 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Notification Alerts"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-slate-950 animate-pulse" />
              </button>

              {/* Language Selector */}
              <LanguagePicker />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.08] hover:border-white/20 bg-slate-900/60 transition-all cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-4 w-4 text-slate-300" /> : <Menu className="h-4 w-4 text-slate-300" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/[0.08] py-3 space-y-2 animate-slide-down">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-xs font-semibold px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.04]"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-slate-500 px-4 block mb-1">Sector Hubs</span>
                  {hubsList.map((h) => {
                    const HIcon = h.icon;
                    return (
                      <Link
                        key={h.href}
                        href={h.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-xs font-semibold px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.04]"
                      >
                        <HIcon className={`h-4 w-4 ${h.color}`} />
                        {h.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Notification Center Drawer */}
      <NotificationDrawer isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </header>
  );
};

export default Navbar;


