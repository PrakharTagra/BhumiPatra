import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import BhumiPatraLogo from '../components/common/BhumiPatraLogo';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="mb-4">
        <BhumiPatraLogo variant="icon" size="lg" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mt-2">Resource or Page Not Found</h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-6">
        The requested URL does not match any digitization portal page or the document may have been archived.
      </p>
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" icon={Home}>
            Return to Dashboard
          </Button>
        </Link>
        <Link to="/documents">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Documents History
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
