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

  // Live instantaneous client-side filter as the user types
  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.headline && c.headline.toLowerCase().includes(q)) ||
      (c.bio && c.bio.toLowerCase().includes(q)) ||
      (c.skills && c.skills.some((s) => s.toLowerCase().includes(q)));

    const skillNorm = selectedSkill.trim().toLowerCase().replace('.js', '');
    const matchesSkill =
      !selectedSkill ||
      (c.skills &&
        c.skills.some((s) => {
          const sNorm = s.toLowerCase().replace('.js', '');
          return sNorm === skillNorm || sNorm.includes(skillNorm) || skillNorm.includes(sNorm);
        }));

    return matchesQuery && matchesSkill;
  });

  // Extract all available unique skills from candidate pool + standard core competencies
  const availableSkills = Array.from(
    new Set([
      'React',
      'TypeScript',
      'JavaScript',
      'Node.js',
      'Python',
      'PostgreSQL',
      ...candidates.flatMap((c) => c.skills || []),
    ]),
  ).sort();

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
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate by name, skills (e.g. React, TypeScript), or title..."
            className="w-full bg-slate-50 text-slate-800 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="w-full sm:w-auto bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Technical Skills</option>
          {availableSkills.map((sk) => (
            <option key={sk} value={sk}>
              {sk}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button type="submit" variant="success" size="sm" className="flex-1 sm:flex-initial">
            Filter Candidates
          </Button>

          {(searchQuery || selectedSkill) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedSkill('');
                loadData();
              }}
              className="text-slate-500 hover:text-slate-800"
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {/* Candidate Cards Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Candidates Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No verified candidates matched "{searchQuery || selectedSkill}". Try searching for another skill like React, Node.js, Python, or clear your filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedSkill('');
              loadData();
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCandidates.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
                      {c.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{c.full_name}</h3>
                      <p className="text-xs text-indigo-700 font-medium">{c.headline || 'Verified Software Engineer'}</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">Verified</Badge>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {c.bio || 'Candidate focused on building scalable, verifiable full-stack applications.'}
                </p>

                {/* Skills preview */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    VERIFIED SKILLS:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills && c.skills.length > 0 ? (
                      c.skills.slice(0, 6).map((s, i) => (
                        <Badge key={i} variant="default" className="text-[10px]">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No skills listed yet</span>
                    )}
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
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={c.slug ? `/p/${c.slug}` : `/p/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  View Public Portfolio <ExternalLink className="w-3 h-3" />
                </Link>

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
      )}

      {/* Add to Shortlist Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Save {selectedCandidate.full_name} to Shortlist
            </h3>

            {shortlists.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Shortlist
                </label>
                <select
                  value={selectedShortlistId}
                  onChange={(e) => setSelectedShortlistId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {shortlists.map((sl) => (
                    <option key={sl.id} value={sl.id}>
                      {sl.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Recruiter Private Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private evaluation notes (e.g. Strong benchmark pass rate, recommend for Senior Full-Stack role)..."
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
