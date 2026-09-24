import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />

        {/* Content Area */}
        <main className={`flex-1 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-w-0 overflow-y-auto transition-all duration-300`}>
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>

          {/* Minimal Government-Portal-Style Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <p>
                BhumiPatra Land Record Digitization & Validation Portal &copy; {new Date().getFullYear()}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span>Restricted Access: Digitization Operators Only</span>
                <span>•</span>
                <span>System Security &amp; Audit Logging Active</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
