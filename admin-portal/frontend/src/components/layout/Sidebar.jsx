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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Document Monitoring', icon: FileText },
  { to: '/users', label: 'User Management', icon: Users },
  { to: '/analytics/digitization', label: 'Digitization Analytics', icon: BarChart2 },
  { to: '/analytics/verification', label: 'Verification Analytics', icon: CheckCircle2 },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/system-activity', label: 'System Activity', icon: Activity },
  { to: '/profile', label: 'Admin Profile', icon: UserCheck },
];

export default function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
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
        className={`fixed top-0 bottom-0 left-0 z-40 ${isCollapsed ? 'w-20' : 'w-64'} bg-navy-950 text-slate-300 border-r border-navy-800 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className={`h-16 px-3 border-b border-navy-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center overflow-hidden">
            {isCollapsed ? (
              <Logo collapsed={true} size="md" />
            ) : (
              <Logo variant="horizontal" size="sm" portalSubtitle="Administration Portal" theme="dark" />
            )}
          </div>
          <div className="flex items-center">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-navy-900 rounded-md transition-colors"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Flat navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => onClose && onClose()}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-800 text-white font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-navy-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
