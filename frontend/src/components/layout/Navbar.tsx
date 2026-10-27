'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '../../lib/api';
import { Logo } from '../common/Logo';
import { LanguagePicker } from './LanguagePicker';
import { DropdownMenu, DropdownItem } from '../common/DropdownMenu';
import { 
  Layers, 
  Bot, 
  Grid, 
  LayoutDashboard, 
  Menu, 
  X, 
  Settings,
  Scale,
  Sparkles,
  GraduationCap,
  Sprout,
  HeartHandshake,
  Rocket,
  Code,
  FileCheck2,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSectionOpen, setMobileSectionOpen] = useState<'schemes' | 'services' | 'resources' | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [compareCount, setCompareCount] = useState<number>(0);
  const mobileRef = useRef<HTMLDivElement>(null);

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

  // Sync compare items count from localStorage
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

  // Close mobile drawer on route change or escape key
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Dropdown Items: 1. Explore Schemes
  const exploreItems: DropdownItem[] = [
    {
      label: 'All Government Schemes',
      description: 'Search & filter 130+ central and state ministry schemes',
      href: '/schemes',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      label: 'Side-by-Side Comparison',
      description: 'Compare benefits, eligibility criteria & required documents',
      href: '/compare',
      icon: <Scale className="h-4 w-4" />,
      badge: compareCount > 0 ? `${compareCount} saved` : undefined,
    },
    {
      label: 'Sector Hubs Directory',
      description: 'Browse specialized schemes grouped by beneficiary profile',
      href: '/hubs',
      icon: <Grid className="h-4 w-4" />,
    },
    { divider: true, label: '' },
    {
      label: 'Farmer Welfare (Kisan)',
      description: 'PM-KISAN, crop insurance, fertilizer subsidies',
      href: '/hubs/farmer',
      icon: <Sprout className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Student Scholarships',
      description: 'Fee waivers, merit scholarships & fellowships',
      href: '/hubs/student',
      icon: <GraduationCap className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Women & Child Welfare',
      description: 'Maternity assistance, SHG loans & Sukanya Samriddhi',
      href: '/hubs/women',
      icon: <HeartHandshake className="h-4 w-4 text-[#E8A126]" />,
    },
    {
      label: 'Startup & MSME Credit',
      description: 'Mudra business loans, Startup India seed grants',
      href: '/hubs/startup',
      icon: <Rocket className="h-4 w-4 text-[#176B52]" />,
    },
  ];

  // Dropdown Items: 2. Citizen Services
  const citizenServicesItems: DropdownItem[] = [
    {
      label: 'Eligibility Quick-Scan',
      description: 'Instant demographic matching across all scheme matrices',
      href: '/eligibility',
      icon: <Sparkles className="h-4 w-4 text-[#E8A126]" />,
      badge: '60 Seconds',
    },
    {
      label: 'Citizen Advisor AI',
      description: 'Interactive conversation model for scheme guidance',
      href: '/chat',
      icon: <Bot className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Citizen Workspace & Dashboard',
      description: 'View bookmarks, matching history & application checklist',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Scheme Evaluation Results',
      description: 'View scored benefits and official application links',
      href: '/results',
      icon: <FileCheck2 className="h-4 w-4 text-[#176B52]" />,
    },
  ];

  // Dropdown Items: 3. Resources
  const resourcesItems: DropdownItem[] = [
    {
      label: 'Scheme Updates & Scrapers',
      description: 'Live crawler status, sync logs & freshness metrics',
      href: '/admin/updates',
      icon: <RefreshCw className="h-4 w-4 text-[#176B52]" />,
    },
    {
      label: 'Administration Staging Portal',
      description: 'Manage scheme records, categories & crawler tasks',
      href: '/admin',
      icon: <Settings className="h-4 w-4 text-[#687368]" />,
    },
    {
      label: 'Developer APIs & Architecture',
      description: 'System specifications, REST endpoints & data models',
      href: '/about-developer',
      icon: <Code className="h-4 w-4 text-[#687368]" />,
    },
  ];

  // Check active states for top-level dropdowns
  const isSchemesActive = pathname.startsWith('/schemes') || pathname.startsWith('/compare') || pathname.startsWith('/hubs');
  const isServicesActive = pathname.startsWith('/eligibility') || pathname.startsWith('/chat') || pathname.startsWith('/dashboard') || pathname.startsWith('/results');
  const isResourcesActive = pathname.startsWith('/admin') || pathname.startsWith('/about-developer');

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E9E3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* 1. Left: Brand Logo */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="group flex items-center focus-visible:outline-none">
              <Logo variant="with-subtitle" size="md" />
            </Link>
          </div>

          {/* 2. Center: Exactly 4 Clean Organized Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {/* Nav Item 1: Home */}
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                pathname === '/'
                  ? 'bg-[#E7F3EC] text-[#176B52]'
                  : 'text-[#202820] hover:text-[#176B52] hover:bg-[#F7F8F5]'
              }`}
            >
              Home
            </Link>

            {/* Nav Item 2: Explore Schemes ▾ */}
            <DropdownMenu
              label="Explore Schemes"
              items={exploreItems}
              badge={compareCount > 0 ? compareCount : undefined}
              isActive={isSchemesActive}
            />

            {/* Nav Item 3: Citizen Services ▾ */}
            <DropdownMenu
              label="Citizen Services"
              items={citizenServicesItems}
              isActive={isServicesActive}
            />

            {/* Nav Item 4: Resources ▾ */}
            <DropdownMenu
              label="Resources"
              items={resourcesItems}
              isActive={isResourcesActive}
            />
          </nav>

          {/* 3. Right: Status Indicator, Language Picker & Primary Forest-Green CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Compact Status Indicator */}
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F7F8F5] border border-[#E5E9E3] text-[#202820]"
              title={
                backendOnline === null
                  ? 'Verifying service health...'
                  : backendOnline
                  ? 'Backend Service Operational'
                  : 'Service Connectivity Issue'
              }
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    backendOnline === null
                      ? 'bg-amber-400 animate-ping'
                      : backendOnline
                      ? 'bg-[#176B52] animate-ping'
                      : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    backendOnline === null
                      ? 'bg-amber-500'
                      : backendOnline
                      ? 'bg-[#176B52]'
                      : 'bg-rose-600'
                  }`}
                />
              </span>
              <span className="hidden md:inline text-[#687368]">
                {backendOnline === null ? 'Checking' : backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Language Picker */}
            <LanguagePicker />

            {/* Prominent Forest-Green "Check Eligibility" Action Button */}
            <Link
              href="/eligibility"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#176B52] hover:bg-[#124C3D] text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]/40"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FAF5E9]" />
              <span>Check Eligibility</span>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-[#E5E9E3] bg-white text-[#202820] hover:bg-[#F7F8F5] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-[#202820]" /> : <Menu className="h-4 w-4 text-[#202820]" />}
            </button>
          </div>
        </div>

        {/* 4. Responsive Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div 
            ref={mobileRef}
            className="lg:hidden border-t border-[#E5E9E3] py-4 bg-white animate-fade-in max-h-[calc(100vh-4.5rem)] overflow-y-auto"
          >
            <div className="space-y-4 px-2 pb-6">
              
              {/* Prominent Mobile CTA */}
              <Link
                href="/eligibility"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-3 rounded-xl bg-[#176B52] hover:bg-[#124C3D] text-white shadow-xs transition-colors"
              >
                <Sparkles className="h-4 w-4 text-[#FAF5E9]" />
                <span>Check My Scheme Eligibility</span>
              </Link>

              {/* 1. Home */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  pathname === '/'
                    ? 'bg-[#E7F3EC] text-[#176B52]'
                    : 'text-[#202820] hover:bg-[#F7F8F5]'
                }`}
              >
                <span>Home</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#687368]" />
              </Link>

              {/* 2. Explore Schemes Accordion */}
              <div className="border border-[#E5E9E3] rounded-2xl overflow-hidden bg-[#FAFBF9]">
                <button
                  type="button"
                  onClick={() => setMobileSectionOpen(mobileSectionOpen === 'schemes' ? null : 'schemes')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-[#202820] hover:bg-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>Explore Schemes</span>
                    {compareCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#176B52] text-white">
                        {compareCount}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-[#687368] transition-transform duration-200 ${mobileSectionOpen === 'schemes' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSectionOpen === 'schemes' && (
                  <div className="p-2 space-y-1 bg-white border-t border-[#E5E9E3]">
                    {exploreItems.map((item, i) => {
                      if (item.divider) return <div key={i} className="my-1 border-t border-[#E5E9E3]" />;
                      return (
                        <Link
                          key={i}
                          href={item.href || '#'}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-[#F7F8F5] transition-colors"
                        >
                          {item.icon && <span className="shrink-0 mt-0.5">{item.icon}</span>}
                          <div className="min-w-0">
                            <div className="font-semibold text-[#202820]">{item.label}</div>
                            {item.description && <div className="text-[11px] text-[#687368] truncate">{item.description}</div>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Citizen Services Accordion */}
              <div className="border border-[#E5E9E3] rounded-2xl overflow-hidden bg-[#FAFBF9]">
                <button
                  type="button"
                  onClick={() => setMobileSectionOpen(mobileSectionOpen === 'services' ? null : 'services')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-[#202820] hover:bg-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>Citizen Services</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#E7F3EC] text-[#176B52]">
                      Tools
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-[#687368] transition-transform duration-200 ${mobileSectionOpen === 'services' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSectionOpen === 'services' && (
                  <div className="p-2 space-y-1 bg-white border-t border-[#E5E9E3]">
                    {citizenServicesItems.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href || '#'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-[#F7F8F5] transition-colors"
                      >
                        {item.icon && <span className="shrink-0 mt-0.5">{item.icon}</span>}
                        <div className="min-w-0">
                          <div className="font-semibold text-[#202820]">{item.label}</div>
                          {item.description && <div className="text-[11px] text-[#687368] truncate">{item.description}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Resources Accordion */}
              <div className="border border-[#E5E9E3] rounded-2xl overflow-hidden bg-[#FAFBF9]">
                <button
                  type="button"
                  onClick={() => setMobileSectionOpen(mobileSectionOpen === 'resources' ? null : 'resources')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-[#202820] hover:bg-white transition-colors cursor-pointer"
                >
                  <span>Resources & System</span>
                  <ChevronDown className={`h-4 w-4 text-[#687368] transition-transform duration-200 ${mobileSectionOpen === 'resources' ? 'rotate-180' : ''}`} />
                </button>
                {mobileSectionOpen === 'resources' && (
                  <div className="p-2 space-y-1 bg-white border-t border-[#E5E9E3]">
                    {resourcesItems.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href || '#'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-[#F7F8F5] transition-colors"
                      >
                        {item.icon && <span className="shrink-0 mt-0.5">{item.icon}</span>}
                        <div className="min-w-0">
                          <div className="font-semibold text-[#202820]">{item.label}</div>
                          {item.description && <div className="text-[11px] text-[#687368] truncate">{item.description}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Footer Status & Info */}
              <div className="pt-2 border-t border-[#E5E9E3] flex items-center justify-between text-xs text-[#687368] px-2">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${backendOnline ? 'bg-[#176B52]' : 'bg-slate-400'}`} />
                  <span>API Engine: {backendOnline ? 'Online' : 'Connecting'}</span>
                </div>
                <span>GovSchemeAI 2026</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
