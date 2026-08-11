import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Play, 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Link2, 
  Activity, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Globe 
} from 'lucide-react';

interface ProviderOption {
  id: string;
  name: string;
  requiresKey: boolean;
  hasKey: boolean;
  baseUrl?: string;
  defaultModel?: string;
}

interface SettingsMetrics {
  totalRequests: number;
  totalTokensUsed: number;
  avgLatencyMs: number;
}

interface SettingsData {
  currentProvider: string;
  provider: string;
  defaultModel: string;
  availableProviders: ProviderOption[];
  metrics: SettingsMetrics;
}

interface SettingsPanelProps {
  onTriggerDemo: (scenario: string) => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onTriggerDemo }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [providerType, setProviderType] = useState<'gemini' | 'openai' | 'ollama' | 'custom'>('gemini');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Gemini config panel: load agent-AI settings
  useEffect(() => {
    fetch('/api/agent-ai/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setIsEnabled(data.settings.isEnabled);
          setProviderType(data.settings.providerType);
          setApiUrl(data.settings.apiUrl || '');
          setApiKey(data.settings.apiKey || '');
          setModelName(data.settings.modelName || '');
        }
      })
      .catch((err) => console.error('Failed to fetch settings:', err));
  }, []);

  // Multi-provider switcher: load settings
  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setData(data);
      setSelectedProvider(data.currentProvider || data.provider || 'gemini');
      setSelectedModel(data.defaultModel || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Gemini config panel: save
  const handleSave = async () => {
    setSaveStatus('saving');
    setTestStatus('idle');
    try {
      const res = await fetch('/api/agent-ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          providerType,
          apiUrl,
          apiKey,
          modelName,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setApiKey(data.settings.apiKey || '');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('error');
    }
  };

  // Gemini config panel: test connection
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/agent-ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          providerType,
          apiUrl,
          apiKey,
          modelName,
          connectionStatus: 'disconnected',
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setTestStatus('success');
        setTestMessage(data.message);
      } else {
        setTestStatus('error');
        setTestMessage(data.message || 'Verification Failed');
      }
    } catch (err: any) {
      console.error('Failed to test connection:', err);
      setTestStatus('error');
      setTestMessage(err.message || 'Network error during test');
    }
  };

  // Multi-provider switcher: switch provider
  const handleSwitchProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwitching(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { provider: selectedProvider, model: selectedModel };
      if (selectedProvider === 'openai' || selectedProvider === 'ollama' || selectedProvider === 'lmstudio') {
        if (customBaseUrl) body.baseUrl = customBaseUrl;
      }
      if (selectedProvider === 'openai' || selectedProvider === 'groq') {
        if (apiKeyInput) body.apiKey = apiKeyInput;
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ text: result.message, type: 'success' });
        await loadSettings();
        setApiKeyInput('');
        setCustomBaseUrl('');
      } else {
        setMessage({ text: result.error || 'Switch failed', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error', type: 'error' });
    } finally {
      setSwitching(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const getProviderBadge = (provider: ProviderOption) => {
    if (provider.id === (data?.currentProvider || data?.provider)) {
      return { label: 'Active', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    }
    if (provider.hasKey) {
      return { label: 'Available', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    return { label: 'No Key', cls: 'bg-slate-500/10 text-slate-500 border-slate-700/50' };
  };

  // Gemini config panel: loading/failed states

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading settings...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 font-mono text-xs">
        Failed to load settings.
      </div>
    );
  }

  const selectedOpt = data.availableProviders.find(p => p.id === selectedProvider);

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-1">
      {/* Header */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">SYSTEM CONFIGURATION</h2>
            <p className="text-xs text-slate-400">LLM providers, model selection, and swarm engine parameters.</p>
          </div>
        </div>
        <button
          onClick={loadSettings}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Connected Hermes Agent AI Connection Panel (origin/main) */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Connected Hermes Agent AI
            </h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isEnabled} 
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950"></div>
            <span className="ml-3 text-xs font-medium text-slate-300">
              {isEnabled ? 'Active Integration' : 'Standby Mode'}
            </span>
          </label>
        </div>

        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Establish an outbound execution boundary. Connecting to an external Hermes Agent AI or local Ollama instance redirects advanced reasoning and collective swarm decisions to that custom brain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">Provider Type</label>
            <select 
              value={providerType} 
              onChange={(e) => {
                const val = e.target.value as any;
                setProviderType(val);
                if (val === 'gemini') {
                  setApiUrl('https://generativelanguage.googleapis.com/v1beta/models');
                  setModelName('gemini-2.5-flash');
                } else if (val === 'ollama') {
                  setApiUrl('http://localhost:11434/v1');
                  setModelName('llama3');
                } else if (val === 'openai') {
                  setApiUrl('https://api.openai.com/v1');
                  setModelName('gpt-4o-mini');
                } else {
                  setApiUrl('');
                  setModelName('');
                }
              }}
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="gemini">Google Gemini API</option>
              <option value="openai">OpenAI Compatible API</option>
              <option value="ollama">Local Ollama Instance</option>
              <option value="custom">Custom Agent AI Server</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">Model Identifier</label>
            <input 
              type="text" 
              value={modelName} 
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Model name"
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">Endpoint API URL</label>
            <input 
              type="text" 
              value={apiUrl} 
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
              <span>Secret API Key / Authentication Token</span>
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[10px] text-cyan-400 hover:underline hover:text-cyan-300"
              >
                {showKey ? 'Hide Secret' : 'Reveal Secret'}
              </button>
            </label>
            <input 
              type={showKey ? 'text' : 'password'} 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={apiKey ? '••••••••••••••••' : 'Enter security key/token'}
              className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {testStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Testing AI Endpoint...
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Test AI Connection
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save AI Configuration
                </>
              )}
            </button>
          </div>

          <div className="text-xs">
            {testStatus === 'success' && (
              <span className="text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                {testMessage || 'Connected! Connected to Custom Agent AI successfully.'}
              </span>
            )}
            {testStatus === 'error' && (
              <span className="text-rose-400 flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {testMessage || 'Connection failed'}
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check className="w-4 h-4 text-emerald-400" />
                Configuration saved successfully!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prebuilt Demo Scenarios (shared) */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Play className="w-4 h-4 text-cyan-400" /> One-Click Swarm Demo Scenarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" /> Security & Vulnerability Audit
            </div>
            <p className="text-xs text-slate-400">Full-stack security audit across microservices with Security, Code Quality, and Critic agents.</p>
            <button onClick={() => onTriggerDemo('security_audit')} className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Run Security Audit
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Post-Quantum Cryptography
            </div>
            <p className="text-xs text-slate-400">Research Kyber/Dilithium algorithms and generate API migration specifications.</p>
            <button onClick={() => onTriggerDemo('quantum_crypto')} className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Run Quantum Crypto
            </button>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Architecture & Performance
            </div>
            <p className="text-xs text-slate-400">Identify bottlenecks, run memory heap analysis, and generate refactoring specs.</p>
            <button onClick={() => onTriggerDemo('refactor_core')} className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Run Refactor
            </button>
          </div>
        </div>
      </div>

      {/* LLM Provider Management (my wip commit) */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/20 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4" /> LLM Provider Configuration
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Switch between free local models, cloud APIs, or the built-in reasoner.</p>
          </div>
          {message && (
            <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${message.type === 'success' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Active Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.availableProviders.map((provider) => {
            const badge = getProviderBadge(provider);
            const isActive = provider.id === (data.currentProvider || data.provider);
            return (
              <button
                key={provider.id}
                onClick={() => { setSelectedProvider(provider.id); setSelectedModel(provider.defaultModel || ''); }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{provider.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                </div>
                {provider.baseUrl && (
                  <div className="text-[10px] font-mono text-slate-400 mb-1 truncate">{provider.baseUrl}</div>
                )}
                {provider.defaultModel && (
                  <div className="text-[10px] font-mono text-slate-500">Default: {provider.defaultModel}</div>
                )}
                {isActive && <div className="text-[10px] text-cyan-400 font-mono mt-1">● Currently active</div>}
              </button>
            );
          })}
        </div>

        {/* Provider Switcher Form */}
        <form onSubmit={handleSwitchProvider} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">Switch Provider</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => { setSelectedProvider(e.target.value); setSelectedModel(data.availableProviders.find(p => p.id === e.target.value)?.defaultModel || ''); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
              >
                {data.availableProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Model Name</label>
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="e.g. llama3.2, gpt-4o-mini"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {(selectedProvider === 'openai' || selectedProvider === 'ollama' || selectedProvider === 'lmstudio') && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                {selectedProvider === 'ollama' ? 'Ollama Base URL' : selectedProvider === 'lmstudio' ? 'LM Studio Base URL' : 'OpenAI Base URL'}
              </label>
              <input
                type="text"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder={selectedOpt?.baseUrl || 'http://localhost:11434'}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          )}

          {(selectedProvider === 'openai' || selectedProvider === 'groq') && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">API Key (stored in memory for this session)</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-500">
              Current: <span className="text-cyan-400 font-bold">{data.currentProvider || data.provider}</span>
              {data.defaultModel && <span> · {data.defaultModel}</span>}
            </div>
            <button
              type="submit"
              disabled={switching}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              {switching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {switching ? 'Switching...' : 'Apply & Restart Provider'}
            </button>
          </div>
        </form>

        {/* Live Metrics */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Provider Metrics</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Total Requests</div>
              <div className="font-mono text-slate-200 font-bold text-sm">{data.metrics.totalRequests}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Tokens Used</div>
              <div className="font-mono text-slate-200 font-bold text-sm">{data.metrics.totalTokensUsed.toLocaleString()}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Avg Latency</div>
              <div className="font-mono text-slate-200 font-bold text-sm">{data.metrics.avgLatencyMs}ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Engine Parameters (static) */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Engine Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-slate-400 text-[11px]">AI Model Provider</div>
            <div className="text-slate-100 font-bold flex items-center gap-2">
              {data.currentProvider || data.provider}
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              {(data.currentProvider || data.provider) === 'ollama' || (data.currentProvider || data.provider) === 'lmstudio'
                ? 'Local inference — no API calls leave your machine.'
                : 'Configured via env vars with fallback local reasoning.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-slate-400 text-[11px]">Self-Healing Supervisor</div>
            <div className="text-slate-100 font-bold flex items-center gap-2">
              15-Second Heartbeat Monitoring Active
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 font-sans">Auto-recovery: Retry → Reassign → Escalate to Hermes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
