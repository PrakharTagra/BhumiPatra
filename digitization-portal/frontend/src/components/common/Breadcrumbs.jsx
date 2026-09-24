import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 sm:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-slate-500 hover:text-navy-800 transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>Dashboard</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" />
              {isLast || !item.to ? (
                <span className="font-semibold text-slate-800 max-w-[200px] sm:max-w-none truncate" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="text-slate-500 hover:text-navy-800 transition-colors max-w-[150px] sm:max-w-none truncate"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
