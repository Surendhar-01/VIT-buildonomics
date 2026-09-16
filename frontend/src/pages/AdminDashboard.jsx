import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  BarChart3,
  Users,
  ShieldCheck,
  Award,
  Code2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Activity,
  FileText,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const [stats, userList] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAdminUsers(),
      ]);
      setAnalytics(stats);
      setUsers(userList || []);
    } catch (err) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAdminUserStatus(user.id, nextStatus);
      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)),
      );
      setStatusMessage(`User ${user.name} status updated to ${nextStatus}.`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveIssuer = async (issuerId) => {
    try {
      await api.approveIssuer(issuerId);
      setUsers(
        users.map((u) => (u.id === issuerId ? { ...u, status: 'active' } : u)),
      );
      setStatusMessage('Issuer approved to issue verifiable credentials.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-rose-600" />
            Platform Administration & Analytics
          </h1>
          <p className="text-xs text-slate-600">
            System health, user role governance, credential issuance metrics, and audit log inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/problems">
            <Button variant="secondary" size="sm" icon={Code2}>
              Problem Manager
            </Button>
          </Link>
          <Link to="/admin/audit">
            <Button variant="secondary" size="sm" icon={FileText}>
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-200 text-indigo-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* High-Level Metric Tiles */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200">
            <div className="text-xs text-slate-600 mb-1">Total Users</div>
            <div className="text-2xl font-bold text-slate-900">{analytics.users.total}</div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">
              {analytics.users.growthPercentage} this month
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200">
            <div className="text-xs text-slate-600 mb-1">Assessment Runs</div>
            <div className="text-2xl font-bold text-cyan-700">
              {analytics.assessments.totalAttempts}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Pass Rate: {analytics.assessments.averagePassRate}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200">
            <div className="text-xs text-slate-600 mb-1">Signed Credentials</div>
            <div className="text-2xl font-bold text-indigo-600">
              {analytics.credentials.totalIssued}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              {analytics.credentials.verificationQueries} verification queries
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200">
            <div className="text-xs text-slate-600 mb-1">Sandbox Reliability</div>
            <div className="text-2xl font-bold text-emerald-600">
              {analytics.systemHealth.sandboxUptime}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Avg runtime: {analytics.systemHealth.averageSandboxExecTimeMs}ms
            </div>
          </div>
        </div>
      )}

      {/* User Management & Issuer Approval Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Platform Users & Issuer Approvals
          </h2>
          <Badge variant="brand" className="text-xs">{users.length} registered</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant="cyan" className="text-[10px] capitalize">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        u.status === 'active'
                          ? 'success'
                          : u.status === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                      className="text-[10px] capitalize"
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {u.status === 'pending' && u.role === 'issuer' ? (
                      <button
                        onClick={() => handleApproveIssuer(u.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors"
                      >
                        Approve Issuer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                          u.status === 'active'
                            ? 'text-rose-600 hover:bg-rose-950/40 border-rose-900/50'
                            : 'text-emerald-600 hover:bg-emerald-950/40 border-emerald-900/50'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Restore'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
