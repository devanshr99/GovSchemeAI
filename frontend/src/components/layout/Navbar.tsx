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
      icon: <Sprout className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Student Scholarships Hub',
      description: 'National Scholarship Portal, fee waivers, fellowships',
      href: '/hubs/student',
      icon: <GraduationCap className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Women & Child Welfare Hub',
      description: 'Maternity assistance, SHG loans, Sukanya Samriddhi',
      href: '/hubs/women',
      icon: <HeartHandshake className="h-4 w-4 text-[#E8A126]" />,
    },
    {
      label: 'Startup & MSME Credit Hub',
      description: 'Mudra business loans, Startup India seed funding',
      href: '/hubs/startup',
      icon: <Rocket className="h-4 w-4 text-[#176B52]" />,
    },
  ];

  // Dropdown Items for "Citizen Tools"
  const citizenToolsItems: DropdownItem[] = [
    {
      label: 'Eligibility Quick-Scan',
      description: 'Evaluate demographic profile against all scheme matrices',
      href: '/eligibility',
      icon: <Sparkles className="h-4 w-4 text-[#E8A126]" />,
      badge: 'Recommended',
    },
    {
      label: 'Citizen Advisor AI',
      description: 'Chat with our scheme intelligence model for guidelines',
      href: '/chat',
      icon: <Bot className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Citizen Workspace / Dashboard',
      description: 'Review saved bookmarks, recent searches & match history',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 text-[#176B52]" />,
    },
  ];

  // More Options Menu
  const moreItems: DropdownItem[] = [
    {
      label: 'Admin Staging Portal',
      description: 'Manage crawler synchronization and scheme database',
      href: '/admin',
      icon: <Settings className="h-4 w-4 text-[#687368]" />,
    },
    {
      label: 'Developer & Architecture',
      description: 'System specifications, APIs, and data provenance',
      href: '/about-developer',
      icon: <Code className="h-4 w-4 text-[#687368]" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E9E3]">
      {/* Official Government Utility Announcement Strip */}
      <div className="hidden md:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5 bg-[#FAF5E9] border-b border-[#F3E7CA] text-xs text-[#687368]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#176B52]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>GovSchemeAI Directory</span>
          </span>
          <span className="text-[#C5CEC4]">•</span>
          <span>Verified Central & State Government Welfare Schemes</span>
        </div>
        <div className="flex items-center gap-4 text-[#687368]">
          <Link href="/eligibility" className="hover:text-[#176B52] font-medium flex items-center gap-1 transition-colors">
            <Sparkles className="h-3 w-3 text-[#E8A126]" />
            <span>Find Eligible Benefits</span>
          </Link>
          <span className="text-[#C5CEC4]">•</span>
          <span className="text-[#687368]">100% Free Public Resource</span>
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
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
            <Link
              href="/"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 ${
                pathname === '/'
                  ? 'bg-[#E7F3EC] text-[#176B52]'
                  : 'text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5]'
              }`}
            >
              <Home className="h-3.5 w-3.5 text-[#687368]" />
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
              icon={<Sparkles className="h-3.5 w-3.5 text-[#E8A126]" />}
              items={citizenToolsItems}
            />

            {/* Direct Advisor AI Link */}
            <Link
              href="/chat"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 ${
                pathname === '/chat'
                  ? 'bg-[#E7F3EC] text-[#176B52]'
                  : 'text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5]'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-[#176B52]" />
              <span>Advisor AI</span>
            </Link>

            {/* Citizen Dashboard Link */}
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 ${
                pathname === '/dashboard'
                  ? 'bg-[#E7F3EC] text-[#176B52]'
                  : 'text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5]'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-[#687368]" />
              <span>Dashboard</span>
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backend Engine Health Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-[#F7F8F5] border border-[#E5E9E3]"
              title={backendOnline === null ? 'Checking API status...' : backendOnline ? 'API Engine Active' : 'API Engine Offline'}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  backendOnline === null
                    ? 'bg-slate-400 animate-pulse'
                    : backendOnline
                    ? 'bg-[#176B52]'
                    : 'bg-rose-500'
                }`}
              />
              <span className={backendOnline ? 'text-[#176B52]' : backendOnline === false ? 'text-rose-600' : 'text-[#687368]'}>
                {backendOnline === null ? 'Engine' : backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Primary Action Button: Forest Green High-Visibility CTA */}
            <AmazingButton
              href="/eligibility"
              variant="primary"
              size="sm"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              iconPosition="left"
              className="hidden md:inline-flex text-xs py-2 px-4 shadow-xs"
            >
              Check Eligibility
            </AmazingButton>

            {/* Language Picker */}
            <LanguagePicker />

            {/* More Contextual Actions (Desktop) */}
            <div className="hidden lg:block">
              <DropdownMenu
                label=""
                icon={<MoreVertical className="h-4 w-4 text-[#687368]" />}
                items={moreItems}
                align="right"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-[#E5E9E3] bg-white text-[#202820] hover:bg-[#F7F8F5] transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-[#202820]" /> : <Menu className="h-4 w-4 text-[#202820]" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5E9E3] py-4 bg-white shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="space-y-4 px-2">
              
              {/* Primary Mobile CTA */}
              <Link
                href="/eligibility"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-3 rounded-xl bg-[#176B52] hover:bg-[#124C3D] text-white shadow-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>Check My Scheme Eligibility</span>
              </Link>

              {/* Core Links */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8A968A] px-3 tracking-wider">
                  Main Navigation
                </span>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-xl ${
                    pathname === '/' ? 'bg-[#E7F3EC] text-[#176B52]' : 'text-[#202820] hover:bg-[#F7F8F5]'
                  }`}
                >
                  <Home className="h-4 w-4 text-[#687368]" />
                  <span>Home</span>
                </Link>

                <Link
                  href="/schemes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-xl ${
                    pathname === '/schemes' ? 'bg-[#E7F3EC] text-[#176B52]' : 'text-[#202820] hover:bg-[#F7F8F5]'
                  }`}
                >
                  <Layers className="h-4 w-4 text-[#687368]" />
                  <span>All Government Schemes</span>
                </Link>

                <Link
                  href="/compare"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between text-xs font-semibold px-3 py-2.5 rounded-xl ${
                    pathname === '/compare' ? 'bg-[#E7F3EC] text-[#176B52]' : 'text-[#202820] hover:bg-[#F7F8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Scale className="h-4 w-4 text-[#687368]" />
                    <span>Compare Schemes</span>
                  </div>
                  {compareCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#176B52] text-white">
                      {compareCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-xl ${
                    pathname === '/chat' ? 'bg-[#E7F3EC] text-[#176B52]' : 'text-[#202820] hover:bg-[#F7F8F5]'
                  }`}
                >
                  <Bot className="h-4 w-4 text-[#176B52]" />
                  <span>Advisor AI</span>
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xs font-semibold px-3 py-2.5 rounded-xl ${
                    pathname === '/dashboard' ? 'bg-[#E7F3EC] text-[#176B52]' : 'text-[#202820] hover:bg-[#F7F8F5]'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 text-[#687368]" />
                  <span>Citizen Dashboard</span>
                </Link>
              </div>

              {/* Sector Hubs Mobile Links */}
              <div className="space-y-1 pt-2 border-t border-[#E5E9E3]">
                <span className="text-[10px] uppercase font-bold text-[#8A968A] px-3 tracking-wider">
                  Sector Welfare Portals
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    href="/hubs/farmer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F7F8F5] text-xs font-medium text-[#202820] hover:bg-[#E7F3EC]"
                  >
                    <Sprout className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Farmers</span>
                  </Link>
                  <Link
                    href="/hubs/student"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F7F8F5] text-xs font-medium text-[#202820] hover:bg-[#E7F3EC]"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Students</span>
                  </Link>
                  <Link
                    href="/hubs/women"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F7F8F5] text-xs font-medium text-[#202820] hover:bg-[#E7F3EC]"
                  >
                    <HeartHandshake className="h-3.5 w-3.5 text-[#E8A126]" />
                    <span>Women</span>
                  </Link>
                  <Link
                    href="/hubs/startup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F7F8F5] text-xs font-medium text-[#202820] hover:bg-[#E7F3EC]"
                  >
                    <Rocket className="h-3.5 w-3.5 text-[#176B52]" />
                    <span>Startups</span>
                  </Link>
                </div>
              </div>

              {/* Utilities & Status */}
              <div className="pt-2 border-t border-[#E5E9E3] space-y-2">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-xs font-medium px-3 py-2 rounded-xl text-[#687368] hover:text-[#202820]"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Admin Staging Portal</span>
                </Link>

                <div className="px-3 py-2 flex items-center justify-between text-xs text-[#687368] bg-[#F7F8F5] rounded-xl border border-[#E5E9E3]">
                  <span>API Engine Status</span>
                  <span className={`font-semibold ${backendOnline ? 'text-[#176B52]' : 'text-rose-600'}`}>
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
