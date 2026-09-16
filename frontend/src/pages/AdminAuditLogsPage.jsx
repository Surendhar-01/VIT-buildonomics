import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, RefreshCw, Terminal, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await api.getAdminAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-600" />
            System Audit & Governance Logs
          </h1>
          <p className="text-xs text-slate-600">
            Immutable trace of platform activities, credential signing, and security events.
          </p>
        </div>

        <Button onClick={loadLogs} variant="secondary" size="sm" icon={RefreshCw} loading={loading}>
          Refresh Trail
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Actor ID</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{log.action}</td>
                  <td className="py-3 px-4 text-slate-700">
                    {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.actor_id || 'system'}</td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                    {JSON.stringify(log.metadata || {})}
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
