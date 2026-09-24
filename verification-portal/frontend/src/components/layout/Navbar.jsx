import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import Logo from '../common/Logo';
import Badge from '../common/Badge';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 shadow-sm px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Logo size="sm" variant="horizontal" portalSubtitle="Land Record Verification Desk" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Officer Session</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                {user?.name || 'Verification Officer'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {user?.district ? `${user.district} District` : 'Officer'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name || 'Verification Officer'}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge variant="navy" size="sm">OFFICER</Badge>
                  {user?.district && (
                    <span className="text-[10px] text-slate-500 truncate">{user.district}</span>
                  )}
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/history"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Review Audit Trail</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
