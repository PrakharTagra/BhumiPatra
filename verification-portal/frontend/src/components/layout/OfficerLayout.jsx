import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function OfficerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} transition-all duration-300`}>
        <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1600px] mx-auto">
            <span>
              &copy; {new Date().getFullYear()} BhumiPatra Portal &bull; Verification Officer Workstation
            </span>
            <span className="text-[11px] text-slate-400">
              Role: VERIFICATION_OFFICER &bull; Statutory Land Record Verification
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
