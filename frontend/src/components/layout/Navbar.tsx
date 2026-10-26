'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api';
import { Logo } from '../common/Logo';
import { AmazingButton } from '../common/AmazingButton';
import { LanguagePicker } from './LanguagePicker';
import { DropdownMenu, DropdownItem } from '../common/DropdownMenu';
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
  ShieldCheck,
  GraduationCap,
  Sprout,
  HeartHandshake,
  Rocket,
  MoreVertical,
  Code
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

  // Dropdown Items for "Explore Schemes"
  const exploreItems: DropdownItem[] = [
    {
      label: 'All Government Schemes',
      description: 'Search & filter 130+ central and state ministry schemes',
      href: '/schemes',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      label: 'Sector Hubs Overview',
      description: 'Dedicated portals for farmers, students, women & startups',
      href: '/hubs',
      icon: <Grid className="h-4 w-4" />,
    },
    {
      label: 'Side-by-Side Comparison',
      description: 'Compare benefits, eligibility & documents for up to 3 schemes',
      href: '/compare',
      icon: <Scale className="h-4 w-4" />,
      badge: compareCount > 0 ? `${compareCount}` : undefined,
    },
    { divider: true, label: '' },
    {
      label: 'Farmer Welfare (Kisan Hub)',
      description: 'PM-KISAN, crop insurance, fertilizer subsidies',
      href: '/hubs/farmer',
      icon: <Sprout className="h-4 w-4 text-emerald-400" />,
    },
    {
      label: 'Student Scholarships Hub',
      description: 'National Scholarship Portal, fee waivers, fellowships',
      href: '/hubs/student',
      icon: <GraduationCap className="h-4 w-4 text-blue-400" />,
    },
    {
      label: 'Women & Child Welfare Hub',
      description: 'Maternity assistance, SHG loans, Sukanya Samriddhi',
      href: '/hubs/women',
      icon: <HeartHandshake className="h-4 w-4 text-pink-400" />,
    },
    {
      label: 'Startup & MSME Credit Hub',
      description: 'Mudra business loans, Startup India seed funding',
      href: '/hubs/startup',
      icon: <Rocket className="h-4 w-4 text-amber-400" />,
    },
  ];

  // Dropdown Items for "Citizen Tools"
  const citizenToolsItems: DropdownItem[] = [
    {
      label: 'Eligibility Quick-Scan',
      description: 'Evaluate demographic profile against all scheme matrices',
      href: '/eligibility',
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
      badge: 'Recommended',
    },
    {
      label: 'Citizen Advisor AI',
      description: 'Chat with our scheme intelligence model for guidelines',
      href: '/chat',
      icon: <Bot className="h-4 w-4 text-blue-400" />,
    },
    {
      label: 'Citizen Workspace / Dashboard',
      description: 'Review saved bookmarks, recent searches & match history',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 text-emerald-400" />,
    },
  ];

  // More Options Menu
  const moreItems: DropdownItem[] = [
    {
      label: 'Admin Staging Portal',
      description: 'Manage crawler synchronization and scheme database',
      href: '/admin',
      icon: <Settings className="h-4 w-4 text-slate-400" />,
    },
    {
      label: 'Developer & Architecture',
      description: 'System specifications, APIs, and data provenance',
      href: '/about-developer',
      icon: <Code className="h-4 w-4 text-slate-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080C15]/95 backdrop-blur-md">
      {/* Official Government Utility Strip */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1 bg-[#060910] border-b border-white/[0.04] text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            <span>GovSchemeAI</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>Verified Central & State Government Welfare Schemes Index</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/eligibility" className="hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Find My Eligible Benefits</span>
          </Link>
          <span className="text-slate-600">•</span>
          <span>Direct Official .gov.in Verification</span>
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

          {/* Desktop Smart Grouped Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            <Link
              href="/"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150 ${
                pathname === '/'
                  ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Home className="h-3.5 w-3.5 text-slate-400" />
              <span>Home</span>
            </Link>

            {/* Explore Schemes Dropdown */}
            <DropdownMenu
              label="Explore Schemes"
              icon={<Layers className="h-3.5 w-3.5" />}
              items={exploreItems}
              badge={compareCount > 0 ? compareCount : undefined}
            />

            {/* Citizen Tools Dropdown */}
            <DropdownMenu
              label="Citizen Tools"
              icon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}
              items={citizenToolsItems}
            />

            {/* Direct Advisor AI Link */}
            <Link
              href="/chat"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150 ${
                pathname === '/chat'
                  ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-blue-400" />
              <span>Advisor AI</span>
            </Link>

            {/* Citizen Dashboard Link */}
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150 ${
                pathname === '/dashboard'
                  ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-slate-400" />
              <span>Dashboard</span>
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backend Engine Health Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0E1422] border border-white/[0.08]"
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

            {/* Primary Action Button: Saffron High-Visibility CTA */}
            <AmazingButton
              href="/eligibility"
              variant="saffron"
              size="sm"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              iconPosition="left"
              className="hidden md:inline-flex text-xs py-1.5 px-3.5"
            >
              Check Benefits
            </AmazingButton>

            {/* Language Picker */}
            <LanguagePicker />

            {/* More Contextual Actions (Desktop) */}
            <div className="hidden lg:block">
              <DropdownMenu
                label=""
                icon={<MoreVertical className="h-4 w-4 text-slate-400" />}
                items={moreItems}
                align="right"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.08] bg-[#0E1422] text-slate-300 hover:text-white transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.08] py-4 bg-[#080C15]/98 backdrop-blur-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="space-y-4 px-2">
              
              {/* Primary Mobile CTA */}
              <Link
                href="/eligibility"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-xs font-bold px-4 py-3 rounded-xl bg-amber-500 text-slate-950 shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                <span>Check My Scheme Eligibility</span>
              </Link>

              {/* Core Links */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 px-3 tracking-wider">
                  Main Navigation
                </span>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-lg ${
                    pathname === '/' ? 'bg-blue-600/15 text-blue-400 font-bold' : 'text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Home className="h-4 w-4 text-slate-400" />
                  <span>Home</span>
                </Link>

                <Link
                  href="/schemes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-lg ${
                    pathname === '/schemes' ? 'bg-blue-600/15 text-blue-400 font-bold' : 'text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Layers className="h-4 w-4 text-slate-400" />
                  <span>All Government Schemes</span>
                </Link>

                <Link
                  href="/compare"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between text-xs font-semibold px-3 py-2.5 rounded-lg ${
                    pathname === '/compare' ? 'bg-blue-600/15 text-blue-400 font-bold' : 'text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Scale className="h-4 w-4 text-slate-400" />
                    <span>Compare Schemes</span>
                  </div>
                  {compareCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                      {compareCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-lg ${
                    pathname === '/chat' ? 'bg-blue-600/15 text-blue-400 font-bold' : 'text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Bot className="h-4 w-4 text-blue-400" />
                  <span>Advisor AI</span>
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-lg ${
                    pathname === '/dashboard' ? 'bg-blue-600/15 text-blue-400 font-bold' : 'text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-slate-400" />
                  <span>Citizen Dashboard</span>
                </Link>
              </div>

              {/* Sector Hubs Mobile Links */}
              <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-slate-500 px-3 tracking-wider">
                  Sector Welfare Portals
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    href="/hubs/farmer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] text-xs font-medium text-slate-300 hover:text-white"
                  >
                    <Sprout className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Farmers</span>
                  </Link>
                  <Link
                    href="/hubs/student"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] text-xs font-medium text-slate-300 hover:text-white"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                    <span>Students</span>
                  </Link>
                  <Link
                    href="/hubs/women"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] text-xs font-medium text-slate-300 hover:text-white"
                  >
                    <HeartHandshake className="h-3.5 w-3.5 text-pink-400" />
                    <span>Women</span>
                  </Link>
                  <Link
                    href="/hubs/startup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] text-xs font-medium text-slate-300 hover:text-white"
                  >
                    <Rocket className="h-3.5 w-3.5 text-amber-400" />
                    <span>Startups</span>
                  </Link>
                </div>
              </div>

              {/* Utilities & Status */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-xs font-medium px-3 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Admin Staging Portal</span>
                </Link>

                <div className="px-3 py-2 flex items-center justify-between text-[11px] text-slate-500 bg-white/[0.02] rounded-lg">
                  <span>API Engine Status</span>
                  <span className={`font-semibold ${backendOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {backendOnline ? '● Operational' : '○ Offline'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
