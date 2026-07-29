'use client';

import React from 'react';
import { Bell, X, Calendar, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationAlert {
  id: string;
  title: string;
  category: string;
  time: string;
  link: string;
  isNew?: boolean;
}

const ALERTS: NotificationAlert[] = [
  {
    id: "al-1",
    title: "National Scholarship Portal (NSP 2.0) Application Window Extended to Oct 31",
    category: "Scholarship Deadline",
    time: "2 hours ago",
    link: "/schemes/nmmss-scholarship",
    isNew: true
  },
  {
    id: "al-2",
    title: "PM Internship Scheme Phase 2 Selection Call Started for 1.25 Lakh Youth",
    category: "PM Scheme Alert",
    time: "5 hours ago",
    link: "/schemes/pm-internship-scheme",
    isNew: true
  },
  {
    id: "al-3",
    title: "PM-KISAN 19th Installment Credited — Check Your e-KYC Status",
    category: "Farmer Benefit",
    time: "1 day ago",
    link: "/schemes/pm-kisan-samman-nidhi"
  },
  {
    id: "al-4",
    title: "Lakhpati Didi Scheme Adds Drone Pilot Skill Training for Rural SHG Women",
    category: "Women Empowerment",
    time: "2 days ago",
    link: "/schemes/lakhpati-didi-scheme"
  }
];

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="gov-card w-full max-w-md h-full border-l border-white/[0.1] shadow-2xl flex flex-col justify-between bg-slate-950 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-950 border border-blue-500/30 text-blue-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Notification Center</h2>
                <p className="text-[10px] text-slate-400">Government Portal Alerts</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            {ALERTS.map((alert) => (
              <Link
                href={alert.link}
                key={alert.id}
                onClick={onClose}
                className="block p-3.5 rounded-2xl bg-slate-900/80 border border-white/[0.08] hover:border-blue-500/30 transition-all space-y-2 group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                    {alert.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{alert.time}</span>
                </div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                  {alert.title}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.08] pt-4">
          <Link
            href="/news"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>View All Official Updates</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
