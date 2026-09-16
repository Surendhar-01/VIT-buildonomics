import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Code2,
  Plus,
  Save,
  CheckCircle2,
  Lock,
  Layers,
  Terminal,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    difficulty: 'easy',
    category: 'algorithms',
    constraints: '',
    publicInput: '',
    publicOutput: '',
    hiddenInput: '',
    hiddenOutput: '',
  });

  useEffect(() => {
    loadProblems();
  }, []);

  async function loadProblems() {
    try {
      const list = await api.getProblems();
      setProblems(list || []);
    } catch (err) {
      console.error(err);
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await api.request('/coding-problems', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          description: form.description,
          difficulty: form.difficulty,
          category: form.category,
          constraints: form.constraints,
          supportedLanguages: ['javascript', 'python'],
          starterCode: {
            javascript: 'function solve(input) {\n  // your code\n  return "";\n}\n\nconst fs = require("fs");\nconsole.log(solve(fs.readFileSync(0, "utf-8")));',
            python: 'import sys\n\ndef solve(data):\n    return ""\n\nif __name__ == "__main__":\n    print(solve(sys.stdin.read()))',
          },
        }),
      });

      // Add public sample test case
      if (form.publicInput && form.publicOutput) {
        await api.request(`/coding-problems/${created.id}/test-cases`, {
          method: 'POST',
          body: JSON.stringify({
            inputData: form.publicInput,
            expectedOutput: form.publicOutput,
            isHidden: false,
          }),
        });
      }

      // Add hidden test case
      if (form.hiddenInput && form.hiddenOutput) {
        await api.request(`/coding-problems/${created.id}/test-cases`, {
          method: 'POST',
          body: JSON.stringify({
            inputData: form.hiddenInput,
            expectedOutput: form.hiddenOutput,
            isHidden: true,
          }),
        });
      }

      setStatusMessage(`Problem "${form.title}" created successfully with test cases!`);
      setTimeout(() => setStatusMessage(''), 3000);
      setShowCreate(false);
      setForm({
        title: '',
        slug: '',
        description: '',
        difficulty: 'easy',
        category: 'algorithms',
        constraints: '',
        publicInput: '',
        publicOutput: '',
        hiddenInput: '',
        hiddenOutput: '',
      });
      loadProblems();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Code2 className="w-7 h-7 text-indigo-600" />
            Coding Problem Repository & Test Suites
          </h1>
          <p className="text-xs text-slate-600">
            Create algorithmic benchmarks, configure starter code, and manage hidden evaluation test cases.
          </p>
        </div>

        <Button
          onClick={() => setShowCreate(!showCreate)}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          {showCreate ? 'Cancel' : 'Create Problem'}
        </Button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {showCreate && (
        <div className="p-6 rounded-3xl bg-white border border-indigo-200 shadow-md border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Create Algorithmic Benchmark</h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  placeholder="e.g. Reverse Linked List"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-50 text-slate-800 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Problem Description & Specification
              </label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="State the problem clearly, input format, and output format..."
                className="w-full bg-slate-50 text-slate-800 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">Public Sample Test Case</div>
                <input
                  type="text"
                  value={form.publicInput}
                  placeholder="Input (stdin)"
                  onChange={(e) => setForm({ ...form, publicInput: e.target.value })}
                  className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
                <input
                  type="text"
                  value={form.publicOutput}
                  placeholder="Expected Output (stdout)"
                  onChange={(e) => setForm({ ...form, publicOutput: e.target.value })}
                  className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-800" /> Hidden Assessment Test Case
                </div>
                <input
                  type="text"
                  value={form.hiddenInput}
                  placeholder="Hidden Input"
                  onChange={(e) => setForm({ ...form, hiddenInput: e.target.value })}
                  className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
                <input
                  type="text"
                  value={form.hiddenOutput}
                  placeholder="Hidden Expected Output"
                  onChange={(e) => setForm({ ...form, hiddenOutput: e.target.value })}
                  className="w-full bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Save Benchmark
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Problem List */}
      <div className="space-y-3">
        {problems.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{p.title}</span>
                <Badge variant="cyan" className="text-[10px] capitalize">{p.difficulty}</Badge>
                <span className="text-xs text-slate-500 font-mono">[{p.slug}]</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{p.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-600 font-medium">Published</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
