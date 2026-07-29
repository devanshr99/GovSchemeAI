'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import {
  Search, MessageSquare, ShieldCheck, Menu, X, Landmark,
  Bell, GraduationCap, Rocket, Tractor, HeartHandshake, Briefcase, LayoutDashboard, ArrowUpDown, HelpCircle, User
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
    { href: '/', label: 'Home', icon: ShieldCheck },
    { href: '/schemes', label: 'Schemes', icon: Search },
    { href: '/results', label: 'Eligibility', icon: Landmark },
    { href: '/hubs/student', label: 'Scholarships', icon: GraduationCap },
    { href: '/hubs/startup', label: 'Startup', icon: Rocket },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/chat', label: 'Help Desk', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Official Government Announcement & Tricolor Accent Strip */}
      <div className="w-full bg-[#0A2540] border-b border-slate-700/50 text-[11px] py-1 px-4 sm:px-6 lg:px-8 flex items-center justify-between text-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex h-3 w-4 flex-col rounded-xs overflow-hidden shrink-0 border border-white/30">
            <div className="h-1 bg-[#FF9933]" />
            <div className="h-1 bg-white" />
            <div className="h-1 bg-[#138808]" />
          </div>
          <span className="font-semibold text-slate-200">
            {language === 'hi'
              ? 'भारत सरकार • राष्ट्रीय नागरिक कल्याण सेवा पोर्टल'
              : 'Government of India • National Citizen Welfare Portal'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-[10px] text-slate-300 font-medium">
          <span>500+ Active Schemes</span>
          <span>•</span>
          <span>WCAG 2.1 AA Compliant</span>
        </div>
      </div>

      {/* Main White Navbar */}
      <nav className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <Logo variant="full" size="md" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'text-slate-700 hover:text-blue-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search Trigger */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-xs text-slate-700 hover:text-blue-700 transition-all cursor-pointer shadow-2xs"
                title="Search Schemes (Ctrl + K)"
              >
                <Search className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden md:inline font-medium">Search Portal</span>
                <kbd className="hidden sm:inline-block text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-700 transition-all cursor-pointer"
                title="Portal Alerts"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-600 border-2 border-white" />
              </button>

              {/* Profile Link */}
              <Link
                href="/dashboard"
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-700 transition-all"
                title="Citizen Profile"
              >
                <User className="h-4 w-4" />
              </Link>

              {/* Language Picker */}
              <LanguagePicker />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 transition-all cursor-pointer text-slate-700"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="xl:hidden border-t border-slate-200 py-3 space-y-1 animate-slide-down bg-white">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-xs font-semibold px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-700"
                  >
                    <Icon className="h-4 w-4 text-blue-600" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Global Search & Notifications */}
      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <NotificationDrawer isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </header>
  );
};

export default Navbar;



