import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../common/Logo';
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  CheckCircle2,
  Users,
  ScrollText,
  Activity,
  UserCheck,
  X,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    category: 'Core Operations',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/documents', label: 'Document Monitoring', icon: FileText },
    ],
  },
  {
    category: 'Analytics & Insights',
    items: [
      { to: '/analytics/digitization', label: 'Digitization Analytics', icon: BarChart2 },
      { to: '/analytics/verification', label: 'Verification Analytics', icon: CheckCircle2 },
    ],
  },
  {
    category: 'Administration & Governance',
    items: [
      { to: '/users', label: 'User Management', icon: Users },
      { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
      { to: '/system-activity', label: 'System Activity', icon: Activity },
    ],
  },
  {
    category: 'Settings & Identity',
    items: [
      { to: '/profile', label: 'Admin Profile', icon: UserCheck },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-950 text-slate-300 border-r border-navy-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Geometric placeholder emblem */}
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
                BhumiPatra
                <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1 py-0.2 rounded font-semibold uppercase">
                  Portal
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                Administrator
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_ITEMS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.category}
              </div>
              <nav className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => onClose && onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'text-slate-300 hover:text-white hover:bg-navy-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer info badge */}
        <div className="p-3.5 border-t border-navy-800 text-[11px] text-slate-400 bg-navy-900/60">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Environment</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-mono">
              SECURE RBAC
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Build v1.0.0 &bull; Node/Express
          </div>
        </div>
      </aside>
    </>
  );
}
