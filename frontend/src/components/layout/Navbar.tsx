'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Globe, Search, MessageSquare, ShieldAlert, Award, Menu, X, Settings, User } from 'lucide-react';
import { LanguagePicker } from './LanguagePicker';

/** Inline SVG Logo — Shield + Document checkmark (minimal, flat, professional) */
const LogoIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Shield shape */}
    <path
      d="M18 3L5 9v8c0 8.5 5.5 16.4 13 18 7.5-1.6 13-9.5 13-18V9L18 3z"
      fill="#0F766E"
      fillOpacity="0.08"
      stroke="#0F766E"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Document inside */}
    <rect x="12" y="10" width="12" height="15" rx="2" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.2" />
    {/* Document lines */}
    <line x1="14.5" y1="14" x2="21.5" y2="14" stroke="#D1D5DB" strokeWidth="1" strokeLinecap="round" />
    <line x1="14.5" y1="17" x2="21.5" y2="17" stroke="#D1D5DB" strokeWidth="1" strokeLinecap="round" />
    <line x1="14.5" y1="20" x2="18.5" y2="20" stroke="#D1D5DB" strokeWidth="1" strokeLinecap="round" />
    {/* Checkmark circle */}
    <circle cx="22" cy="22" r="5.5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M19.5 22L21 23.5L24.5 20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
    { href: '/about-developer', label: 'About Developer', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <LogoIcon />
              <span className="text-xl font-semibold tracking-tight">
                <span className="text-[#111827]">GovScheme</span>
                <span className="text-[#0F766E] font-bold">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-[#F0FDFA] text-[#0F766E] font-semibold'
                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            {/* Backend Health Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider"
              title={backendOnline === null ? 'Checking backend...' : backendOnline ? 'Backend online' : 'Backend offline — start the server on port 8000'}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  backendOnline === null
                    ? 'bg-gray-300 animate-pulse'
                    : backendOnline
                    ? 'bg-[#16A34A]'
                    : 'bg-[#DC2626]'
                }`}
              />
              <span className={`${backendOnline ? 'text-[#16A34A]' : backendOnline === false ? 'text-[#DC2626]' : 'text-[#9CA3AF]'}`}>
                {backendOnline === null ? 'Checking' : backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Admin link */}
            <Link
              href="/admin"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                pathname === '/admin'
                  ? 'bg-[#F0FDFA] border-[#0F766E]/20 text-[#0F766E]'
                  : 'border-[#E5E7EB] hover:border-[#D1D5DB] text-[#6B7280] hover:text-[#111827] bg-white hover:bg-[#F9FAFB]'
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
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-[#E5E7EB] hover:border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] transition-all cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-[#6B7280]" />
              ) : (
                <Menu className="h-4 w-4 text-[#6B7280]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E7EB] py-3 animate-slide-down">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-[#F0FDFA] text-[#0F766E] font-semibold'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
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
                className="flex items-center gap-3 text-sm font-medium px-4 py-3 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] transition-all"
              >
                <Settings className="h-4 w-4" />
                Admin Panel
              </Link>

              {/* Mobile Backend Status */}
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-[#9CA3AF]">
                <div className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-[#16A34A]' : backendOnline === false ? 'bg-[#DC2626]' : 'bg-gray-300'}`} />
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
