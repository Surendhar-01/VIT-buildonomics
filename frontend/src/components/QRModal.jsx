import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, Download } from 'lucide-react';
import { Button } from './Button';

export default function QRModal({ credential, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!credential) return null;

  const verifyUrl = credential.verification_url || `${window.location.origin}/verify/${credential.credential_id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = credential.qr_code;
    link.download = `${credential.credential_id}-qr.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Ed25519 Cryptographic Verification
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">{credential.title}</h3>
        <p className="text-xs text-slate-500 mb-5">
          Scan to verify cryptographic signature and issuer validity
        </p>

        {/* QR Code Container */}
        <div className="p-4 bg-slate-50 rounded-2xl inline-block shadow-xs border border-slate-200 mb-5">
          {credential.qr_code ? (
            <img
              src={credential.qr_code}
              alt="Verification QR Code"
              className="w-48 h-48 mx-auto rounded-lg"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
              Loading QR Code...
            </div>
          )}
        </div>

        <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 truncate mb-4 flex items-center justify-between gap-2 text-left">
          <span className="truncate">{verifyUrl}</span>
          <button onClick={copyUrl} className="text-indigo-600 hover:text-indigo-800 flex-shrink-0">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 text-xs"
            onClick={downloadQR}
            icon={Download}
          >
            Download QR
          </Button>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1"
          >
            <Button variant="primary" className="w-full text-xs" icon={ExternalLink}>
              Verify Now
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
