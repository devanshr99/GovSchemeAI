'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, X, TrendingUp, History, ArrowRight, ShieldCheck, Landmark } from 'lucide-react';
import { COMPREHENSIVE_SCHEMES } from '../../data/comprehensiveSchemes';
import { SchemeDetail } from '../../types/scheme';
import Link from 'next/link';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [results, setResults] = useState<SchemeDetail[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const popularQueries = ["Scholarship", "PM-KISAN", "Startup India", "Mudra Loan", "Lakhpati Didi", "PM Internship", "Ayushman Bharat"];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matches = COMPREHENSIVE_SCHEMES.filter(
      s => s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)) || s.ministry?.toLowerCase().includes(q)
    );
    setResults(matches);
  }, [query]);

  // Voice Search via Web Speech API
  const toggleVoiceSearch = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please type your search query.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in">
      <div className="gov-card w-full max-w-2xl rounded-3xl border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Bar */}
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-3 bg-slate-900/90 relative">
          <Search className="h-5 w-5 text-blue-400 shrink-0" />

          <input
            ref={inputRef}
            type="text"
            placeholder={isListening ? "Listening... Speak your scheme search query" : "Search 500+ Central & State schemes, scholarships, loans..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm sm:text-base text-white bg-transparent outline-none placeholder:text-slate-500 font-medium"
          />

          {/* Voice Search Mic Button */}
          <button
            onClick={toggleVoiceSearch}
            title={isListening ? "Stop listening" : "Voice Search"}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isListening
                ? 'bg-red-950 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Quick Popular Keywords */}
          {!query && (
            <div className="space-y-3">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                Popular Searches
              </div>

              <div className="flex flex-wrap gap-2">
                {popularQueries.map((pop, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(pop)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-blue-500/30 text-slate-300 hover:text-blue-300 transition-all cursor-pointer"
                  >
                    {pop}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {query && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                Matching Schemes ({results.length})
              </div>

              {results.length > 0 ? (
                results.map((sch) => (
                  <Link
                    href={`/schemes/${sch.slug}`}
                    key={sch.id}
                    onClick={onClose}
                    className="block p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-blue-500/30 hover:bg-slate-900 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-extrabold text-blue-400">
                        {sch.category_name || 'General Sector'}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-amber-400">
                        {sch.level || 'Central'}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors">
                      {sch.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sch.benefits_amount}</div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No matching schemes found for "{query}". Try searching for 'Scholarship' or 'Mudra'.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
