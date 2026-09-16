import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Compass,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Layers,
  Palette,
  Eye,
  Share2,
  Copy,
  Globe,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function PortfolioBuilderPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolio, setActivePortfolio] = useState({
    title: user?.fullName ? `${user.fullName} — Software Portfolio` : 'Software Portfolio',
    slug: user?.fullName ? user.fullName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'portfolio',
    template: 'modern-minimal',
    theme: 'modern-light',
    isPublished: true,
  });

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const list = await api.getMyPortfolios();
        if (list && list.length > 0) {
          setPortfolios(list);
          const first = list[0];
          setActivePortfolio({
            id: first.id,
            title: first.title,
            slug: first.slug,
            template: first.template || 'modern-minimal',
            theme: first.theme || 'dark-indigo',
            isPublished: first.is_published ?? true,
          });
        }
      } catch (err) {
        console.error('Portfolio load error:', err);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activePortfolio.id) {
        await api.updatePortfolio(activePortfolio.id, activePortfolio);
      } else {
        const created = await api.createPortfolio(activePortfolio);
        setActivePortfolio((prev) => ({ ...prev, id: created.id }));
      }
      setStatusMessage('Portfolio settings updated successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setStatusMessage(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = `${window.location.origin}/p/${activePortfolio.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const templates = [
    {
      id: 'modern-minimal',
      name: 'Modern Minimalist',
      desc: 'Clean grid, focus on code execution stats and direct evidence.',
    },
    {
      id: 'tech-lead',
      name: 'Systems Architect',
      desc: 'High-density layout highlighting distributed architecture and credentials.',
    },
    {
      id: 'creative-dev',
      name: 'Interactive Engineer',
      desc: 'Vibrant gradients with interactive terminal and live component previews.',
    },
  ];

  const themes = [
    { id: 'dark-indigo', name: 'Indigo Deep Space', bg: 'bg-indigo-600' },
    { id: 'slate-cyan', name: 'Cyberpunk Cyan', bg: 'bg-cyan-500' },
    { id: 'cyber-emerald', name: 'Terminal Emerald', bg: 'bg-emerald-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Smart Portfolio Builder
          </h1>
          <p className="text-xs text-slate-600">
            Publish your verifiable digital presence with custom themes, slugs, and live proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href={`/p/${activePortfolio.slug}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" icon={ExternalLink}>
              View Live Page
            </Button>
          </a>
          <Button
            onClick={handleSave}
            variant="primary"
            size="sm"
            loading={saving}
            icon={Save}
          >
            Publish Changes
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-200 text-indigo-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Shareable Link Banner */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-indigo-600" />
          <div>
            <div className="text-xs font-semibold text-slate-900">Your Public Portfolio URL</div>
            <div className="text-[11px] font-mono text-indigo-700 truncate max-w-sm sm:max-w-md">
              {publicUrl}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={copyUrl} variant="secondary" size="sm" icon={Copy}>
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Core Portfolio Settings */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600" /> Identity & URL Routing
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Portfolio Title
            </label>
            <input
              type="text"
              value={activePortfolio.title}
              onChange={(e) => setActivePortfolio({ ...activePortfolio, title: e.target.value })}
              className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Custom Public Slug (e.g. /p/your-slug)
            </label>
            <div className="flex items-center">
              <span className="bg-slate-50 text-slate-500 text-xs px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-200">
                /p/
              </span>
              <input
                type="text"
                value={activePortfolio.slug}
                onChange={(e) => setActivePortfolio({ ...activePortfolio, slug: e.target.value })}
                className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-r-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" /> Portfolio Template
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setActivePortfolio({ ...activePortfolio, template: tpl.id })}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activePortfolio.template === tpl.id
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span>{tpl.name}</span>
                {activePortfolio.template === tpl.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Color Palette */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-600" /> Accent Color & Visual Theme
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map((thm) => (
            <button
              key={thm.id}
              type="button"
              onClick={() => setActivePortfolio({ ...activePortfolio, theme: thm.id })}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                activePortfolio.theme === thm.id
                  ? 'bg-slate-100 border-indigo-500 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full ${thm.bg}`} />
              <span className="text-xs font-medium text-slate-800">{thm.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
