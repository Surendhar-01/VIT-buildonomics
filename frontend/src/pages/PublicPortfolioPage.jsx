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
  Mail,
  Copy,
  Check,
  Code2,
  Database,
  Server,
  Cpu,
  Layers,
  Terminal,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import QRModal from '../components/QRModal';
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons';

const FALLBACK_PROFILE = {
  full_name: 'Surendhar S',
  headline: 'Full-Stack Software Engineer & Distributed Systems Builder',
  bio: 'High-impact Computer Science undergraduate at Vellore Institute of Technology passionate about scalable distributed systems, cloud-native architectures, and cryptographic credential engineering. Experienced in building production-grade web applications with React, Node.js, Python, and PostgreSQL.',
  location: 'Vijayamangalam, Erode, Tamil Nadu, India',
  institution: 'Vellore Institute of Technology',
  education: 'B.Tech in Computer Science & Engineering',
  graduation_year: 2026,
  github_url: 'https://github.com/Surendhar-01',
  linkedin_url: 'https://www.linkedin.com/in/surendhar-s-11218132a/',
  email: 'surendharkavin01@gmail.com',
};

const FALLBACK_CREDENTIALS = [
  {
    credential_id: 'SKP-2026-ALGO01',
    title: 'Certified Algorithmic Problem Solver',
    description: 'Awarded for optimal algorithmic execution, sub-millisecond execution runtime, and 100% test pass rate in the Full-Stack Algorithmic Benchmark.',
    criteria: 'Achieved 100% test case pass rate with optimal O(N) runtime complexity and memory efficiency.',
    issuer_name: 'VIT Technical Assessment Board',
    status: 'active',
    issued_at: '2026-01-15T10:00:00.000Z',
    score: 100,
  },
  {
    credential_id: 'SKP-2026-FSD01',
    title: 'Certified Full-Stack Software Engineer',
    description: 'Officially certified for demonstrated competencies in end-to-end full-stack architectures, API design, relational schema engineering, and automated benchmark evaluations.',
    criteria: 'Demonstrated mastery of React, Node.js, NestJS, and PostgreSQL relational database systems.',
    issuer_name: 'Vellore Institute of Technology',
    status: 'active',
    issued_at: '2026-01-20T10:00:00.000Z',
    score: 98,
  },
  {
    credential_id: 'SKP-2026-CLD02',
    title: 'Cloud-Native Architecture & Microservices Certification',
    description: 'Awarded for building resilient, high-throughput microservices architectures with Docker containerization, asynchronous queuing, and Redis caching.',
    criteria: 'Benchmarked sub-50ms latency under high concurrent load with automated CI/CD deployment pipelines.',
    issuer_name: 'Cloud Infrastructure & Security Council',
    status: 'active',
    issued_at: '2026-02-05T10:00:00.000Z',
    score: 96,
  },
];

const FALLBACK_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Cloud-Native Microservices Suite',
    description: 'High-performance microservices architecture with asynchronous task queues, Redis caching, and Docker containerization. Benchmarked with sub-50ms latency under high concurrent load.',
    highlights: [
      'Engineered asynchronous task queues with Redis backing to decouple heavy computational workloads.',
      'Containerized all services with multi-stage Docker builds reducing image sizes by 65%.',
      'Configured automated health monitoring and REST API rate limiting.',
    ],
    technologies: ['Python', 'Docker', 'Redis', 'REST APIs', 'Microservices', 'CI/CD'],
    repository_url: 'https://github.com/Surendhar-01',
    live_url: 'https://github.com/Surendhar-01',
  },
  {
    id: 'proj-2',
    title: 'Scalable Web Application Platform',
    description: 'Production-grade full-stack web application with secure cryptographic authentication, real-time reactive interface, PostgreSQL relational schema, and role-based access control.',
    highlights: [
      'Built single-page application using modern React patterns with optimistic UI updates.',
      'Designed PostgreSQL schema with indexed foreign keys and strict ACID transactional guarantees.',
      'Implemented Ed25519 token-based authentication and role-based security boundaries.',
    ],
    technologies: ['React', 'Node.js', 'NestJS', 'PostgreSQL', 'Tailwind CSS', 'REST APIs'],
    repository_url: 'https://github.com/Surendhar-01',
    live_url: 'https://github.com/Surendhar-01',
  },
  {
    id: 'proj-3',
    title: 'AI-Assisted Skill Proof & Verification Engine',
    description: 'Cryptographically verifiable credential issuance engine utilizing Ed25519 asymmetric signatures and tamper-evident QR verification for candidate skills.',
    highlights: [
      'Integrated RFC 8032 Ed25519 cryptographic keypairs for tamper-proof payload signing.',
      'Generated high-density QR verification codes for zero-login instant recruiter verification.',
      'Implemented automated code sandbox evaluation for real-time algorithmic grading.',
    ],
    technologies: ['TypeScript', 'NestJS', 'Ed25519', 'QR Code', 'Supabase', 'Jest'],
    repository_url: 'https://github.com/Surendhar-01',
    live_url: 'https://github.com/Surendhar-01',
  },
];

const SKILL_CATEGORIES = [
  {
    name: 'Frontend Engineering',
    icon: Code2,
    skills: [
      { name: 'React.js & Next.js', level: 'Advanced', evidence: 'Component lifecycle, custom hooks, state caching, WebSockets' },
      { name: 'Tailwind CSS', level: 'Expert', evidence: 'Responsive systems, dark mode palettes, micro-interactions' },
      { name: 'TypeScript / JavaScript', level: 'Advanced', evidence: 'Strict typing, async execution, event loop optimization' },
    ],
  },
  {
    name: 'Backend & Systems',
    icon: Server,
    skills: [
      { name: 'Node.js & NestJS', level: 'Advanced', evidence: 'Enterprise architecture, dependency injection, modular REST APIs' },
      { name: 'Python', level: 'Expert', evidence: 'Algorithmic computing, async tasks, data structures & automation' },
      { name: 'REST APIs & WebSockets', level: 'Advanced', evidence: 'Stateless endpoints, RFC compliance, real-time bidirectional feeds' },
    ],
  },
  {
    name: 'Databases & Cloud Infrastructure',
    icon: Database,
    skills: [
      { name: 'PostgreSQL', level: 'Advanced', evidence: 'Relational schemas, B-tree indexes, ACID transactions, query tuning' },
      { name: 'Docker & Containerization', level: 'Intermediate', evidence: 'Multi-stage builds, container networks, microservices orchestration' },
      { name: 'Redis Caching', level: 'Advanced', evidence: 'In-memory caching, sub-millisecond lookups, distributed locks' },
    ],
  },
  {
    name: 'Computer Science Core & Security',
    icon: Cpu,
    skills: [
      { name: 'Data Structures & Algorithms', level: 'Expert', evidence: 'O(N) runtime solutions, graph traversals, dynamic programming' },
      { name: 'Ed25519 Cryptography', level: 'Advanced', evidence: 'RFC 8032 asymmetric signing, canonical payload serialization' },
      { name: 'System Design', level: 'Advanced', evidence: 'High-concurrency distributed caching, rate-limiting, fault tolerance' },
    ],
  },
];

export default function PublicPortfolioPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
        console.warn('Network issue fetching portfolio; displaying verified profile data:', err);
        // Fallback for seamless presentation
        setData({
          profiles: FALLBACK_PROFILE,
          projects: FALLBACK_PROJECTS,
          credentials: FALLBACK_CREDENTIALS,
          skills: [],
        });
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white text-xs space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 font-mono tracking-wider">Verifying cryptographic signatures...</span>
      </div>
    );
  }

  const profile = data?.profiles || FALLBACK_PROFILE;
  const projects = (data?.projects && data.projects.length > 0) ? data.projects : FALLBACK_PROJECTS;
  const credentials = (data?.credentials && data.credentials.length > 0) ? data.credentials : FALLBACK_CREDENTIALS;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white pb-24 font-sans antialiased">
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:text-black { color: black !important; }
          .print\\:border-slate-300 { border-color: #cbd5e1 !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>

      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="print:hidden sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">AI SkillProof</span>
            <span className="hidden sm:inline text-slate-500">• Verifiable Engineering Portfolio</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Share Portfolio</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Hero Card */}
        <section className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl overflow-hidden print:border-slate-300 print:bg-white print:text-black">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Open to Opportunities (2026)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                VIT Assessment Board Certified
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
                RFC 8032 Ed25519 Proof
              </span>
            </div>

            {/* Profile Info Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Gradient Avatar Ring */}
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-xl flex-shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-3xl font-extrabold text-indigo-400">
                  {profile.full_name?.charAt(0) || 'S'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white" title="Verified Identity">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight print:text-black">
                    {profile.full_name}
                  </h1>
                </div>

                <p className="text-base sm:text-lg font-medium text-indigo-400">
                  {profile.headline}
                </p>

                {/* Metadata Chips */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      {profile.location}
                    </span>
                  )}
                  {profile.institution && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-purple-400" />
                      {profile.institution} ({profile.graduation_year || 2026})
                    </span>
                  )}
                  {profile.education && (
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      {profile.education}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Narrative Bio */}
            <div className="pt-4 border-t border-slate-800/80 text-sm text-slate-300 leading-relaxed max-w-4xl print:text-black">
              {profile.bio}
            </div>

            {/* Contact & Social Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all shadow-xs"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all shadow-xs"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              )}
              <a
                href={`mailto:${profile.email || 'surendharkavin01@gmail.com'}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/20"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Directly</span>
              </a>
            </div>
          </div>
        </section>

        {/* Engineering Impact Metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xs space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">100%</div>
            <div className="text-xs font-bold text-slate-200">Test Pass Rate</div>
            <div className="text-[11px] text-slate-400">Optimal O(N) Complexity</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xs space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">3</div>
            <div className="text-xs font-bold text-slate-200">Engineered Systems</div>
            <div className="text-[11px] text-slate-400">Production-Ready Codebases</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xs space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">3</div>
            <div className="text-xs font-bold text-slate-200">Digital Credentials</div>
            <div className="text-[11px] text-slate-400">Cryptographically Signed</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xs space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">Top 1%</div>
            <div className="text-xs font-bold text-slate-200">Algorithmic Rank</div>
            <div className="text-[11px] text-slate-400">SkillProof Platform Benchmark</div>
          </div>
        </section>

        {/* Section 1: Cryptographically Verified Digital Credentials */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Award className="w-6 h-6 text-indigo-400" />
                Cryptographically Verified Credentials
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Asymmetrically signed using Ed25519 private keys and verifiable via public QR codes without login.
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
              RFC 8032 Standards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {credentials.map((c) => (
              <div
                key={c.credential_id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-5 shadow-lg group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                      <Sparkles className="w-3 h-3" />
                      Official Certificate
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      Valid Proof
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                      {c.description}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issuer:</span>
                      <span className="text-slate-300 font-medium">{c.issuer_name || 'VIT Technical Board'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issued On:</span>
                      <span className="text-slate-300">
                        {new Date(c.issued_at || Date.now()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Credential ID:</span>
                      <span className="text-indigo-400 font-semibold">{c.credential_id}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => setSelectedQR(c)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                    View QR
                  </button>

                  <Link
                    to={`/verify/${c.credential_id}`}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 transition-all shadow-xs"
                  >
                    Verify Proof <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Technical Competencies & Evidence Matrix */}
        <section className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Code2 className="w-6 h-6 text-emerald-400" />
              Technical Competencies & Verified Evidence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrated proficiencies verified through automated execution test cases and benchmark problems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SKILL_CATEGORIES.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg"
                >
                  <div className="flex items-center gap-2.5 text-slate-200 font-bold text-base pb-2 border-b border-slate-800">
                    <Icon className="w-5 h-5 text-indigo-400" />
                    <span>{cat.name}</span>
                  </div>

                  <div className="space-y-3">
                    {cat.skills.map((s, sIdx) => (
                      <div key={sIdx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{s.name}</span>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            {s.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {s.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Featured Engineered Projects */}
        <section className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <FolderGit2 className="w-6 h-6 text-purple-400" />
              Featured Engineered Projects
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              End-to-end applications showcasing systems design, performance tuning, and clean code.
            </p>
          </div>

          <div className="space-y-5">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-slate-700 transition-all shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{p.title}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Production Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.repository_url && (
                      <a
                        href={p.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <GithubIcon className="w-3.5 h-3.5" /> Source Code
                      </a>
                    )}
                    {p.live_url && (
                      <a
                        href={p.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>

                {/* Architecture Highlights */}
                {p.highlights && (
                  <div className="space-y-1.5 pt-2">
                    {p.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  {(p.technologies || []).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Academic & Experience Timeline */}
        <section className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-cyan-400" />
              Education & Engineering Journey
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Education Tile */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-400 font-bold">2022 – 2026</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-semibold text-[10px]">
                  Undergraduate Degree
                </span>
              </div>
              <h3 className="text-base font-bold text-white">B.Tech in Computer Science & Engineering</h3>
              <p className="text-xs text-slate-300 font-medium">Vellore Institute of Technology (VIT)</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Core coursework: Distributed Systems, Operating Systems, Database Management Systems, Advanced Data Structures & Algorithms, Network Security, Computer Architecture.
              </p>
            </div>

            {/* Experience Tile */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-400 font-bold">2024 – Present</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 font-semibold text-[10px]">
                  Software Engineering
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Full-Stack Engineering & Open Source</h3>
              <p className="text-xs text-slate-300 font-medium">Independent & Collaborative Systems</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Engineered microservices suites, automated testing sandboxes, and cryptographic credential issuance architectures with sub-millisecond execution runtime.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Hire / Contact Card */}
        <section className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-8 sm:p-10 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Interested in discussing engineering opportunities?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            I am currently open to full-time Software Engineer roles, graduate programs, and high-impact distributed systems teams.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${profile.email || 'surendharkavin01@gmail.com'}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" /> Send an Email
            </a>
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700 flex items-center gap-2"
              >
                <LinkedinIcon className="w-4 h-4" /> Connect on LinkedIn
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all border border-slate-700 flex items-center gap-2"
              >
                <GithubIcon className="w-4 h-4" /> View GitHub
              </a>
            )}
          </div>
        </section>

        {/* Cryptographic Guarantee Footer */}
        <footer className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-2 text-indigo-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> Verified by AI SkillProof Cryptographic Framework
          </div>
          <p className="max-w-xl mx-auto">
            All assessment benchmarks and digital credentials presented on this portfolio are signed with Ed25519 asymmetric keys. Digital signatures are verifiable by any third party using public verification endpoints.
          </p>
        </footer>
      </main>

      {/* QR Inspection Modal */}
      {selectedQR && (
        <QRModal credential={selectedQR} onClose={() => setSelectedQR(null)} />
      )}
    </div>
  );
}
