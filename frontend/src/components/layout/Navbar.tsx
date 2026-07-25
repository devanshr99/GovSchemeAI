'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Search, MessageSquare, ShieldCheck, Menu, X, Settings, User } from 'lucide-react';
import { LanguagePicker } from './LanguagePicker';

/** Startup Logo SVG — Flat minimal geometry (Shield + Document + Checkmark) */
const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#2563EB" />
    <path
      d="M16 6L8 10V16C8 21.5 11.5 26.5 16 27.5C20.5 26.5 24 21.5 24 16V10L16 6Z"
      fill="#FFFFFF"
      fillOpacity="0.15"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <rect x="11" y="10" width="10" height="12" rx="2" fill="#FFFFFF" />
    <path d="M13.5 16L15.5 18L18.5 14" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, t } = useApp();
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
    const interval = setInterval(checkHealth, 60_000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: '/', label: t('findSchemes'), icon: ShieldCheck },
    { href: '/schemes', label: t('browseSchemes'), icon: Search },
    { href: '/chat', label: t('chatAssistant'), icon: MessageSquare },
    { href: '/about-developer', label: 'About Developer', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#E4E7EC] bg-white/98 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <LogoIcon />
              <span className="text-lg font-bold tracking-tight text-[#101828]">
                GovScheme<span className="text-[#2563EB] font-extrabold">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-[#F2F4F7] text-[#101828] font-semibold'
                      : 'text-[#667085] hover:text-[#101828] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className="h-4 w-4 stroke-[2]" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-3">
            {/* Backend Health Status Pill */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F8FAFC] border border-[#E4E7EC]"
              title={backendOnline === null ? 'Checking backend connection...' : backendOnline ? 'FastAPI backend connected' : 'Backend offline'}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  backendOnline === null
                    ? 'bg-[#98A2B3] animate-pulse'
                    : backendOnline
                    ? 'bg-[#12B76A]'
                    : 'bg-[#F04438]'
                }`}
              />
              <span className="text-[#667085]">
                {backendOnline === null ? 'Checking' : backendOnline ? 'API Active' : 'API Offline'}
              </span>
            </div>

            {/* Admin Dashboard */}
            <Link
              href="/admin"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                pathname === '/admin'
                  ? 'bg-[#EFF6FF] border-[#2563EB]/20 text-[#2563EB]'
                  : 'border-[#E4E7EC] hover:border-[#D0D5DD] text-[#344054] hover:text-[#101828] bg-white'
              }`}
            >
              <Settings className="h-3.5 w-3.5 stroke-[2]" />
              Admin
            </Link>

            {/* Language Selector */}
            <LanguagePicker />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-[#E4E7EC] bg-white text-[#667085] hover:text-[#101828] transition-all cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 stroke-[2]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[2]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E4E7EC] py-3 animate-slide-down">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                        : 'text-[#667085] hover:text-[#101828] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <Icon className="h-4 w-4 stroke-[2]" />
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-lg text-[#667085] hover:text-[#101828] hover:bg-[#F8FAFC] transition-all"
              >
                <Settings className="h-4 w-4 stroke-[2]" />
                Admin Panel
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
