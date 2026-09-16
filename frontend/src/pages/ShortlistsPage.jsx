import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  BookmarkCheck,
  Send,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Users,
  Briefcase,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function ShortlistsPage() {
  const [shortlists, setShortlists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [showOpportunityModal, setShowOpportunityModal] = useState(null);
  const [opportunityMessage, setOpportunityMessage] = useState('');
  const [opportunityJobTitle, setOpportunityJobTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShortlists();
  }, []);

  async function loadShortlists() {
    setLoading(true);
    try {
      const data = await api.getShortlists();
      const listArray = Array.isArray(data) ? data : [];
      setShortlists(listArray);
      if (listArray.length > 0) {
        // Retain current activeListId if still exists, or default to first
        setActiveListId((prev) => {
          if (prev && listArray.some((sl) => sl.id === prev)) return prev;
          return listArray[0].id;
        });
      }
    } catch (err) {
      console.error('Error loading shortlists:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const created = await api.createShortlist({ name: newListName.trim() });
      setShortlists((prev) => [...prev, { ...created, candidates: [] }]);
      setActiveListId(created.id);
      setNewListName('');
      setStatusMessage(`Shortlist "${created.name}" created successfully.`);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveCandidate = async (candidateId) => {
    if (!activeListId || !candidateId) return;
    try {
      await api.removeCandidateFromShortlist(activeListId, candidateId);
      setShortlists((prev) =>
        prev.map((sl) => {
          if (sl.id === activeListId) {
            return {
              ...sl,
              candidates: (sl.candidates || []).filter(
                (c) => c.candidate_id !== candidateId && c.id !== candidateId,
              ),
            };
          }
          return sl;
        }),
      );
      setStatusMessage('Candidate removed from shortlist.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert(`Failed to remove candidate: ${err.message}`);
    }
  };

  const handleDeleteShortlist = async (slId) => {
    if (!window.confirm('Are you sure you want to delete this shortlist?')) return;
    try {
      await api.deleteShortlist(slId);
      setShortlists((prev) => prev.filter((sl) => sl.id !== slId));
      if (activeListId === slId) {
        const remaining = shortlists.filter((sl) => sl.id !== slId);
        setActiveListId(remaining.length > 0 ? remaining[0].id : null);
      }
      setStatusMessage('Shortlist deleted.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      alert(`Failed to delete shortlist: ${err.message}`);
    }
  };

  const handleSendOpportunity = async (e) => {
    e.preventDefault();
    if (!showOpportunityModal) return;
    try {
      await api.request('/recruiters/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          candidateId: showOpportunityModal.candidate_id || showOpportunityModal.id,
          jobTitle: opportunityJobTitle || 'Software Engineer',
          message: opportunityMessage,
        }),
      });
      setStatusMessage(
        `Opportunity dispatched to ${showOpportunityModal.candidate_name || 'candidate'}!`,
      );
      setTimeout(() => setStatusMessage(''), 4000);
      setShowOpportunityModal(null);
      setOpportunityMessage('');
      setOpportunityJobTitle('');
    } catch (err) {
      alert(err.message);
    }
  };

  const activeList = shortlists.find((s) => s.id === activeListId);

  return (
    <div className="w-full space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookmarkCheck className="w-7 h-7 text-emerald-600" />
            Recruiter Shortlists & Talent Pipelines
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Organize verified candidate prospects, review private evaluation notes, and dispatch interview requests.
          </p>
        </div>

        <Link to="/recruiter">
          <Button variant="secondary" size="sm" icon={Users}>
            Browse Talent Discovery
          </Button>
        </Link>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Shortlist Switcher / Creation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-3xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {shortlists.map((sl) => {
            const isActive = activeListId === sl.id;
            return (
              <div key={sl.id} className="inline-flex items-center">
                <button
                  onClick={() => setActiveListId(sl.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span>{sl.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {sl.candidates?.length || 0}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleCreateList} className="flex items-center gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New shortlist name..."
            className="bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Button type="submit" variant="primary" size="sm" icon={Plus}>
            Create List
          </Button>
        </form>
      </div>

      {/* Active Shortlist Details & Candidate List */}
      <div className="space-y-4">
        {activeList && (
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <div>
              Active Pipeline: <strong className="text-slate-800">{activeList.name}</strong>
              {activeList.description && <span className="ml-2 italic">— {activeList.description}</span>}
            </div>
            {shortlists.length > 1 && (
              <button
                onClick={() => handleDeleteShortlist(activeList.id)}
                className="text-slate-400 hover:text-rose-600 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Delete this shortlist"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Shortlist
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500">Loading your candidate shortlists...</span>
          </div>
        ) : activeList && activeList.candidates && activeList.candidates.length > 0 ? (
          <div className="space-y-3">
            {activeList.candidates.map((cand) => (
              <div
                key={cand.id || cand.candidate_id}
                className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5 flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                    {(cand.candidate_name || 'C')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900">
                        {cand.candidate_name}
                      </h3>
                      <Badge variant="success" className="text-[10px]">
                        Verified
                      </Badge>
                      <Badge variant="cyan" className="text-[10px] capitalize">
                        {cand.status || 'reviewing'}
                      </Badge>
                    </div>
                    <p className="text-xs text-indigo-700 font-medium">
                      {cand.candidate_headline || 'Full-Stack Software Engineer'}
                    </p>
                    {cand.notes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2 max-w-xl">
                        <strong className="text-slate-700">Recruiter Evaluation:</strong>{' '}
                        {cand.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={cand.candidate_slug ? `/p/${cand.candidate_slug}` : (cand.candidate_id ? `/p/${cand.candidate_id}` : '/recruiter')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Button
                    onClick={() => setShowOpportunityModal(cand)}
                    variant="primary"
                    size="sm"
                    icon={Send}
                  >
                    Send Opportunity
                  </Button>

                  <button
                    onClick={() => handleRemoveCandidate(cand.candidate_id || cand.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200"
                    title="Remove from this shortlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 text-xs text-slate-600 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Candidates in this Shortlist Yet</h3>
            <p className="max-w-md mx-auto text-slate-500">
              Browse pre-verified engineers, inspect their isolated code test results, and click <strong>"Add to Shortlist"</strong> to build your hiring pipeline.
            </p>
            <div className="pt-2">
              <Link to="/recruiter">
                <Button variant="primary" size="sm" icon={Users}>
                  Browse Candidate Talent Discovery →
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Send Opportunity Modal */}
      {showOpportunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                Dispatch Opportunity
              </h3>
              <button
                onClick={() => setShowOpportunityModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Sending interview invitation to{' '}
              <strong className="text-slate-900">{showOpportunityModal.candidate_name}</strong>.
            </p>

            <form onSubmit={handleSendOpportunity} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Position Title
                </label>
                <input
                  type="text"
                  required
                  value={opportunityJobTitle}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  onChange={(e) => setOpportunityJobTitle(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Personalized Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={opportunityMessage}
                  placeholder="Introduce your team and why their verified SkillProof credentials caught your attention..."
                  onChange={(e) => setOpportunityMessage(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setShowOpportunityModal(null)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" icon={Send}>
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
