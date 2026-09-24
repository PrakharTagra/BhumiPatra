import React from 'react';
import { NavLink } from 'react-router-dom';
import BhumiPatraLogo from '../common/BhumiPatraLogo';
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  UserCheck,
  HelpCircle,
  FileCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/upload',
      label: 'Upload Document',
      icon: UploadCloud,
      badge: 'Scan'
    },
    {
      to: '/documents',
      label: 'Documents / History',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      to: '/profile',
      label: 'Operator Profile',
      icon: UserCheck,
      badge: null
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40 ${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-slate-300 border-r border-slate-800
          transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col justify-between
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header & Toggle */}
        <div>
          <div className={`h-14 px-3 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {isCollapsed ? (
              <BhumiPatraLogo collapsed={true} size="md" />
            ) : (
              <BhumiPatraLogo variant="horizontal" size="sm" portalSubtitle="Digitization Ops" theme="dark" />
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Navigation List */}
          <div className="py-4 px-3 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Digitization Operations
              </div>
            )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) => `
                  flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-md text-xs font-medium transition-colors
                  ${isActive
                    ? 'bg-navy-800 text-sky-300 border-l-4 border-sky-400 font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }
                `}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
          </div>
        </div>

        {/* Operator SOP Guidance Card */}
        {!isCollapsed && (
          <div className="p-3 m-3 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Operator SOP Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upload original scanned records in legible resolution (min 300 DPI). AI pipeline autonomously extracts land parcel & owner entities.
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Role: DIGITIZATION_OPERATOR</span>
              <span className="text-emerald-400 font-medium">Active</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
