import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Code2,
  Briefcase,
  Award,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, role, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roleColors = {
    student: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    recruiter: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    issuer: 'bg-amber-50 text-amber-800 border-amber-200',
    admin: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const handleRoleChange = (newRole) => {
    switchRole(newRole);
    setRoleDropdownOpen(false);
    if (newRole === 'student') navigate('/dashboard');
    else if (newRole === 'recruiter') navigate('/recruiter');
    else if (newRole === 'issuer') navigate('/issuer');
    else if (newRole === 'admin') navigate('/admin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - visible on mobile, hidden on desktop (fixed sidebar has title) */}
          <div className="flex items-center gap-3">
            <Link to="/" className="md:hidden flex items-center gap-2.5 group">
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

            {/* Public Quick Links on Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/assessments"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  location.pathname.startsWith('/assessments')
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Assessments
              </Link>
              <Link
                to="/verify"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  location.pathname.startsWith('/verify')
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                QR Verifier
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all shadow-xs ${
                  roleColors[role] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Switch role to test platform views"
              >
                <span className="capitalize font-semibold">{role} View</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Simulate User Role
                  </div>
                  {[
                    { id: 'student', label: 'Student / Candidate', desc: 'Assessments, Portfolios, Wallet' },
                    { id: 'recruiter', label: 'Recruiter', desc: 'Talent Search & Shortlists' },
                    { id: 'issuer', label: 'Authorized Issuer', desc: 'Ed25519 Credential Issuing' },
                    { id: 'admin', label: 'Platform Admin', desc: 'Analytics, Moderation, Audit' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleChange(r.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 transition-colors ${
                        role === r.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span>{r.label}</span>
                          {role === r.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">{r.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile / Account button */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                to={role === 'student' ? '/profile' : `/${role}`}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-xs">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-tight">{user?.fullName || 'User'}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{role}</div>
                </div>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/assessments"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            Coding Assessments
          </Link>
          <Link
            to="/portfolio-builder"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            Smart Portfolio Builder
          </Link>
          <Link
            to="/wallet"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            Verifiable Credentials
          </Link>
          <Link
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            Public Credential Verifier
          </Link>
        </div>
      )}
    </header>
  );
}
