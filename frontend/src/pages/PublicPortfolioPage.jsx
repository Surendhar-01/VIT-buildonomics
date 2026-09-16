import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  ShieldCheck,
  Globe,
  ExternalLink,
  Award,
  CheckCircle2,
  FolderGit2,
  Printer,
  Calendar,
  MapPin,
  GraduationCap,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import QRModal from '../components/QRModal';
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons';

export default function PublicPortfolioPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        if (!slug) {
          setData(null);
          return;
        }
        const res = await api.getPublicPortfolio(slug);
        setData(res);
      } catch (err) {
        console.error('Error loading public portfolio:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 text-xs">
        Loading verified public portfolio...
      </div>
    );
  }

  if (!data?.profiles) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Portfolio Not Published Yet</h1>
          <p className="text-xs text-slate-600 max-w-sm mt-1">
            This candidate has not published their portfolio or the requested link does not exist.
          </p>
        </div>
        <Link to="/">
          <Button variant="secondary" size="sm">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const profile = data.profiles;
  const projects = data.projects || [];
  const credentials = data.credentials || [];
  const skills = data.skills || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Top Public Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between pb-6 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>AI SkillProof Verified Public Portfolio</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="secondary" size="sm" icon={Printer}>
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Profile Header Hero */}
        <header className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 relative overflow-hidden shadow-md border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-xl flex-shrink-0">
              <div className="w-full h-full bg-slate-50 rounded-[14px] flex items-center justify-center text-2xl font-bold text-indigo-700">
                {profile.full_name?.charAt(0) || 'C'}
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {profile.full_name}
                </h1>
                <Badge variant="brand" className="text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Candidate
                </Badge>
              </div>

              <p className="text-sm font-medium text-indigo-700">
                {profile.headline}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {profile.location}
                  </span>
                )}
                {profile.institution && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    {profile.institution} ({profile.graduation_year})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {profile.bio}
          </div>

          {/* Social Links */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 transition-colors"
              >
                <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
          </div>
        </header>

        {/* Cryptographically Verified Digital Credentials */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Verifiable Digital Credentials
            </h2>
            <span className="text-xs text-slate-500 font-mono">Ed25519 RFC 8032</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {credentials.map((c) => (
              <div
                key={c.credential_id}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                    <Badge variant="success" className="text-[10px]">Genuine</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Issued by <span className="text-slate-700 font-medium">{c.issuer_name || 'Authorized Issuer'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-600 text-[11px]">{c.credential_id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedQR(c)}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" /> QR
                    </button>
                    <Link
                      to={`/verify/${c.credential_id}`}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5"
                    >
                      Verify <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verified Skills & Evidence */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Verified Skills & Evidence
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{s.skill_name || s.name}</span>
                  <Badge variant="cyan" className="text-[10px] capitalize">
                    {s.proficiency_level || 'advanced'}
                  </Badge>
                </div>
                {s.evidence_description && (
                  <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                    {s.evidence_description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Featured Projects */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-purple-600" />
            Engineered Projects
          </h2>

          <div className="space-y-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <div className="flex items-center gap-3 text-xs">
                    {p.repository_url && (
                      <a
                        href={p.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <GithubIcon className="w-3.5 h-3.5" /> Source
                      </a>
                    )}
                    {p.live_url && (
                      <a
                        href={p.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Demo
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(p.technologies || []).map((tech, i) => (
                    <Badge key={i} variant="default" className="text-[10px]">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verification Footer */}
        <footer className="pt-8 border-t border-slate-200 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-2 text-indigo-600 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Powered by AI SkillProof Platform
          </div>
          <p>
            Digital credentials and assessment metrics on this profile are cryptographically signed using Ed25519 asymmetric keys.
          </p>
        </footer>
      </div>

      {/* QR Modal */}
      {selectedQR && (
        <QRModal credential={selectedQR} onClose={() => setSelectedQR(null)} />
      )}
    </div>
  );
}
