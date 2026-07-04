'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { MessageSquare, Send, Sparkles, RefreshCw, Bot, User as UserIcon, Wifi, WifiOff } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

/** Simple inline markdown renderer for bold, newlines, and bullets */
function renderMarkdown(text: string) {
  // Split by double newlines to create paragraphs
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, pIdx) => {
    // Process bullet lists
    const lines = para.split('\n');
    const isBullet = lines.every(l => l.startsWith('- ') || l.startsWith('• ') || l.startsWith('* ') || l.trim() === '');
    if (isBullet && lines.some(l => l.startsWith('- ') || l.startsWith('• ') || l.startsWith('* '))) {
      return (
        <ul key={pIdx} className="list-disc list-inside space-y-1 my-1">
          {lines.filter(l => l.trim()).map((line, lIdx) => (
            <li key={lIdx} className="text-sm leading-relaxed">
              {renderInline(line.replace(/^[-•*]\s*/, ''))}
            </li>
          ))}
        </ul>
      );
    }
    // Regular paragraph with newlines
    return (
      <p key={pIdx} className="text-sm leading-relaxed mb-1 last:mb-0">
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {renderInline(line)}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function renderInline(text: string) {
  // Render **bold** and *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
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

    // Append user message immediately for responsiveness
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await api.sendChatMessage({
        message: text,
        sessionId,
        language: (language === 'hi' ? 'hi' : 'en') as 'en' | 'hi',
      });

      setSessionId(response.session_id);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.response,
        sources: response.sources,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setConnectionError(true);
      }
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not connect to the AI service. Please make sure the backend is running and try again.',
        },
      ]);
    } finally {
      setLoading(false);
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const suggestedQuestions = language === 'hi'
    ? [
        'मैं किन योजनाओं के लिए पात्र हूं?',
        'PM-KISAN के लिए कैसे आवेदन करें?',
        'आयुष्मान भारत के लिए कौन से दस्तावेज चाहिए?',
        'बेटी बचाओ बेटी पढ़ाओ क्या है?',
      ]
    : [
        'What schemes am I eligible for?',
        'How to apply for PM-KISAN?',
        'What documents do I need for Ayushman Bharat?',
        'What is Pradhan Mantri Awas Yojana?',
      ];

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
          {/* Connection status */}
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
            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl border leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 border-blue-500/50 text-white rounded-tr-none'
                    : 'glass-panel text-slate-100 rounded-tl-none'
                }`}
              >
                {msg.role === 'assistant'
                  ? <div className="space-y-1">{renderMarkdown(msg.content)}</div>
                  : <p className="text-sm leading-relaxed">{msg.content}</p>
                }

                {/* Source chips */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.08] space-y-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">
                      {t('chatSources')}:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] bg-slate-800 border border-white/[0.05] text-blue-400 px-2 py-0.5 rounded font-semibold"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 flex-row animate-fade-in">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500/20 to-blue-500/20 border border-white/[0.08] flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-orange-400 animate-spin" style={{ animationDuration: '1.5s' }} />
            </div>
            <div className="glass-panel p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400">GovSchemeAI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (only on first message) */}
      {messages.length === 1 && !loading && (
        <div className="mb-4 shrink-0 animate-fade-in">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 text-slate-300 hover:text-blue-400 transition-all text-left cursor-pointer"
              >
                {q}
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
          className="w-full pl-4 pr-14 py-4 rounded-2xl text-sm pr-14 disabled:opacity-60"
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
