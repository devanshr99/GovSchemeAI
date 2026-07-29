'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { MessageSquare, Send, RefreshCw, User as UserIcon, WifiOff, FileText, ArrowRight, ShieldCheck, Landmark } from 'lucide-react';

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
      return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.08] text-amber-300 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Powerful, premium markdown parser for tables, lists, bold, and paragraphs */
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
        <p key={key} className="text-xs sm:text-sm leading-relaxed mb-3 last:mb-0 text-slate-200">
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
        <div key={key} className="markdown-table-wrapper my-3">
          <table className="markdown-table">
            {tableHeaders.length > 0 && (
              <thead>
                <tr>
                  {tableHeaders.map((header, hIdx) => (
                    <th key={hIdx}>{header}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{renderInline(cell)}</td>
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
          <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-1.5">
            <li className="text-xs sm:text-sm leading-relaxed pl-2 text-slate-300">
              {renderInline(content)}
            </li>
          </ul>
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
  const { language, t } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('chatWelcome'),
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
                ? accumulatedResponse + '\n\n*(Connection interrupted. Please retry)*'
                : 'Could not connect to the Scheme Advisor service. Please check your backend connection.';
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
          content: 'Could not connect to the Digital Scheme Advisor service. Please ensure backend server is running.',
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
        'PM-KISAN आवेदन हेतु आवश्यक दस्तावेज़ क्या हैं?',
        'आयुष्मान भारत के स्वास्थ्य लाभ कैसे लें?',
        'छात्रवृत्तियों की पात्रता सीमा क्या है?',
      ];
    }
    return [
      'Which central schemes am I eligible for?',
      'How to apply for PM-KISAN grants?',
      'Required documents for Ayushman Bharat?',
      'Education scholarships for SC/ST/OBC students',
    ];
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: t('chatWelcome'),
      },
    ]);
    setSessionId(undefined);
    setConnectionError(false);
  };

  return (
    <div className="mx-auto max-w-4xl w-full py-6 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col" style={{ height: 'calc(100vh - 110px)' }}>
      {/* Header Banner */}
      <div className="gov-card p-4 rounded-2xl border border-white/[0.08] mb-4 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>{t('chatAssistant')}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                Official Desk
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {sessionId ? `Session Reference: ${sessionId.slice(0, 8)}...` : 'National Scheme Consultation Desk'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionError && (
            <div className="flex items-center gap-1.5 text-xs text-red-300 bg-red-950/60 border border-red-500/30 px-2.5 py-1 rounded-lg">
              <WifiOff className="h-3.5 w-3.5 text-red-400" />
              Offline
            </div>
          )}

          <button
            onClick={resetChat}
            className="px-3 py-1.5 rounded-xl hover:bg-white/[0.04] text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-white/[0.08] bg-slate-900/60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Desk</span>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
          >
            {/* Avatar */}
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 border border-blue-500 text-white'
                  : 'bg-slate-900 border border-blue-500/30 text-blue-400'
              }`}
            >
              {msg.role === 'user'
                ? <UserIcon className="h-4 w-4" />
                : <Landmark className="h-4 w-4 text-blue-300" />
              }
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl border leading-relaxed text-xs sm:text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 border-blue-500/50 text-white rounded-tr-none shadow'
                    : 'gov-card text-slate-100 rounded-tl-none border-white/[0.08]'
                }`}
              >
                {msg.role === 'assistant'
                  ? <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  : <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
                }
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!loading && (
        <div className="mb-3 shrink-0 animate-fade-in">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Recommended Queries:</p>
          <div className="flex flex-wrap gap-2">
            {getSuggestedQuestions().map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs px-3 py-2 rounded-xl bg-slate-900/80 border border-white/[0.08] hover:border-blue-500/40 text-slate-300 hover:text-blue-300 hover:bg-blue-950/40 flex items-center gap-1.5 transition-all text-left cursor-pointer"
              >
                <span>{q}</span>
                <ArrowRight className="h-3 w-3 opacity-60 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="relative shrink-0">
        <input
          ref={inputRef}
          type="text"
          placeholder={t('chatPromptPlaceholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          maxLength={500}
          className="w-full pl-4 pr-14 py-3.5 rounded-2xl text-xs sm:text-sm bg-slate-900 border border-white/[0.12] focus:border-blue-500 text-white disabled:opacity-60 shadow-lg"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {input.length > 400 && (
            <span className="text-[10px] text-slate-500 font-mono">{500 - input.length}</span>
          )}
          <button
            onClick={() => handleSendMessage(input)}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer shadow"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

