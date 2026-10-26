'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { 
  Send, 
  RotateCcw, 
  Bot, 
  User as UserIcon, 
  WifiOff, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  sources?: string[];
}

/** Render inline formatting for bold, italic, and inline code */
function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-slate-300">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-[#0b0f19] border border-slate-750 text-blue-300 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Markdown parser for tables, lists, bold, and paragraphs */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let currentParagraphLines: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraphLines.length > 0) {
      renderedElements.push(
        <p key={key} className="text-xs sm:text-sm leading-relaxed mb-2.5 last:mb-0 text-slate-200">
          {currentParagraphLines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {renderInline(line)}
              {lIdx < currentParagraphLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
      currentParagraphLines = [];
    }
  };

  const flushTable = (key: string) => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      renderedElements.push(
        <div key={key} className="my-3 border border-slate-800 rounded-xl overflow-hidden bg-[#0c101c]">
          <table className="w-full text-left text-xs border-collapse">
            {tableHeaders.length > 0 && (
              <thead className="bg-[#111827] text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  {tableHeaders.map((header, hIdx) => (
                    <th key={hIdx} className="p-2.5 sm:p-3 border-r border-slate-800 last:border-r-0">{header}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 sm:p-3 border-r border-slate-800 last:border-r-0">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph(`p-before-tbl-${i}`);
      inTable = true;
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map(c => c.trim());
      
      if (cells.every(c => c.match(/^:?-+:?$/))) {
        continue;
      }
      
      if (tableHeaders.length === 0) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
    } else {
      if (inTable) {
        flushTable(`tbl-${i}`);
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        flushParagraph(`p-before-bullet-${i}`);
        const content = trimmed.replace(/^[-•*]\s*/, '');
        renderedElements.push(
          <div key={`ul-${i}`} className="flex items-start gap-2 my-1 text-xs sm:text-sm text-slate-200">
            <span className="text-blue-400 mt-1 shrink-0">•</span>
            <span>{renderInline(content)}</span>
          </div>
        );
      } else if (trimmed === '') {
        flushParagraph(`p-blank-${i}`);
      } else {
        currentParagraphLines.push(line);
      }
    }
  }

  flushParagraph('p-final');
  flushTable('tbl-final');

  return renderedElements;
}

export default function ChatAssistant() {
  const { language } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Namaste! I am your GovSchemeAI Advisor. Ask me anything about Indian central and state welfare programs, eligibility rules, required application documents, or step-by-step submission procedures.",
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setInput('');
    setConnectionError(false);

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    let accumulatedResponse = '';

    try {
      await api.sendChatMessageStream({
        message: text,
        sessionId,
        language: (language === 'hi' ? 'hi' : 'en') as 'en' | 'hi',
        onChunk: (chunk) => {
          accumulatedResponse += chunk;
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              last.content = accumulatedResponse;
            }
            return next;
          });
        },
        onDone: (data) => {
          setSessionId(data.session_id);
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              last.isStreaming = false;
            }
            return next;
          });
          setLoading(false);
        },
        onError: (err) => {
          console.error('Streaming error:', err);
          setConnectionError(true);
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              last.content = accumulatedResponse 
                ? accumulatedResponse + '\n\n*(Connection interrupted)*'
                : 'I could not connect to the Citizen Advisor engine. Please verify that the local backend service is running.';
              last.isStreaming = false;
            }
            return next;
          });
          setLoading(false);
        }
      });
    } catch (err: unknown) {
      console.error('Chat error:', err);
      setConnectionError(true);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach backend service. Please check API server.',
        },
      ]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const getSuggestedQuestions = () => {
    if (language === 'hi') {
      return [
        'मैं किन सरकारी योजनाओं के लिए पात्र हूं?',
        'PM-KISAN आवेदन हेतु कौन से दस्तावेज़ चाहिए?',
        'मुद्रा ऋण योजना में कितना ब्याज लगेगा?',
        'कॉलेज छात्रों के लिए छात्रवृत्तियों की सूची दिखाएं',
      ];
    }
    return [
      'What schemes can I get as a small farmer?',
      'Documents required for Pradhan Mantri Mudra Loan',
      'How to apply for PM-KISAN installment credits?',
      'Higher education scholarships for female students',
    ];
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Namaste! I am your GovSchemeAI Advisor. Ask me anything about Indian central and state welfare programs, eligibility rules, required application documents, or step-by-step submission procedures.",
      },
    ]);
    setSessionId(undefined);
    setConnectionError(false);
  };

  return (
    <div className="mx-auto max-w-4xl w-full py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col relative z-10" style={{ height: 'calc(100vh - 110px)' }}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-base sm:text-lg font-bold text-slate-100">
                Citizen Scheme Advisor AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Guidelines</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {sessionId ? `Session Active • ${sessionId.slice(0, 8)}...` : 'Deterministic Context Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </div>
          )}

          <button
            type="button"
            onClick={resetChat}
            className="p-2 rounded-xl bg-[#111827] hover:bg-[#1e293b] border border-slate-800 text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="Start new conversation"
          >
            <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
          >
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#111827] border border-slate-800 text-blue-400'
              }`}
            >
              {msg.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl border ${
                  msg.role === 'user'
                    ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none shadow-sm'
                    : 'text-slate-200 rounded-tl-none border-slate-800 bg-[#111827] shadow-sm'
                } ${msg.isStreaming ? 'typewriter-cursor' : ''}`}
              >
                {msg.role === 'assistant'
                  ? <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  : <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                }
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!loading && messages.length <= 2 && (
        <div className="mb-3 shrink-0 animate-fade-in">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Popular Citizen Queries:</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {getSuggestedQuestions().map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-xs px-3.5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white flex items-center justify-between gap-2 transition-all text-left cursor-pointer group"
              >
                <span className="line-clamp-1">{q}</span>
                <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="space-y-2 shrink-0">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask Citizen Advisor about schemes, eligibility, documents, or subsidies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={500}
            className="w-full pl-4 pr-14 py-3.5 rounded-2xl text-xs sm:text-sm bg-[#111827] border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSendMessage(input)}
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 cursor-pointer shadow-xs disabled:cursor-not-allowed"
              aria-label="Send query"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Info className="h-2.5 w-2.5 text-slate-400" />
            <span>AI responses are informational. Verify criteria on official government department portals.</span>
          </span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}
