import React from 'react';
import { Code2, RotateCcw, Copy, Check } from 'lucide-react';

export default function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  onLanguageChange,
  onReset,
  readOnly = false,
  height = '420px',
}) {
  const [copied, setCopied] = React.useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = (value || '').split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
          </div>
          <div className="h-4 w-[1px] bg-slate-300" />
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-600" />
            {onLanguageChange ? (
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-white text-slate-800 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
              >
                <option value="javascript">JavaScript (Node.js 24)</option>
                <option value="python">Python (3.14)</option>
              </select>
            ) : (
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                {language}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 text-xs flex items-center gap-1 transition-colors"
              title="Reset code template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            onClick={copyCode}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 text-xs flex items-center gap-1 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex flex-1 relative font-mono text-xs leading-relaxed" style={{ height }}>
        {/* Line Numbers */}
        <div className="w-12 py-3 bg-slate-50 select-none text-slate-400 text-right pr-3 font-mono border-r border-slate-200 overflow-hidden">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck="false"
          className="flex-1 p-3 bg-white text-slate-900 outline-none resize-none font-mono text-xs leading-6 selection:bg-indigo-100 placeholder-slate-400"
          placeholder="// Type your solution here..."
        />
      </div>
    </div>
  );
}
