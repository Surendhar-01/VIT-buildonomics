import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-2 shadow-xs">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
      <h2 className="text-lg font-semibold text-slate-700">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm">
        The requested resource or public portfolio does not exist or has been moved.
      </p>
      <Link to="/" className="pt-2">
        <Button variant="primary" size="sm" icon={ArrowLeft}>
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
