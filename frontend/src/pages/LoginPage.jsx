import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Users,
  Building2,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRole = searchParams.get('role') || 'student';
  const [activeRole, setActiveRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['student', 'recruiter', 'issuer', 'admin'].includes(roleParam)) {
      setActiveRole(roleParam);
    }
  }, [searchParams]);

  const handleRoleSelect = (role) => {
    setActiveRole(role);
    setError('');
    setSearchParams({ role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Pass the selected portal role so backend enforces strict role checking
      const user = await login(email, password, activeRole);

      if (user.role === 'recruiter') navigate('/recruiter');
      else if (user.role === 'issuer') navigate('/issuer');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = {
    student: {
      title: 'Student Portal Login',
      desc: 'Take timed coding challenges, build smart portfolios, and earn verified credentials.',
      icon: GraduationCap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    recruiter: {
      title: 'Recruiter Hub Login',
      desc: 'Discover pre-verified engineering talent, view test benchmarks, and manage candidate pipelines.',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    issuer: {
      title: 'Issuer Portal Login',
      desc: 'Issue RFC 8032 Ed25519 digital credentials, manage templates, and publish revocation records.',
      icon: Building2,
      color: 'text-amber-800',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    admin: {
      title: 'Platform Admin Portal',
      desc: 'Master platform governance, audit logs, and system security.',
      icon: ShieldAlert,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
  };

  const CurrentIcon = roleMeta[activeRole]?.icon || GraduationCap;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            AI SkillProof
          </span>
        </Link>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {roleMeta[activeRole]?.title}
        </h2>
        <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
          {roleMeta[activeRole]?.desc}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-white rounded-2xl border border-slate-200 mb-4 shadow-xs">
          {[
            { id: 'student', label: 'Student', icon: GraduationCap },
            { id: 'recruiter', label: 'Recruiter', icon: Users },
            { id: 'issuer', label: 'Issuer', icon: Building2 },
            { id: 'admin', label: 'Admin', icon: ShieldAlert },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeRole === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRoleSelect(item.id)}
                className={`py-2 px-1 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-3xl sm:px-10">
          {/* Prominent Red Alert if Login / Role validation fails */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs shadow-xs flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1 text-left">
                <div className="font-bold text-rose-900">Authentication Failed</div>
                <div className="leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          {/* Admin Credentials Info Notice */}
          {activeRole === 'admin' && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Admin credentials are configured securely in <code>backend/.env</code>.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeRole === 'admin' ? 'Administrator Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeRole === 'admin'
                      ? 'admin@skillproof.io'
                      : activeRole === 'recruiter'
                      ? 'recruiter@techcorp.com'
                      : activeRole === 'issuer'
                      ? 'issuer@vit.ac.in'
                      : 'student@domain.com'
                  }
                  className="w-full bg-white text-slate-900 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white text-slate-900 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {activeRole !== 'admin' && (
              <div className="flex items-center justify-between text-xs">
                <Link
                  to="/forgot-password"
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full text-xs py-2.5 shadow-sm"
              loading={loading}
              icon={ArrowRight}
            >
              Sign In to {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Portal
            </Button>
          </form>

          {/* Registration link required for non-admins */}
          {activeRole !== 'admin' ? (
            <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-600">
              Don't have an account?{' '}
              <Link
                to={`/register?role=${activeRole}`}
                className="text-indigo-600 hover:text-indigo-800 font-bold"
              >
                Register as a {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
              </Link>
            </div>
          ) : (
            <div className="mt-6 pt-5 border-t border-slate-200 text-center text-[11px] text-slate-500">
              Platform administration accounts are provisioned via backend environment master key.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
