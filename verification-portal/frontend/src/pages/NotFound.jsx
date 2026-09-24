import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="mb-4">
        <Logo variant="icon" size="lg" />
      </div>
      <h1 className="text-3xl font-bold text-navy-950">404 - Desk Route Not Found</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2">
        The requested verification workstation screen does not exist or has been relocated.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" size="sm" icon={ArrowLeft}>
            Return to Overview Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
