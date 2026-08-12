import React, { useState } from 'react';
import { MemoryRecord, MemoryLayer } from '../../../shared/types';
import { Database, Search, Plus, Tag, ShieldCheck, Layers } from 'lucide-react';

interface MemoryExplorerProps {
  records: MemoryRecord[];
  onRefresh: () => void;
}

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({ records, onRefresh }) => {
  const [selectedLayer, setSelectedLayer] = useState<MemoryLayer | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLayer, setNewLayer] = useState<MemoryLayer>('semantic');
  const [adding, setAdding] = useState(false);

  const filteredRecords = records.filter((r) => {
    if (selectedLayer !== 'all' && r.layer !== selectedLayer) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.key.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim()) return;

    setAdding(true);
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layer: newLayer,
          key: newKey,
          content: newContent,
          tags: ['custom', newLayer],
        }),
      });
      setNewKey('');
      setNewContent('');
      onRefresh();
    } catch (err) {
      // Fire-and-forget onSubmit: swallow so the rejection cannot escape as
      // an unhandled rejection.
      console.error('[MemoryExplorer] Add memory failed:', err);
    } finally {
      setAdding(false);
    }
  };

  const layers: { id: MemoryLayer | 'all'; label: string }[] = [
    { id: 'all', label: 'All Layers' },
    { id: 'working', label: 'Working' },
    { id: 'episodic', label: 'Episodic' },
    { id: 'semantic', label: 'Semantic' },
    { id: 'procedural', label: 'Procedural' },
    { id: 'agent', label: 'Agent' },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              SHARED HIVE MEMORY ENGINE
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono">
                {records.length} Records
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Categorized memory layers across Working Context, Episodic Experiences, Semantic Knowledge, and Procedural Workflows.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge records..."
            className="w-full bg-slate-900 text-xs text-slate-100 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Col: Add Memory & Layer Tabs */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl space-y-6">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Filter Memory Layer
            </h3>
            <div className="space-y-1">
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLayer(l.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono transition-all ${
                    selectedLayer === l.id
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>{l.label}</span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-500">
                    {l.id === 'all' ? records.length : records.filter((r) => r.layer === l.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Knowledge Entry Form */}
          <form onSubmit={handleAddMemory} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" /> Add Custom Knowledge
            </h4>

            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase">Layer</label>
              <select
                value={newLayer}
                onChange={(e) => setNewLayer(e.target.value as MemoryLayer)}
                className="w-full mt-1 bg-slate-900 text-xs text-slate-200 p-2 rounded-lg border border-slate-800"
              >
                <option value="semantic">Semantic Knowledge</option>
                <option value="procedural">Procedural Workflow</option>
                <option value="working">Working Context</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase">Knowledge Key</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. security_policy_v2"
                className="w-full mt-1 bg-slate-900 text-xs text-slate-200 p-2 rounded-lg border border-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase">Content</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter details..."
                rows={3}
                className="w-full mt-1 bg-slate-900 text-xs text-slate-200 p-2 rounded-lg border border-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={!newKey.trim() || !newContent.trim() || adding}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition-all"
            >
              {adding ? 'Saving Knowledge...' : 'Save Knowledge Record'}
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Memory Records Grid */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800/80 p-6 flex flex-col shadow-xl min-h-0">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredRecords.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-6 text-center border border-dashed border-slate-800 rounded-xl">
                No memory records found matching your filters.
              </div>
            ) : (
              filteredRecords.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase font-bold">
                        {rec.layer}
                      </span>
                      <h4 className="font-bold text-slate-100 font-mono">{rec.key}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {Math.round(rec.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed font-sans">{rec.content}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-cyan-500" />
                      {rec.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span>Accessed {rec.accessCount} times</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
