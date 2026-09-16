import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 items-center justify-center mb-4 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Password
        </h2>
        <p className="mt-2 text-xs text-slate-600">
          Enter your registered email address to receive password recovery instructions.
        </p>

        <div className="mt-8 bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-3xl sm:px-10 text-left">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Reset Link Dispatched</h3>
              <p className="text-xs text-slate-600">
                If an account exists for <span className="text-indigo-600 font-semibold">{email}</span>, a secure recovery link has been sent.
              </p>
              <Link to="/login" className="inline-block mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                ← Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-white text-slate-900 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full text-xs py-2.5"
                loading={loading}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
