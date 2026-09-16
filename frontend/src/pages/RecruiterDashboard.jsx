import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Users,
  Search,
  Filter,
  BookmarkPlus,
  ExternalLink,
  Award,
  CheckCircle2,
  FolderGit2,
  Send,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [notes, setNotes] = useState('');
  const [selectedShortlistId, setSelectedShortlistId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [candData, slData] = await Promise.all([
        api.searchCandidates(),
        api.getShortlists().catch(() => []),
      ]);
      setCandidates(candData || []);
      setShortlists(slData || []);
      if (slData && slData.length > 0) {
        setSelectedShortlistId(slData[0].id);
      }
    } catch (err) {
      console.error('Recruiter data error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filtered = await api.searchCandidates({
        query: searchQuery,
        skills: selectedSkill ? [selectedSkill] : undefined,
      });
      setCandidates(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShortlist = async (candidate) => {
    try {
      let targetListId = selectedShortlistId;
      if (!targetListId) {
        const created = await api.createShortlist({
          name: 'General Candidate Shortlist',
          description: 'Top verified technical prospects',
        });
        targetListId = created.id;
        setShortlists([...shortlists, created]);
        setSelectedShortlistId(created.id);
      }

      await api.addCandidateToShortlist(targetListId, candidate.id, notes || 'Verified candidate');
      setActionMessage(`Added ${candidate.full_name} to shortlist!`);
      setTimeout(() => setActionMessage(''), 3000);
      setSelectedCandidate(null);
      setNotes('');
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
            <Users className="w-7 h-7 text-emerald-600" />
            Verified Technical Talent Discovery
          </h1>
          <p className="text-xs text-slate-600">
            Source candidates backed by automated code benchmarks, real project evidence, and digital credentials.
          </p>
        </div>

        <Link to="/recruiter/shortlists">
          <Button variant="secondary" size="sm" icon={BookmarkPlus}>
            Manage Shortlists ({shortlists.length})
          </Button>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate by name, skills (e.g. React, TypeScript), or title..."
            className="w-full bg-slate-50 text-slate-800 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Technical Skills</option>
          <option value="React.js">React.js</option>
          <option value="TypeScript">TypeScript</option>
          <option value="Node.js">Node.js</option>
          <option value="Python">Python</option>
          <option value="PostgreSQL">PostgreSQL</option>
        </select>

        <Button type="submit" variant="success" size="sm">
          Filter Candidates
        </Button>
      </form>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {candidates.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xl flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {c.full_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{c.full_name}</h3>
                    <p className="text-xs text-indigo-700 font-medium">{c.headline}</p>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">Verified</Badge>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {c.bio || 'Candidate focused on building scalable, verifiable full-stack applications.'}
              </p>

              {/* Skills and Evidence preview */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Verified Skills:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(c.skills || ['React.js', 'TypeScript', 'Node.js']).slice(0, 5).map((s, i) => (
                    <Badge key={i} variant="default" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Credentials preview */}
              {c.credentials && c.credentials.length > 0 && (
                <div className="pt-2 flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{c.credentials[0].title}</span>
                </div>
              )}
            </div>

            {/* Recruiter Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <a
                href={`/p/alex-vance`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                View Public Portfolio <ExternalLink className="w-3 h-3" />
              </a>

              <Button
                onClick={() => setSelectedCandidate(c)}
                variant="secondary"
                size="sm"
                icon={BookmarkPlus}
              >
                Add to Shortlist
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add to Shortlist Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-md border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Save {selectedCandidate.full_name} to Shortlist
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Recruiter Private Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private evaluation notes (e.g. Strong benchmark pass rate, recommend for Senior Frontend role)..."
                className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(null)}>
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleAddToShortlist(selectedCandidate)}
              >
                Confirm & Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
