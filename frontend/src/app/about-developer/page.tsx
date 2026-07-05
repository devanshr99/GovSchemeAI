'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Terminal, Code, Cpu, ExternalLink } from 'lucide-react';

export default function AboutDeveloper() {
  return (
    <div className="relative min-h-[90vh] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col justify-start">
      {/* Background Decorative Rings */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/20 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl w-full relative z-10 space-y-12">
        {/* Back Link */}
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors duration-200 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Details */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-xs font-semibold text-blue-400">
                <Terminal className="h-3.5 w-3.5" />
                <span>Available for Opportunities</span>
              </div>

              {/* Name */}
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
                Devansh Rastogi
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base font-semibold bg-gradient-to-r from-orange-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent flex flex-wrap gap-2 items-center">
                <span>AI Developer</span>
                <span className="text-slate-600">•</span>
                <span>Full Stack Developer</span>
                <span className="text-slate-600">•</span>
                <span>B.Tech Computer Science Student</span>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              <p>
                Hi, I'm Devansh Rastogi, a passionate Computer Science student who enjoys building AI-powered and full-stack applications that solve real-world problems.
              </p>
              <p>
                GovSchemeAI was created with the vision of making Indian Government welfare schemes easy to discover and understand through Artificial Intelligence. Instead of manually searching multiple websites, users receive personalized recommendations in seconds.
              </p>
              <p>
                I enjoy designing scalable software systems, building intelligent applications, and continuously learning modern technologies.
              </p>
            </div>

            {/* Quick Skills highlights */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">Next.js & React</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">Python & FastAPI</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">Artificial Intelligence</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">SQL & Database Design</span>
            </div>
          </div>

          {/* Right Column: Premium Tech Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[360px] aspect-[3/4] rounded-2xl overflow-hidden glass-panel border border-white/[0.08] p-3 shadow-2xl shadow-blue-500/10 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-orange-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900/50">
                <Image
                  src="/developer_photo.jpg"
                  alt="Devansh Rastogi - Developer Photo"
                  fill
                  sizes="(max-w-768px) 100vw, 360px"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Connect Section */}
        <div className="pt-8 border-t border-white/[0.06] space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              Connect With Me
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Feel free to reach out for collaborations, project inquiries, or recruiting opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GitHub Card */}
            <a
              href="https://github.com/devanshr99"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-6 rounded-2xl border border-white/[0.06] hover:border-slate-400/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300 group-hover:text-white transition-colors">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm group-hover:text-white">GitHub</h3>
                  <p className="text-xs text-slate-400">@devanshr99</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </a>

            {/* LinkedIn Card */}
            <a
              href="https://www.linkedin.com/in/devansh-rastogi-a86a83323/"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-6 rounded-2xl border border-white/[0.06] hover:border-[#0a66c2]/40 hover:shadow-[0_0_20px_rgba(10,102,194,0.15)] transition-all duration-300 group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#0a66c2]/10 flex items-center justify-center border border-[#0a66c2]/20 text-[#0a66c2] group-hover:bg-[#0a66c2]/20 group-hover:text-[#00a0dc] transition-all">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm group-hover:text-white">LinkedIn</h3>
                  <p className="text-xs text-slate-400">Devansh Rastogi</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </a>

            {/* Email Card */}
            <a
              href="mailto:devanshrastogi993@gmail.com"
              className="glass-panel p-6 rounded-2xl border border-white/[0.06] hover:border-orange-500/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all duration-300 group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400 group-hover:bg-orange-500/20 group-hover:text-orange-300 transition-all">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm group-hover:text-white">Email</h3>
                  <p className="text-xs text-slate-400">devanshrastogi993@gmail.com</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
