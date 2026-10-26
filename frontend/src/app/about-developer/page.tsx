'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Terminal, ExternalLink, Sparkles, Code2, Database, Cpu } from 'lucide-react';

export default function AboutDeveloper() {
  return (
    <div className="relative min-h-[85vh] py-10 sm:py-14 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col justify-start relative z-10 animate-fade-in">
      <div className="mx-auto max-w-6xl w-full relative z-10 space-y-12">
        
        {/* Back Link */}
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#202820] hover:text-[#176B52] transition-colors duration-200 px-3.5 py-2 rounded-xl border border-[#E5E9E3] bg-white hover:bg-[#F7F8F5] shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#176B52]" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#176B52]/20 bg-[#E7F3EC] text-xs font-semibold text-[#176B52]">
                <Terminal className="h-3.5 w-3.5" />
                <span>Available for Engineering Opportunities</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#202820] tracking-tight">
                Devansh Rastogi
              </h1>

              <p className="text-xs sm:text-sm font-semibold text-[#176B52] flex flex-wrap gap-2 items-center">
                <span>AI Developer</span>
                <span className="text-[#C5CEC4]">•</span>
                <span>Full Stack Engineer</span>
                <span className="text-[#C5CEC4]">•</span>
                <span>B.Tech CS Student</span>
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#4F594F] leading-relaxed font-normal">
              <p>
                Hi, I&apos;m Devansh Rastogi, a Computer Science student passionate about building AI-powered platforms and full-stack software that deliver real, measurable utility to citizens.
              </p>
              <p>
                GovSchemeAI was engineered to solve information fragmentation across Indian Government welfare schemes. By combining deterministic rule matching with conversational AI guidance, citizens can discover central and state schemes they qualify for in seconds without bureaucratic confusion.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl border border-[#E5E9E3] bg-white flex items-center gap-3 shadow-xs">
                <Code2 className="h-4 w-4 text-[#176B52] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#202820] block">Next.js & React 19</span>
                  <span className="text-[11px] text-[#687368]">Tailwind CSS & Turbopack</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#E5E9E3] bg-white flex items-center gap-3 shadow-xs">
                <Cpu className="h-4 w-4 text-[#176B52] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#202820] block">FastAPI & Python</span>
                  <span className="text-[11px] text-[#687368]">Deterministic Matcher</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#E5E9E3] bg-white flex items-center gap-3 shadow-xs">
                <Database className="h-4 w-4 text-[#176B52] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#202820] block">PostgreSQL & SQLite</span>
                  <span className="text-[11px] text-[#687368]">Indexed Scheme Matrix</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl border border-[#E5E9E3] bg-white flex items-center gap-3 shadow-xs">
                <Sparkles className="h-4 w-4 text-[#E8A126] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#202820] block">Citizen Advisor AI</span>
                  <span className="text-[11px] text-[#687368]">RAG Scheme Guidance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Photo */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-3xl overflow-hidden border border-[#E5E9E3] p-3 shadow-md group relative bg-white">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#F7F8F5]">
                <Image
                  src="/developer_photo.jpg"
                  alt="Devansh Rastogi"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Connect Section */}
        <div className="pt-8 border-t border-[#E5E9E3] space-y-6">
          <div className="text-left space-y-1">
            <h2 className="font-heading text-2xl font-bold text-[#202820]">
              Connect With Me
            </h2>
            <p className="text-xs text-[#687368]">
              Reach out for project collaborations, software engineering roles, or technical inquiries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* GitHub Card */}
            <a
              href="https://github.com/devanshr99"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl border border-[#E5E9E3] bg-white hover:border-[#176B52]/40 hover:bg-[#F7F8F5] transition-all group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-[#F7F8F5] flex items-center justify-center border border-[#E5E9E3] text-[#202820] group-hover:text-[#176B52] transition-colors">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[#202820] text-xs">GitHub</h3>
                  <p className="text-[11px] text-[#687368]">@devanshr99</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-[#8A968A] group-hover:text-[#176B52] transition-colors" />
            </a>

            {/* LinkedIn Card */}
            <a
              href="https://www.linkedin.com/in/devansh-rastogi-a86a83323/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl border border-[#E5E9E3] bg-white hover:border-[#176B52]/40 hover:bg-[#F7F8F5] transition-all group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-[#F7F8F5] flex items-center justify-center border border-[#E5E9E3] text-[#176B52] transition-all">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[#202820] text-xs">LinkedIn</h3>
                  <p className="text-[11px] text-[#687368]">Devansh Rastogi</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-[#8A968A] group-hover:text-[#176B52] transition-colors" />
            </a>

            {/* Email Card */}
            <a
              href="mailto:devanshrastogi993@gmail.com"
              className="p-5 rounded-2xl border border-[#E5E9E3] bg-white hover:border-[#176B52]/40 hover:bg-[#F7F8F5] transition-all group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-[#FAF5E9] flex items-center justify-center border border-[#F3E7CA] text-[#E8A126] transition-all">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[#202820] text-xs">Email</h3>
                  <p className="text-[11px] text-[#687368]">devanshrastogi993@gmail.com</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-[#8A968A] group-hover:text-[#E8A126] transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
