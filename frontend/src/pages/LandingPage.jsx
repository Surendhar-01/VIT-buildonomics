import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Code2,
  Sparkles,
  Award,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Search,
  Lock,
  FileCheck,
  Users,
  Compass,
  ChevronDown,
  GraduationCap,
  Building2,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function LandingPage() {
  const { switchRole, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const handleRoleQuickStart = (role) => {
    navigate(`/login?role=${role}`);
  };

  const navigateToRoleLogin = (role) => {
    setLoginDropdownOpen(false);
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Header / Navigation Bar with Role Login Selection */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20">
                  <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900 tracking-tight">
                    AI SkillProof
                  </span>
                  <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded uppercase tracking-wider">
                    Ed25519
                  </span>
                </div>
              </Link>

              {/* Public Quick Links */}
              <nav className="hidden md:flex items-center gap-1 ml-8">
                <Link
                  to="/assessments"
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Assessments
                </Link>
                <Link
                  to="/verify"
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  QR Verifier
                </Link>
              </nav>
            </div>

            {/* Top Right Action: Login / Dashboard & Logout */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to={
                      role === 'recruiter'
                        ? '/recruiter'
                        : role === 'issuer'
                        ? '/issuer'
                        : role === 'admin'
                        ? '/admin'
                        : '/dashboard'
                    }
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] uppercase font-bold">
                      {user.fullName?.charAt(0) || 'U'}
                    </div>
                    <span>{user.fullName ? `${user.fullName} (Dashboard)` : 'Dashboard'}</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                    title="Log out"
                  >
                    <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Login Role Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Login As</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          loginDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {loginDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          Choose Your Account Portal
                        </div>
                        <div className="p-1 space-y-1">
                          <button
                            onClick={() => navigateToRoleLogin('student')}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50/70 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                                Student Portal
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Take challenges & build portfolios
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => navigateToRoleLogin('recruiter')}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-50/70 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                                Recruiter Portal
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Discover verified tech talent
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => navigateToRoleLogin('issuer')}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-amber-50/70 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-amber-950">
                                Issuer Portal
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Issue & revoke Ed25519 credentials
                              </div>
                            </div>
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            onClick={() => navigateToRoleLogin('admin')}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50/70 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-rose-950">
                                Admin Portal
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Platform governance & security
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Register Button */}
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-200/50 via-purple-100/50 to-cyan-200/50 blur-[130px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-8 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Production-Grade Verifiable Technical Skill Ecosystem</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
          Prove Your Code.{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Verify With Math.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          The all-in-one platform for job seekers to demonstrate real technical competence
          through isolated sandbox coding benchmarks, AI-powered solution reviews, and
          cryptographically signed Ed25519 digital credentials with QR verification.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button
            onClick={() => handleRoleQuickStart('student')}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            Launch Student Portal
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRoleQuickStart('recruiter')}
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-600" />
            Recruiter Discovery
          </button>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center mb-16">
          <Badge variant="brand" className="mb-3">Engine Architecture</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Built for Real Verification, Not Generic Resumes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Isolated Sandbox</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Code runs in ephemeral worker environments with hard execution timeouts, memory bounds, and hidden test-case verification.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Ed25519 Signatures</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Asymmetric cryptographic signing of credential payloads. Tamper-evident verification directly checked on the backend.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-4 text-cyan-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">AI Solution Copilot</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated algorithmic complexity review (Big-O analysis), clean code recommendations, and intelligent portfolio bio generation.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Smart Portfolios</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customizable templates with custom slugs (<code>/p/:slug</code>), live evidence linking, and instant print-to-PDF formatting.
            </p>
          </div>
        </div>
      </section>

      {/* Role Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Explore Role Workspaces
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Test every workflow end-to-end with pre-seeded data and zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-indigo-600 text-xs font-semibold uppercase mb-1">Candidate</div>
                <div className="text-base font-bold text-slate-900 mb-2">Student Portal</div>
                <p className="text-xs text-slate-600 mb-4">
                  Take timed coding challenges, build smart portfolios, and earn signed credentials.
                </p>
              </div>
              <button
                onClick={() => handleRoleQuickStart('student')}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Student View →
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-emerald-600 text-xs font-semibold uppercase mb-1">Employer</div>
                <div className="text-base font-bold text-slate-900 mb-2">Recruiter Hub</div>
                <p className="text-xs text-slate-600 mb-4">
                  Search candidate talent with verified skills, inspect test results, and manage shortlists.
                </p>
              </div>
              <button
                onClick={() => handleRoleQuickStart('recruiter')}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Recruiter View →
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-amber-700 text-xs font-semibold uppercase mb-1">Institution</div>
                <div className="text-base font-bold text-slate-900 mb-2">Issuer Portal</div>
                <p className="text-xs text-slate-600 mb-4">
                  Create criteria templates, digitally sign certificates with Ed25519, and manage revocations.
                </p>
              </div>
              <button
                onClick={() => handleRoleQuickStart('issuer')}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Issuer View →
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-rose-600 text-xs font-semibold uppercase mb-1">Governance</div>
                <div className="text-base font-bold text-slate-900 mb-2">Admin Dashboard</div>
                <p className="text-xs text-slate-600 mb-4">
                  Monitor platform analytics, approve new issuers, manage coding problems, and audit logs.
                </p>
              </div>
              <button
                onClick={() => handleRoleQuickStart('admin')}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Admin View →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
