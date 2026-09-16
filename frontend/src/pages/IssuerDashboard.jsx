import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Building2,
  Award,
  FilePlus2,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ExternalLink,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import QRModal from '../components/QRModal';

export default function IssuerDashboard() {
  const [credentials, setCredentials] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedQR, setSelectedQR] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Issue Form State
  const [issueForm, setIssueForm] = useState({
    recipientId: '',
    title: 'Certified Algorithmic Problem Solver',
    description: 'Awarded for demonstrating optimal algorithmic execution in the Full-Stack Algorithmic Benchmark.',
    criteria: 'Achieved 100% test case pass rate with optimal O(N) runtime complexity.',
    credentialType: 'assessment_achievement',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [creds, tmpls, cands] = await Promise.all([
        api.getIssuedCredentials().catch(() => api.getMyCredentials().catch(() => [])),
        api.getCredentialTemplates().catch(() => []),
        api.searchCandidates().catch(() => []),
      ]);
      setCredentials(creds || []);
      setTemplates(tmpls || []);
      setCandidates(cands || []);
      if (cands && cands.length > 0 && !issueForm.recipientId) {
        setIssueForm((prev) => ({ ...prev, recipientId: cands[0].id || cands[0].user_id }));
      }
    } catch (err) {
      console.error('Issuer data load error:', err);
    }
  }

  const handleIssueCredential = async (e) => {
    e.preventDefault();
    try {
      const res = await api.issueCredential(issueForm);
      setStatusMessage(`Credential ${res.credential_id} successfully issued & signed with Ed25519!`);
      setTimeout(() => setStatusMessage(''), 4000);
      setShowIssueModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!revokeReason.trim()) return;
    try {
      await api.revokeCredential(showRevokeModal.credential_id, revokeReason);
      setStatusMessage(`Credential ${showRevokeModal.credential_id} has been revoked.`);
      setTimeout(() => setStatusMessage(''), 4000);
      setShowRevokeModal(null);
      setRevokeReason('');
      loadData();
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
            <Building2 className="w-7 h-7 text-amber-800" />
            Authorized Issuer Portal
          </h1>
          <p className="text-xs text-slate-600">
            Issue Ed25519 digitally signed credentials, manage certificate templates, and audit revocations.
          </p>
        </div>

        <Button
          onClick={() => setShowIssueModal(true)}
          variant="primary"
          size="sm"
          icon={FilePlus2}
        >
          Issue New Credential
        </Button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Total Issued</div>
          <div className="text-2xl font-bold text-slate-900">{credentials.length}</div>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Active Genuine Proofs</div>
          <div className="text-2xl font-bold text-emerald-600">
            {credentials.filter((c) => c.status === 'active').length}
          </div>
        </div>
        <div className="p-5 rounded-3xl bg-white border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Revoked Certificates</div>
          <div className="text-2xl font-bold text-rose-600">
            {credentials.filter((c) => c.status === 'revoked').length}
          </div>
        </div>
      </div>

      {/* Issued Credentials Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-800" /> Issued Digital Credentials Ledger
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Credential ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {credentials.map((c) => (
                <tr key={c.credential_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-indigo-600">{c.credential_id}</td>
                  <td className="py-3 px-4 text-white">{c.title}</td>
                  <td className="py-3 px-4 text-slate-600">{c.recipient_id}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(c.issued_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={c.status === 'revoked' ? 'danger' : 'success'} className="text-[10px]">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedQR(c)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 inline-flex items-center"
                      title="Show QR"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/verify/${c.credential_id}`}
                      className="p-1.5 text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-slate-100 inline-flex items-center"
                      title="Verify"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    {c.status !== 'revoked' && (
                      <button
                        onClick={() => setShowRevokeModal(c)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 inline-flex items-center"
                        title="Revoke Credential"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-md border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FilePlus2 className="w-5 h-5 text-indigo-600" /> Issue Digital Credential
            </h3>

            <form onSubmit={handleIssueCredential} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Recipient Candidate
                </label>
                {candidates.length > 0 ? (
                  <select
                    value={issueForm.recipientId}
                    onChange={(e) => setIssueForm({ ...issueForm, recipientId: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium mb-2"
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.headline || 'Software Engineer'})
                      </option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="text"
                  required
                  placeholder="Or enter candidate ID / UUID directly..."
                  value={issueForm.recipientId}
                  onChange={(e) => setIssueForm({ ...issueForm, recipientId: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Credential Title
                </label>
                <input
                  type="text"
                  required
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Verification Criteria
                </label>
                <textarea
                  rows={2}
                  value={issueForm.criteria}
                  onChange={(e) => setIssueForm({ ...issueForm, criteria: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowIssueModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={ShieldCheck}>
                  Sign & Issue (Ed25519)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-md border border-slate-200">
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Revoke Credential {showRevokeModal.credential_id}
            </h3>
            <p className="text-xs text-slate-600">
              Revoking a credential marks it invalid permanently on the public verification page with documented audit history.
            </p>

            <form onSubmit={handleRevoke} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Documented Reason for Revocation
                </label>
                <textarea
                  rows={3}
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Discovered fraudulent submission or assessment misconduct..."
                  className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowRevokeModal(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" type="submit">
                  Confirm Revocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {selectedQR && (
        <QRModal credential={selectedQR} onClose={() => setSelectedQR(null)} />
      )}
    </div>
  );
}
