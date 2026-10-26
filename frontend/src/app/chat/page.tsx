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
  Info,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Paperclip
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
      return <strong key={i} className="font-bold text-[#202820]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-[#4F594F]">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded-md bg-[#FAF5E9] border border-[#F3E7CA] text-[#176B52] font-mono text-xs">
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
        <p key={key} className="text-xs sm:text-sm leading-relaxed mb-2.5 last:mb-0 text-[#202820]">
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
        <div key={key} className="my-3 border border-[#E5E9E3] rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            {tableHeaders.length > 0 && (
              <thead className="bg-[#F7F8F5] text-[#202820] font-bold border-b border-[#E5E9E3]">
                <tr>
                  {tableHeaders.map((header, hIdx) => (
                    <th key={hIdx} className="p-2.5 sm:p-3 border-r border-[#E5E9E3] last:border-r-0">{header}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#E5E9E3] text-[#4F594F]">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#F7F8F5]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 sm:p-3 border-r border-[#E5E9E3] last:border-r-0">{renderInline(cell)}</td>
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
          <div key={`ul-${i}`} className="flex items-start gap-2 my-1.5 text-xs sm:text-sm text-[#202820]">
            <span className="text-[#176B52] mt-0.5 shrink-0 font-bold">•</span>
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  const copyMessage = (text: string, idx: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
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
      <div className="flex items-center justify-between border-b border-[#E5E9E3] pb-3 mb-4 shrink-0 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#E7F3EC] flex items-center justify-center text-[#176B52]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-base sm:text-lg font-bold text-[#202820]">
                Citizen Scheme Advisor AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-[#176B52] bg-[#E7F3EC] px-2 py-0.5 rounded-full border border-[#176B52]/20">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Guidelines</span>
              </span>
            </div>
            <p className="text-[10px] text-[#687368] font-medium uppercase tracking-wider">
              {sessionId ? `Session Active • ${sessionId.slice(0, 8)}...` : 'Deterministic Context Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </div>
          )}

          <button
            type="button"
            onClick={resetChat}
            className="p-2 rounded-xl bg-white hover:bg-[#F7F8F5] border border-[#E5E9E3] text-xs text-[#202820] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Start new conversation"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#176B52]" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Stream (Zenith Style Reference Image 2) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5 mb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
          >
            {msg.role === 'user' ? (
              // User Bubble: soft peach/sand tone #F5E7DA with dark text (Zenith style)
              <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl bg-[#F5E7DA] text-[#202820] text-xs sm:text-sm font-medium shadow-xs">
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              // Assistant Message: clean light card with actions below (Zenith style)
              <div className="max-w-[95%] sm:max-w-[88%] space-y-2">
                <div className="p-5 rounded-2xl bg-white border border-[#E5E9E3] shadow-xs text-[#202820] leading-relaxed">
                  {renderMarkdown(msg.content)}
                </div>

                {/* Micro Action Bar under Assistant response (copy, thumbs up) */}
                {!msg.isStreaming && msg.content && (
                  <div className="flex items-center gap-2 px-1 text-[#8A968A] text-xs">
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.content, idx)}
                      className="hover:text-[#176B52] transition-colors p-1 rounded hover:bg-white flex items-center gap-1 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-[#176B52]" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="text-[10px]">{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      className="hover:text-[#176B52] transition-colors p-1 rounded hover:bg-white cursor-pointer"
                      title="Helpful"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="hover:text-[#176B52] transition-colors p-1 rounded hover:bg-white cursor-pointer"
                      title="Not helpful"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!loading && messages.length <= 2 && (
        <div className="mb-3 shrink-0 animate-fade-in">
          <p className="text-[10px] text-[#687368] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#E8A126]" />
            <span>Popular Citizen Queries:</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {getSuggestedQuestions().map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-xs px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E9E3] hover:border-[#176B52]/40 text-[#202820] hover:text-[#176B52] flex items-center justify-between gap-2 transition-all text-left cursor-pointer shadow-xs group"
              >
                <span className="line-clamp-1">{q}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#176B52] shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar (Zenith Pill Style) */}
      <div className="space-y-2 shrink-0">
        <div className="relative flex items-center bg-white rounded-2xl border border-[#E5E9E3] shadow-sm px-3 py-1.5 focus-within:border-[#176B52] transition-all">
          <button
            type="button"
            className="p-2 text-[#8A968A] hover:text-[#202820] transition-colors cursor-pointer"
            title="Tools & Attachments"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="How can I help you find government schemes today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={500}
            className="w-full px-2 py-2 text-xs sm:text-sm bg-transparent text-[#202820] placeholder-[#8A968A] focus:outline-none"
          />

          <button
            type="button"
            onClick={() => handleSendMessage(input)}
            disabled={loading || !input.trim()}
            className="h-8 w-8 rounded-full bg-[#176B52] hover:bg-[#124C3D] text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-xs disabled:cursor-not-allowed shrink-0"
            aria-label="Send query"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#8A968A] px-2">
          <span className="flex items-center gap-1">
            <Info className="h-3 w-3 text-[#176B52]" />
            <span>AI responses are informational. Verify criteria on official government department portals.</span>
          </span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}
