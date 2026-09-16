import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Award,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Lock,
  Search,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import QRModal from '../components/QRModal';

export default function CredentialWalletPage() {
  const [credentials, setCredentials] = useState([]);
  const [selectedQR, setSelectedQR] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.getMyCredentials();
        setCredentials(list);
      } catch (err) {
        console.error('Error loading credentials:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = (id) => {
    const url = `${window.location.origin}/verify/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Verifiable Digital Credential Wallet
          </h1>
          <p className="text-xs text-slate-600">
            Cryptographically signed with Ed25519 asymmetric keys and verifiable via public QR codes.
          </p>
        </div>

        <Link to="/verify">
          <Button variant="secondary" size="sm" icon={ShieldCheck}>
            Open Public Verifier
          </Button>
        </Link>
      </div>

      {/* Security Guarantee Banner */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong>Tamper-Evident Architecture:</strong> Every credential payload is canonically serialized and signed by authorized private keys. Third-party recruiters and universities can independently verify authenticity without logging in.
        </div>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {credentials.map((c) => (
          <div
            key={c.credential_id}
            className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col justify-between space-y-6 hover:border-indigo-500/40 transition-all shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="brand" className="text-[10px]">
                  {c.credential_type || 'Skill Credential'}
                </Badge>
                <Badge
                  variant={c.status === 'revoked' ? 'danger' : 'success'}
                  className="text-[10px] capitalize"
                >
                  {c.status}
                </Badge>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {c.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {c.description}
              </p>

              <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Issuer:</span>
                  <span className="text-slate-800 font-medium">
                    {c.issuer_name || 'Authorized Certification Board'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Issued On:</span>
                  <span className="text-slate-700">
                    {new Date(c.issued_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Credential ID:</span>
                  <span className="font-mono text-indigo-600">{c.credential_id}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedQR(c)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  QR Code
                </button>
                <button
                  onClick={() => handleCopy(c.credential_id)}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Copy verification link"
                >
                  {copiedId === c.credential_id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <Link to={`/verify/${c.credential_id}`}>
                <Button variant="primary" size="sm" icon={ExternalLink}>
                  Verify Proof
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <QRModal credential={selectedQR} onClose={() => setSelectedQR(null)} />
      )}
    </div>
  );
}
