import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Search,
  Lock,
  Key,
  Calendar,
  User,
  Building,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

export default function PublicVerificationPage() {
  const { credentialId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(credentialId || 'SKP-2026-ALGO01');
  const [data, setData] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [showRawCrypto, setShowRawCrypto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (credentialId) {
      performVerification(credentialId);
    } else {
      performVerification('SKP-2026-ALGO01');
    }
  }, [credentialId]);

  const performVerification = async (id) => {
    setLoading(true);
    setError(null);
    setData(null);
    setSignatureData(null);
    try {
      const [res, sigRes] = await Promise.all([
        api.verifyCredential(id),
        api.getSignatureVerification(id).catch(() => null),
      ]);
      setData(res);
      setSignatureData(sigRes);
    } catch (err) {
      setError(err.message || 'Verification query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify/${searchId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
        {/* Header and Lookup */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-500/25 text-indigo-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Public Cryptographic Verification Hub
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Verify Digital Credential Authenticity
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Directly verifies Ed25519 asymmetric signatures and checks revocation status against the immutable ledger.
          </p>
        </div>

        {/* Search / Lookup Widget */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="SKP-2026-XXXXX"
              className="w-full bg-white text-slate-800 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Verify
          </Button>
        </form>

        {/* Verification Result Display */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-600">
            Verifying cryptographic signature on backend...
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-3">
            <XCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Verification Failed</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <p className="text-xs text-slate-500">
              Check that the Credential ID is typed correctly and has not expired or been deleted.
            </p>
          </div>
        ) : data ? (
          <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-md border border-slate-200 space-y-6 p-6 sm:p-8">
            {/* Verification Status Banner */}
            <div
              className={`p-4 rounded-2xl flex items-center justify-between border ${
                data.isRevoked
                  ? 'bg-rose-950/30 border-rose-200 text-rose-700'
                  : data.isSignatureValid
                  ? 'bg-emerald-950/30 border-emerald-200 text-emerald-700'
                  : 'bg-amber-950/30 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {data.isRevoked ? (
                  <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                ) : data.isSignatureValid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-amber-800 flex-shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {data.isRevoked
                      ? 'Credential Status: REVOKED'
                      : data.isSignatureValid
                      ? 'Authentic & Verified Digital Credential'
                      : 'Cryptographic Signature Mismatch'}
                  </div>
                  <div className="text-xs opacity-80">
                    {data.isRevoked
                      ? `Revoked on ${new Date(data.revokedAt).toLocaleDateString()}. Reason: ${data.revocationReason}`
                      : 'Ed25519 asymmetric signature verified genuine.'}
                  </div>
                </div>
              </div>

              <Badge
                variant={data.isRevoked ? 'danger' : data.isSignatureValid ? 'success' : 'warning'}
                className="text-xs uppercase"
              >
                {data.status}
              </Badge>
            </div>

            {/* Credential Details Grid */}
            <div className="space-y-4 pt-2">
              <div>
                <span className="text-[11px] font-mono text-indigo-600 uppercase tracking-wide">
                  ID: {data.credentialId}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  {data.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
                  {data.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Recipient:</span>
                    <strong className="text-white">{data.recipientName}</strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span>Authorized Issuer:</span>
                    <strong className="text-white">{data.issuerName}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Issue Date:</span>
                    <span className="text-slate-800">
                      {new Date(data.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Key className="w-4 h-4 text-slate-500" />
                    <span>Signing Key ID:</span>
                    <span className="font-mono text-indigo-700">{data.keyId}</span>
                  </div>
                </div>
              </div>

              {data.criteria && (
                <div>
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Verification Criteria Satisfied
                  </h3>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    {data.criteria}
                  </div>
                </div>
              )}
            </div>

            {/* Cryptographic Inspection Drawer */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowRawCrypto(!showRawCrypto)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Inspect Raw Cryptographic Payload & Ed25519 Public Key
                </span>
                {showRawCrypto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showRawCrypto && signatureData && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs font-mono">
                  <div>
                    <div className="text-slate-500 text-[11px] mb-1">Algorithm:</div>
                    <div className="text-emerald-600">{signatureData.algorithm}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px] mb-1">Canonical Payload:</div>
                    <pre className="p-2 bg-white rounded-lg text-[10px] text-slate-700 overflow-x-auto whitespace-pre-wrap">
                      {signatureData.canonicalPayload}
                    </pre>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px] mb-1">Digital Signature (Base64):</div>
                    <div className="p-2 bg-white rounded-lg text-[10px] text-cyan-800 break-all">
                      {signatureData.signature}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[11px] mb-1">Public Verification Key (PEM):</div>
                    <pre className="p-2 bg-white rounded-lg text-[9px] text-slate-600 overflow-x-auto">
                      {signatureData.publicKeyPem}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="text-center pt-4">
          <Link to="/" className="text-xs text-indigo-600 hover:text-indigo-700">
            ← Return to AI SkillProof Home
          </Link>
        </div>
      </div>
    </div>
  );
}
