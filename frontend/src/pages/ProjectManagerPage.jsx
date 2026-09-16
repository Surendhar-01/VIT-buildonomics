import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  FolderGit2,
  Plus,
  ExternalLink,
  Trash2,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { GithubIcon } from '../components/BrandIcons';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function ProjectManagerPage() {
  const [projects, setProjects] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    repositoryUrl: '',
    liveUrl: '',
    technologies: 'React, Node.js, TypeScript',
    category: 'Full Stack',
    contributionDetails: '',
    visibility: 'public',
  });

  const [syncingGithub, setSyncingGithub] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const list = await api.getMyProjects();
      setProjects(list);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSyncGithub = async () => {
    if (!formData.repositoryUrl) return;
    setSyncingGithub(true);
    try {
      const meta = await api.syncGitHub(formData.repositoryUrl);
      setFormData((prev) => ({
        ...prev,
        title: meta.title || prev.title,
        description: meta.description || prev.description,
        technologies: meta.topics?.length > 0 ? meta.topics.join(', ') : prev.technologies,
      }));
      setStatusMessage('GitHub metadata fetched successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setStatusMessage(`GitHub sync note: ${err.message}`);
    } finally {
      setSyncingGithub(false);
    }
  };

  const handleAiEnhance = async () => {
    setAiGenerating(true);
    try {
      const techs = formData.technologies.split(',').map((s) => s.trim());
      const res = await api.generateProjectSummary({
        title: formData.title || 'Engineering Project',
        technologies: techs,
        rawNotes: formData.description,
      });

      if (res.description) {
        setFormData((prev) => ({
          ...prev,
          description: `${res.description}\n\nKey Engineering Highlights:\n• ${res.keyHighlights?.join('\n• ')}`,
        }));
        setStatusMessage('AI highlights generated!');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      setStatusMessage(`AI error: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const techs = formData.technologies.split(',').map((s) => s.trim()).filter(Boolean);
      await api.createProject({
        ...formData,
        technologies: techs,
      });
      setShowAddForm(false);
      setFormData({
        title: '',
        description: '',
        repositoryUrl: '',
        liveUrl: '',
        technologies: 'React, Node.js, TypeScript',
        category: 'Full Stack',
        contributionDetails: '',
        visibility: 'public',
      });
      loadProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      loadProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Project Showcase & Evidence
          </h1>
          <p className="text-xs text-slate-600">
            Showcase real repositories, production apps, and technical proof.
          </p>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          {showAddForm ? 'Cancel' : 'Add New Project'}
        </Button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Add Project Form Drawer/Card */}
      {showAddForm && (
        <div className="p-6 rounded-3xl bg-white border border-indigo-200 shadow-md border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-indigo-600" /> Add Engineering Project
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  placeholder="e.g. Distributed Task Queue"
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* GitHub URL and auto sync */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  GitHub Repository URL
                </label>
                <button
                  type="button"
                  onClick={handleSyncGithub}
                  disabled={syncingGithub || !formData.repositoryUrl}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingGithub ? 'animate-spin' : ''}`} />
                  Auto-fetch GitHub Metadata
                </button>
              </div>
              <div className="relative">
                <GithubIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={formData.repositoryUrl}
                  placeholder="https://github.com/username/repository"
                  onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Live Demo URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.liveUrl}
                  placeholder="https://demo.example.com"
                  onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Technologies (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.technologies}
                  placeholder="React, TypeScript, Node.js"
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Description & Architectural Architecture
                </label>
                <button
                  type="button"
                  onClick={handleAiEnhance}
                  disabled={aiGenerating}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiGenerating ? 'Generating...' : 'AI Enhance Summary & Highlights'}
                </button>
              </div>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the problem solved, architectural trade-offs, and technical metrics..."
                className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Save Project
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <Badge variant="cyan" className="text-[10px]">{p.category}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {p.repository_url && (
                  <a
                    href={p.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <GithubIcon className="w-3.5 h-3.5" /> Code
                  </a>
                )}
                {p.live_url && (
                  <a
                    href={p.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-700 border border-indigo-200 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Demo
                  </a>
                )}
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {p.description}
            </p>

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
    </div>
  );
}
