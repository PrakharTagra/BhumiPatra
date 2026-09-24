import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BhumiPatraLogo from '../common/BhumiPatraLogo';
import {
  LogOut,
  User,
  Shield,
  Menu,
  X,
  Upload
} from 'lucide-react';

export function Header({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    info('You have been signed out successfully.', 'Session Closed');
    navigate('/login');
  };

  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'Operator';
  const displayRole = user?.role || 'DIGITIZATION_OPERATOR';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center">
              <BhumiPatraLogo size="sm" />
            </Link>
          </div>

          {/* Right: Quick Upload, Operator Badge, and Profile/Logout */}
          <div className="flex items-center gap-3 ml-auto">
            <Link
              to="/upload"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-navy-800 hover:bg-navy-900 rounded-md transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Record</span>
            </Link>

            {/* Operator Role Tag */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-navy-50 border border-navy-200/80 rounded-md text-navy-800 text-[11px] font-semibold tracking-wide">
              <Shield className="w-3 h-3 text-navy-600" />
              <span>{displayRole}</span>
            </div>

            {/* User Dropdown / Profile pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 transition-colors text-left"
                title="View Operator Profile"
              >
                <div className="w-8 h-8 rounded-full bg-navy-900 text-sky-200 flex items-center justify-center font-semibold text-xs border border-navy-800">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-xs leading-tight">
                  <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                    Digitization Portal
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
