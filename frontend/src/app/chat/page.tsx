'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Send, Sparkles, RefreshCw, Bot, User as UserIcon, WifiOff, ArrowRight } from 'lucide-react';

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
      return <strong key={i} className="font-extrabold text-[#F8FAFC]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-[#CBD5E1]">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded-lg bg-[#120E1E] border border-[#251B3B] text-[#A78BFA] font-mono text-xs">{part.slice(1, -1)}</code>;
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
        <p key={key} className="text-xs sm:text-sm leading-relaxed mb-2.5 last:mb-0 text-[#F8FAFC]">
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
    if (inTable && tableHeaders.length > 0) {
      renderedElements.push(
        <div key={key} className="my-3 overflow-x-auto rounded-xl border border-[#251B3B] bg-[#120E1E]">
          <table className="w-full text-xs text-left text-[#CBD5E1]">
            <thead className="bg-[#171226] border-b border-[#251B3B] text-[#F8FAFC]">
              <tr>
                {tableHeaders.map((h, idx) => (
                  <th key={idx} className="px-3.5 py-2 font-bold">{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#251B3B]">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#1B152B]">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph(`p-${idx}`);
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        return;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable(`table-${idx}`);
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph(`p-${idx}`);
      renderedElements.push(
        <h3 key={`h3-${idx}`} className="text-sm font-bold text-[#A78BFA] mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph(`p-${idx}`);
      renderedElements.push(
        <h2 key={`h2-${idx}`} className="text-base font-extrabold text-[#F8FAFC] mt-4 mb-1.5">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph(`p-${idx}`);
      renderedElements.push(
        <li key={`li-${idx}`} className="text-xs sm:text-sm text-[#CBD5E1] ml-4 list-disc mb-1">
          {renderInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      flushParagraph(`p-${idx}`);
      const content = trimmed.replace(/^\d+\.\s/, '');
      renderedElements.push(
        <li key={`oli-${idx}`} className="text-xs sm:text-sm text-[#CBD5E1] ml-4 list-decimal mb-1">
          {renderInline(content)}
        </li>
      );
      return;
    }

    if (!trimmed) {
      flushParagraph(`p-${idx}`);
      return;
    }

    currentParagraphLines.push(line);
  });

  flushParagraph('p-final');
  flushTable('table-final');

  return renderedElements;
}

export default function ChatPage() {
  const { language } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Welcome to Citizen Scheme Advisor AI. Ask me about central and state government schemes, eligibility requirements, required documents, or application guidelines.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [connectionError, setConnectionError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: textToSend.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setConnectionError(false);

    const assistantMsgIndex = messages.length + 1;
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', isStreaming: true },
    ]);

    let accumulatedResponse = '';

    try {
      await api.sendChatMessageStream({
        message: textToSend.trim(),
        sessionId: sessionId,
        language: (language === 'hi' ? 'hi' : 'en') as 'en' | 'hi',
        onChunk: (chunk: string) => {
          accumulatedResponse += chunk;
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantMsgIndex]) {
              next[assistantMsgIndex].content = accumulatedResponse;
              next[assistantMsgIndex].isStreaming = true;
            }
            return next;
          });
        },
        onDone: (data) => {
          if (data.session_id) {
            setSessionId(data.session_id);
          }
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantMsgIndex]) {
              next[assistantMsgIndex].isStreaming = false;
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
                ? accumulatedResponse + '\n\n*(Connection lost)*'
                : 'I could not connect to the Citizen Advisor engine. Verify backend status.';
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
        'छात्रवृत्तियों की सूची दिखाएं',
      ];
    }
    return [
      'Which schemes am I eligible for?',
      'How do I apply for PM-KISAN installment credits?',
      'What documents are required for Mudra loans?',
      'Find top scholarships for college students',
    ];
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Welcome to Citizen Scheme Advisor AI. Ask me about central and state government schemes, eligibility requirements, required documents, or application guidelines.",
      },
    ]);
    setSessionId(undefined);
    setConnectionError(false);
  };

  return (
    <div className="mx-auto max-w-4xl w-full py-8 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col relative z-10" style={{ height: 'calc(100vh - 120px)' }}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#251B3B] pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center text-[#A78BFA]">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F8FAFC]">Citizen Scheme Advisor AI</h1>
            <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wider">
              {sessionId ? `Session ID: ${sessionId.slice(0, 8)}...` : 'RAG Verification Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl">
              <WifiOff className="h-3.5 w-3.5" />
              Offline
            </div>
          )}

          <button
            onClick={resetChat}
            className="p-2 rounded-xl bg-[#120E1E] border border-[#251B3B] text-xs text-[#CBD5E1] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#A78BFA]" />
            <span>Reset Chat</span>
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
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-[#120E1E] border border-[#8B5CF6]/35 text-[#A78BFA]'
              }`}
            >
              {msg.role === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl border ${
                  msg.role === 'user'
                    ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white rounded-tr-none shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                    : 'purple-card text-[#F8FAFC] rounded-tl-none border-[#251B3B]'
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
          <p className="text-[9px] text-[#94A3B8] font-extrabold uppercase tracking-wider mb-2">Suggested Prompt Topics:</p>
          <div className="flex flex-wrap gap-2">
            {getSuggestedQuestions().map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs px-3.5 py-2 rounded-xl bg-[#120E1E] border border-[#251B3B] hover:border-[#8B5CF6]/45 text-[#CBD5E1] hover:text-white flex items-center gap-1.5 transition-all text-left cursor-pointer"
              >
                <span>{q}</span>
                <ArrowRight className="h-3 w-3 text-[#A78BFA] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="relative shrink-0">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask Citizen Advisor about any government scheme..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          maxLength={500}
          className="w-full pl-4 pr-14 py-3.5 rounded-2xl text-xs bg-[#120E1E] border border-[#251B3B] text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#8B5CF6] focus:outline-none"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={() => handleSendMessage(input)}
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
