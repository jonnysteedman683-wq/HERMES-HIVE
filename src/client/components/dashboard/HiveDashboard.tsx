import React, { useState, useEffect } from 'react';
import { Agent, DiagnosticsMetrics, HiveEvent, Mission } from '../../../shared/types';
import { SwarmTopology } from '../swarm/SwarmTopology';
import { Bot, Network, Target, Activity, Zap, Cpu, Award, Moon, Play, Clock, User, CheckCircle2, ShieldAlert, Sparkles, Plus, Edit2, Trash2, X, Settings } from 'lucide-react';

interface QuickActionLog {
  id: string;
  templateName: string;
  scenario: string;
  timestamp: string;
  initiatedBy: string;
}

interface QuickActionTemplate {
  id: string;
  name: string;
  scenario: string;
  prompt: string;
  badge: string;
  iconName: string;
}

interface HiveDashboardProps {
  agents: Agent[];
  missions: Mission[];
  events: HiveEvent[];
  diagnostics: DiagnosticsMetrics | null;
  selectedAgents?: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onSelectAgents?: (agents: Agent[]) => void;
  onSendObjective: (command: string) => Promise<void>;
  onTriggerDemo: (scenario: string) => Promise<void>;
}

export const HiveDashboard: React.FC<HiveDashboardProps> = ({
  agents,
  missions,
  events,
  diagnostics,
  selectedAgents,
  onSelectAgent,
  onSelectAgents,
  onSendObjective,
  onTriggerDemo,
}) => {
  const activeMissions = missions.filter((m) => m.status === 'in_progress');
  const completedMissions = missions.filter((m) => m.status === 'completed');

  const [quickActionHistory, setQuickActionHistory] = useState<QuickActionLog[]>([]);
  const [templates, setTemplates] = useState<QuickActionTemplate[]>([]);
  const [triggeringScenario, setTriggeringScenario] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickActionTemplate | null>(null);
  const [formName, setFormName] = useState('');
  const [formScenario, setFormScenario] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formIconName, setFormIconName] = useState('Zap');

  useEffect(() => {
    fetch('/api/quick-actions/history')
      .then((r) => r.json())
      .then((data) => {
        if (data.history) setQuickActionHistory(data.history);
      })
      .catch((err) => console.error('Failed to load quick action history:', err));

    fetch('/api/quick-actions/templates')
      .then((r) => r.json())
      .then((data) => {
        if (data.templates) setTemplates(data.templates);
      })
      .catch((err) => console.error('Failed to load templates:', err));
  }, []);

  const handleTriggerQuickAction = async (scenario: string, templateName: string, prompt?: string) => {
    setTriggeringScenario(scenario);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/quick-actions/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, templateName, prompt, initiatedBy: 'Executive Operator (jonnysteedman683@gmail.com)' }),
      });
      const data = await res.json();
      if (data.history) {
        setQuickActionHistory(data.history);
      }
      setSuccessMessage(`Successfully triggered template: "${templateName}"`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await onTriggerDemo(scenario);
    } catch (err) {
      console.error('Failed to trigger quick action:', err);
    } finally {
      setTriggeringScenario(null);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        const res = await fetch(`/api/quick-actions/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, scenario: formScenario, prompt: formPrompt, badge: formBadge, iconName: formIconName }),
        });
        const data = await res.json();
        if (data.templates) setTemplates(data.templates);
      } else {
        const res = await fetch('/api/quick-actions/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, scenario: formScenario, prompt: formPrompt, badge: formBadge, iconName: formIconName }),
        });
        const data = await res.json();
        if (data.templates) setTemplates(data.templates);
      }
      setIsManageModalOpen(false);
      setEditingTemplate(null);
      setFormName('');
      setFormScenario('');
      setFormPrompt('');
      setFormBadge('');
      setFormIconName('Zap');
    } catch (err) {
      console.error('Failed to save template:', err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quick action template?')) return;
    try {
      const res = await fetch(`/api/quick-actions/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormScenario(`scenario_${Date.now()}`);
    setFormPrompt('');
    setFormBadge('Custom');
    setFormIconName('Zap');
    setIsManageModalOpen(true);
  };

  const openEditModal = (tpl: QuickActionTemplate) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormScenario(tpl.scenario);
    setFormPrompt(tpl.prompt);
    setFormBadge(tpl.badge);
    setFormIconName(tpl.iconName);
    setIsManageModalOpen(true);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon': return <Moon className="w-4 h-4" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-6 pr-1">
      {/* Top Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/12 hover:border-amber-500/30 glow-amber flex items-center gap-3 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Active Swarm</div>
            <div className="text-lg font-light text-slate-100 font-mono">
              {agents.length} <span className="text-xs font-normal text-slate-500">Agents</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/12 hover:border-emerald-500/30 flex items-center gap-3 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Missions Done</div>
            <div className="text-lg font-light text-slate-100 font-mono">
              {completedMissions.length} <span className="text-xs font-normal text-slate-500">Completed</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/12 hover:border-amber-500/30 flex items-center gap-3 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Tokens Processed</div>
            <div className="text-lg font-light text-slate-100 font-mono">
              {diagnostics?.totalTokensUsed || 14200} <span className="text-xs font-normal text-slate-500">Tokens</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/15 hover:border-purple-500/35 glow-violet flex items-center gap-3 transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Swarm Reputation</div>
            <div className="text-lg font-light text-emerald-400 font-mono">
              96 <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">Quick Actions & Swarm Templates</h3>
              <p className="text-[11px] text-slate-400">Trigger or manage custom swarm orchestration templates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {successMessage && (
              <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" /> {successMessage}
              </div>
            )}
            <button
              onClick={openCreateModal}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Manage Templates
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group flex flex-col justify-between space-y-3 relative"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {renderIcon(tpl.iconName)}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{tpl.badge}</span>
                  <button
                    onClick={() => openEditModal(tpl)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleTriggerQuickAction(tpl.scenario, tpl.name, tpl.prompt)}
                disabled={triggeringScenario !== null}
                className="text-left w-full cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">{tpl.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{tpl.prompt}</div>
              </button>
              <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 pt-1">
                {triggeringScenario === tpl.scenario ? 'Triggering...' : 'Trigger Template →'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Templates Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-mono font-bold text-slate-200">
                  {editingTemplate ? 'Edit Swarm Template' : 'Create Custom Swarm Template'}
                </h3>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Deep Architecture Review"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Scenario Key / ID</label>
                <input
                  type="text"
                  required
                  value={formScenario}
                  onChange={(e) => setFormScenario(e.target.value)}
                  placeholder="e.g. deep_architecture_review"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Swarm Directive Prompt</label>
                <textarea
                  required
                  rows={3}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="Detailed instructions for the AI swarm agent cluster..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    required
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. Custom"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Icon Category</label>
                  <select
                    value={formIconName}
                    onChange={(e) => setFormIconName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="Zap">Zap (Performance)</option>
                    <option value="Moon">Moon (Power/Sleep)</option>
                    <option value="ShieldAlert">ShieldAlert (Security)</option>
                    <option value="Sparkles">Sparkles (Advanced/AI)</option>
                    <option value="Cpu">Cpu (Compute)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Center: Living Swarm Topology Visualizer */}
      <SwarmTopology
        agents={agents}
        selectedAgents={selectedAgents}
        onSelectAgent={onSelectAgent}
        onSelectAgents={onSelectAgents}
      />

      {/* Bottom Grid: Active Missions, Quick Action History & Real-Time Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Missions Progress Widget */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> Active Missions
            </h3>
            <span className="text-[10px] font-mono text-slate-500">{activeMissions.length} Running</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {activeMissions.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">
                No active missions currently executing. Click any quick action above to launch a swarm mission.
              </div>
            ) : (
              activeMissions.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate max-w-[80%]">{m.objective}</span>
                    <span className="font-mono text-cyan-400 font-bold">{m.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${m.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scrollable Quick Action Triggers History */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Action History
            </h3>
            <span className="text-[10px] font-mono text-purple-400 font-bold">{quickActionHistory.length} Triggers</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {quickActionHistory.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">
                No quick actions triggered yet.
              </div>
            ) : (
              quickActionHistory.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate">{item.templateName}</span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 truncate">
                    <User className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate text-slate-300">{item.initiatedBy}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Hive Event Feed */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Event Stream
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {events.slice(0, 6).map((evt) => (
              <div key={evt.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      evt.severity === 'error'
                        ? 'bg-red-400'
                        : evt.severity === 'warning'
                        ? 'bg-amber-400'
                        : evt.severity === 'success'
                        ? 'bg-emerald-400'
                        : 'bg-cyan-400'
                    }`}
                  />
                  <span className="text-slate-400">{evt.type}:</span>
                  <span className="text-slate-200 truncate">{evt.source}</span>
                </div>
                <span className="text-slate-500 text-[10px] shrink-0 ml-2">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

