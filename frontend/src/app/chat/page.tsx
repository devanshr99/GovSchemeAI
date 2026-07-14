'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { MessageSquare, Send, Sparkles, RefreshCw, Bot, User as UserIcon, WifiOff, FileText, ArrowRight } from 'lucide-react';

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
      return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.06] text-orange-300 font-mono text-xs">{part.slice(1, -1)}</code>;
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
        <p key={key} className="text-sm leading-relaxed mb-3 last:mb-0 text-slate-200">
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

    // Check for Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph(`p-before-tbl-${i}`);
      inTable = true;
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map(c => c.trim());
      
      // If it is divider row like |---|---|
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

      // Check for bullet line
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        flushParagraph(`p-before-bullet-${i}`);
        const content = trimmed.replace(/^[-•*]\s*/, '');
        renderedElements.push(
          <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-1.5">
            <li className="text-sm leading-relaxed pl-2 text-slate-300">
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

    // Append user message immediately
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    // Append assistant streaming placeholder
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
                ? accumulatedResponse + '\n\n*(Connection lost. Please try again)*'
                : 'I could not connect to the AI service. Please make sure the backend is running and try again.';
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
          content: 'I could not connect to the AI service. Please make sure the backend is running and try again.',
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
        'मैं किन योजनाओं के लिए पात्र हूं?',
        'PM-KISAN के लिए कैसे आवेदन करें?',
        'आयुष्मान भारत के लिए कौन से दस्तावेज चाहिए?',
        'योजनाओं की पात्रता कैसे जाँचे?',
      ];
    }
    return [
      'Which schemes am I eligible for?',
      'How to apply for PM-KISAN?',
      'What documents do I need for Ayushman Bharat?',
      'Compare PM-KISAN and PM-AWAS',
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
    <div className="mx-auto max-w-3xl w-full py-8 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-orange-500/20 border border-white/[0.08] flex items-center justify-center">
            <Bot className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">{t('chatAssistant')}</h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'New Conversation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connectionError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
              <WifiOff className="h-3.5 w-3.5" />
              Backend offline
            </div>
          )}

          <button
            onClick={resetChat}
            className="p-2 rounded-lg hover:bg-white/[0.03] text-xs text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-white/[0.08]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5 mb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
          >
            {/* Avatar */}
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'user'
                  ? 'bg-blue-600 border border-blue-500'
                  : 'bg-gradient-to-br from-orange-500/20 to-blue-500/20 border border-white/[0.08]'
              }`}
            >
              {msg.role === 'user'
                ? <UserIcon className="h-4 w-4 text-white" />
                : <Sparkles className="h-4 w-4 text-orange-400" />
              }
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl border leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 border-blue-500/50 text-white rounded-tr-none'
                    : 'glass-panel text-slate-100 rounded-tl-none'
                } ${msg.isStreaming ? 'typewriter-cursor' : ''}`}
              >
                {msg.role === 'assistant'
                  ? <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  : <p className="text-sm leading-relaxed">{msg.content}</p>
                }
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!loading && (
        <div className="mb-4 shrink-0 animate-fade-in">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Suggested Actions:</p>
          <div className="flex flex-wrap gap-2">
            {getSuggestedQuestions().map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 text-slate-300 hover:text-blue-400 hover:bg-blue-500/5 flex items-center gap-1.5 transition-all text-left cursor-pointer"
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
          className="w-full pl-4 pr-14 py-4 rounded-2xl text-sm disabled:opacity-60"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {input.length > 400 && (
            <span className="text-[10px] text-slate-500 font-mono">{500 - input.length}</span>
          )}
          <button
            onClick={() => handleSendMessage(input)}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
