import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
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
  const { role, user } = useAuth();
  const getStudentSlug = () => {
    try {
      const stored = localStorage.getItem('skillproof_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.fullName && !u.fullName.toLowerCase().includes('alex vance')) {
          return u.fullName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        }
        if (u.id) return u.id;
      }
    } catch {}
    if (user?.fullName && !user.fullName.toLowerCase().includes('alex vance')) {
      return user.fullName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    return user?.id || '';
  };

  const [portfolioSlug, setPortfolioSlug] = useState(getStudentSlug);

  useEffect(() => {
    const s = getStudentSlug();
    if (s) setPortfolioSlug(s);
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (role === 'student') {
      api.getMyProfile()
        .then((profile) => {
          if (!isMounted || !profile) return;
          const s =
            (profile.slug && profile.slug !== 'alex-vance' ? profile.slug : '') ||
            (profile.full_name && !profile.full_name.toLowerCase().includes('alex vance')
              ? profile.full_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
              : '') ||
            profile.user_id ||
            profile.id;
          if (s) setPortfolioSlug(s);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [role, user]);

  const activeSlug = portfolioSlug || getStudentSlug() || 'surendhar-s';
  const livePortfolioUrl = role === 'student' ? `/p/${activeSlug}` : '/p/alex-vance';

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
    <aside className="fixed top-0 bottom-0 left-0 w-64 hidden md:flex flex-col bg-white border-r border-slate-200 z-40">
      {/* Sidebar Brand Header with Fixed Title */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 shrink-0 bg-white">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-slate-900 tracking-tight">
              AI SkillProof
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded uppercase tracking-wider">
              Ed25519
            </span>
          </div>
        </Link>
      </div>

      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
              href={livePortfolioUrl}
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
