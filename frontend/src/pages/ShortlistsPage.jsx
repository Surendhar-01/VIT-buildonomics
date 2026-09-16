import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  BookmarkCheck,
  Send,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
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

  useEffect(() => {
    loadShortlists();
  }, []);

  async function loadShortlists() {
    try {
      const data = await api.getShortlists();
      setShortlists(data || []);
      if (data && data.length > 0 && !activeListId) {
        setActiveListId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading shortlists:', err);
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const created = await api.createShortlist({ name: newListName.trim() });
      setShortlists([...shortlists, created]);
      setActiveListId(created.id);
      setNewListName('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendOpportunity = async (e) => {
    e.preventDefault();
    try {
      await api.request('/recruiters/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          candidateId: showOpportunityModal.candidate_id,
          jobTitle: opportunityJobTitle || 'Software Engineer',
          message: opportunityMessage,
        }),
      });
      setStatusMessage(`Opportunity dispatched to ${showOpportunityModal.candidate_name}!`);
      setTimeout(() => setStatusMessage(''), 3000);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-7 h-7 text-emerald-600" />
            Recruiter Shortlists & Pipelines
          </h1>
          <p className="text-xs text-slate-600">
            Organize verified candidate prospects, review private evaluation notes, and dispatch interview requests.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Shortlist Switcher / Creation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-3xl">
        <div className="flex flex-wrap items-center gap-2">
          {shortlists.map((sl) => (
            <button
              key={sl.id}
              onClick={() => setActiveListId(sl.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeListId === sl.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {sl.name} ({sl.candidates?.length || 0})
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateList} className="flex items-center gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name..."
            className="bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Button type="submit" variant="secondary" size="sm" icon={Plus}>
            Create
          </Button>
        </form>
      </div>

      {/* Candidate List */}
      <div className="space-y-4">
        {activeList && activeList.candidates && activeList.candidates.length > 0 ? (
          activeList.candidates.map((cand) => (
            <div
              key={cand.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900">{cand.candidate_name}</h3>
                  <Badge variant="cyan" className="text-[10px] capitalize">{cand.status}</Badge>
                </div>
                <p className="text-xs text-indigo-700">{cand.candidate_headline}</p>
                {cand.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                    <strong className="text-slate-700">Recruiter Note:</strong> {cand.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href="/p/alex-vance"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Portfolio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Button
                  onClick={() => setShowOpportunityModal(cand)}
                  variant="success"
                  size="sm"
                  icon={Send}
                >
                  Send Opportunity
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 space-y-2">
            <User className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No candidates added to this shortlist yet.</p>
            <Link to="/recruiter" className="text-emerald-600 hover:underline inline-block mt-1 font-semibold">
              Browse candidate talent to save profiles →
            </Link>
          </div>
        )}
      </div>

      {/* Opportunity Modal */}
      {showOpportunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-md border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Send Opportunity to {showOpportunityModal.candidate_name}
            </h3>

            <form onSubmit={handleSendOpportunity} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Job Position Title
                </label>
                <input
                  type="text"
                  required
                  value={opportunityJobTitle}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  onChange={(e) => setOpportunityJobTitle(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Invitation Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={opportunityMessage}
                  placeholder="Introduce the opportunity and why their verified SkillProof credentials caught your attention..."
                  onChange={(e) => setOpportunityMessage(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowOpportunityModal(null)}>
                  Cancel
                </Button>
                <Button variant="success" size="sm" type="submit" icon={Send}>
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
