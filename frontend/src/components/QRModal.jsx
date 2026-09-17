import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, ShieldCheck, Download, Smartphone } from 'lucide-react';
import { Button } from './Button';

export default function QRModal({ credential, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(credential?.qr_code || '');

  if (!credential) return null;

  // Generate mobile & network-accessible verification URL (replacing localhost with local network IP)
  const getNetworkVerifyUrl = () => {
    const credId = credential.credential_id || credential.id;
    const networkHost =
      typeof window !== 'undefined' &&
      window.location &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
        ? window.location.host
        : '172.18.229.52:5173';

    if (credential.verification_url) {
      return credential.verification_url.replace(
        /http:\/\/(localhost|127\.0\.0\.1):5173/g,
        `http://${networkHost}`,
      );
    }
    return `http://${networkHost}/verify/${credId}`;
  };

  const verifyUrl = getNetworkVerifyUrl();

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch(() => {
        if (isMounted && credential.qr_code) setQrDataUrl(credential.qr_code);
      });

    return () => {
      isMounted = false;
    };
  }, [verifyUrl, credential.qr_code]);

  const copyUrl = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl || credential.qr_code;
    link.download = `${credential.credential_id || 'credential'}-qr.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Ed25519 Verified
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Smartphone className="w-3.5 h-3.5" />
            Mobile & Network Scannable
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">{credential.title}</h3>
        <p className="text-xs text-slate-500 mb-4">
          Scan with any mobile phone camera on the same Wi-Fi to verify proof
        </p>

        {/* QR Code Container */}
        <div className="p-4 bg-slate-50 rounded-2xl inline-block shadow-xs border border-slate-200 mb-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Verification QR Code"
              className="w-48 h-48 mx-auto rounded-lg shadow-2xs"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
              Generating Network QR Code...
            </div>
          )}
        </div>

        {/* Mobile & Network Verification URL */}
        <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 truncate mb-4 flex items-center justify-between gap-2 text-left">
          <span className="truncate select-all">{verifyUrl}</span>
          <button
            onClick={copyUrl}
            className="text-indigo-600 hover:text-indigo-800 flex-shrink-0 p-1 rounded-md hover:bg-indigo-50 transition-colors"
            title="Copy Network URL"
          >
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
