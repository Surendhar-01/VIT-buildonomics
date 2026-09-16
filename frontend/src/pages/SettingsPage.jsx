import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, User, Bell, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function SettingsPage() {
  const { user, role, token, logout } = useAuth();
  const [discoverable, setDiscoverable] = useState(true);
  const [assessmentAlerts, setAssessmentAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          Settings & Account Governance
        </h1>
        <p className="text-xs text-slate-600">
          Control your privacy visibility, security preferences, and active credentials.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Details */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" /> Account Claims
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-600 block mb-1">User Identifier:</span>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-800">
                {user?.id || 'demo-student-uuid'}
              </div>
            </div>

            <div>
              <span className="text-slate-600 block mb-1">Active User Role:</span>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 capitalize text-slate-800 flex items-center justify-between">
                <span>{role}</span>
                <Badge variant="cyan" className="text-[10px]">Verified</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Discoverability */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" /> Privacy & Evidence Controls
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 block">
                  Public Candidate Search Indexing
                </span>
                <span className="text-[11px] text-slate-600 block">
                  Allow verified recruiters to discover your skill evidence and assessment benchmarks.
                </span>
              </div>
              <input
                type="checkbox"
                checked={discoverable}
                onChange={(e) => setDiscoverable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-white border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 block">
                  Interview Opportunity Notifications
                </span>
                <span className="text-[11px] text-slate-600 block">
                  Receive instant alerts when recruiters send opportunity requests based on credentials.
                </span>
              </div>
              <input
                type="checkbox"
                checked={assessmentAlerts}
                onChange={(e) => setAssessmentAlerts(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded bg-white border-slate-300"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
          >
            Sign Out of Account
          </button>
          <Button type="submit" variant="primary" size="sm">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
