import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Code2,
  Award,
  Compass,
  Sparkles,
  Users,
  BookmarkCheck,
  Send,
  Building2,
  FilePlus2,
  BarChart3,
  ShieldAlert,
  Sliders,
  ExternalLink,
} from 'lucide-react';

export default function Sidebar() {
  const { role } = useAuth();

  const studentLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/profile', label: 'Profile & Skills', icon: User },
    { to: '/portfolio-builder', label: 'Portfolio Builder', icon: Compass },
    { to: '/projects', label: 'Project Showcase', icon: FolderGit2 },
    { to: '/assessments', label: 'Coding Assessments', icon: Code2 },
    { to: '/wallet', label: 'Credential Wallet', icon: Award },
    { to: '/skill-gap', label: 'AI Skill Gap Copilot', icon: Sparkles },
  ];

  const recruiterLinks = [
    { to: '/recruiter', label: 'Talent Discovery', icon: Users },
    { to: '/recruiter/shortlists', label: 'Saved Shortlists', icon: BookmarkCheck },
    { to: '/assessments', label: 'Benchmark Catalog', icon: Code2 },
    { to: '/verify', label: 'Verify Credentials', icon: Award },
  ];

  const issuerLinks = [
    { to: '/issuer', label: 'Issuer Dashboard', icon: Building2 },
    { to: '/issuer/templates', label: 'Credential Templates', icon: Sliders },
    { to: '/issuer/issue', label: 'Issue Ed25519 Credential', icon: FilePlus2 },
    { to: '/verify', label: 'Public Verifier', icon: Award },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Analytics Hub', icon: BarChart3 },
    { to: '/admin/users', label: 'User & Role Control', icon: Users },
    { to: '/admin/problems', label: 'Problem Repository', icon: Code2 },
    { to: '/admin/audit', label: 'System Audit Logs', icon: ShieldAlert },
  ];

  let navLinks = studentLinks;
  if (role === 'recruiter') navLinks = recruiterLinks;
  else if (role === 'issuer') navLinks = issuerLinks;
  else if (role === 'admin') navLinks = adminLinks;

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-64 hidden md:block bg-white border-r border-slate-200 p-4 overflow-y-auto z-30">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {role} Workspace
          </div>
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard' || item.to === '/recruiter' || item.to === '/issuer' || item.to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Verifier shortcut & external demo */}
        <div className="pt-4 border-t border-slate-200">
          <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Verification & Public
          </div>
          <div className="space-y-1">
            <NavLink
              to="/verify"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Public QR Verifier</span>
            </NavLink>
            <a
              href="/p/alex-vance"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <span className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-cyan-600" />
                <span>Live Portfolio</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Security / Cryptographic Status badge */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ed25519 Engine Active
          </div>
          <p className="text-slate-500 leading-relaxed">
            Asymmetric digital signatures, RFC 8032 canonical serialization.
          </p>
        </div>
      </div>
    </aside>
  );
}
