import React, { useState, useEffect, useRef } from 'react';
import {
  Conversation,
  ConversationContext,
  ChatMessage,
  ChatIntent,
  ChatRichCard,
  ChatSource,
  ChatActionRequired,
} from '../../../shared/types';
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Terminal,
  Activity,
  Layers,
  ExternalLink,
  HelpCircle,
  BarChart3,
  Globe,
  Database,
} from 'lucide-react';

interface HermesChatConsoleProps {
  initialContext?: ConversationContext;
  initialPrompt?: string;
  onNavigateTab?: (tab: string) => void;
  onTriggerDemo?: (scenario: string) => Promise<void>;
}

export const HermesChatConsole: React.FC<HermesChatConsoleProps> = ({
  initialContext,
  initialPrompt,
  onNavigateTab,
  onTriggerDemo,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('conv_default');
  const [inputText, setInputText] = useState<string>(initialPrompt || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');
  const [floatingCards, setFloatingCards] = useState<
    { id: string; title: string; prompt: string; type: string }[]
  >([
    {
      id: 'card_missions',
      title: 'Missions Context',
      prompt: 'Ask Hermes about active missions and task progress',
      type: 'mission',
    },
    {
      id: 'card_diagnostics',
      title: 'Diagnostics Sweep',
      prompt: 'Ask Hermes to run a diagnostic sweep on capability bridge',
      type: 'diagnostic',
    },
    {
      id: 'card_status',
      title: 'Swarm Executive Status',
      prompt: 'Summarize overall Hive agent workload & health',
      type: 'status',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto handle initial prompt when passed or changed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/v1/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConvId) {
          setActiveConvId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId, loading]);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleNewConversation = async () => {
    try {
      const res = await fetch('/api/v1/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          context: initialContext,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setConversations([d.conversation, ...conversations]);
        setActiveConvId(d.conversation.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    if (!textToSend) setInputText('');
    setShowCommandPalette(false);
    setLoading(true);

    try {
      const targetConvId = activeConvId || 'conv_default';
      const res = await fetch(`/api/v1/chat/conversations/${targetConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          context: initialContext,
        }),
      });

      if (res.ok) {
        const d = await res.json();
        setConversations((prev) =>
          prev.map((c) => (c.id === d.conversation.id ? d.conversation : c))
        );
        setActiveConvId(d.conversation.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    try {
      const res = await fetch(`/api/v1/chat/actions/${actionId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Executive Operator' }),
      });
      if (res.ok) {
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/chat/conversations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updated = conversations.filter((c) => c.id !== id);
        setConversations(updated);
        if (activeConvId === id) {
          setActiveConvId(updated[0]?.id || '');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTitle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/chat/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitleText }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: editingTitleText } : c))
        );
        setEditingTitleId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const commands = [
    { cmd: '/status', label: 'Summarize Hermes Hive executive status' },
    { cmd: '/missions', label: 'View and manage active swarm missions' },
    { cmd: '/diagnostics', label: 'Run deep diagnostic and failure analysis' },
    { cmd: '/world', label: 'Inspect World State Model & Web capabilities' },
    { cmd: '/research', label: 'Initiate multi-Hive research mission' },
  ];

  const samplePrompts = [
    "What's happening across the Hive right now?",
    'Why did the recent mission or task fail?',
    'Run diagnostics on Hermes Web capability bridge.',
    'Create a research mission to evaluate post-quantum crypto.',
    'How healthy are the federated Hives?',
  ];

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden font-sans">
      {/* Top Console Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-all"
            title="Toggle Conversations Sidebar"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-md shadow-cyan-500/10">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              HERMES COGNITIVE CONSOLE
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono">
                Gemini 3.6 Flash
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected to Swarm • Real-Time Hive Context Active</span>
            </p>
          </div>
        </div>

        {/* Attached Context Badge */}
        {activeConversation?.context && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Context: {activeConversation.context.pageTitle || 'Dashboard View'}</span>
          </div>
        )}

        {/* Quick Demo Scenario Triggers */}
        {onTriggerDemo && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerDemo('security_audit')}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-medium transition-all"
            >
              Security Audit
            </button>
            <button
              onClick={() => onTriggerDemo('quantum_crypto')}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-medium transition-all"
            >
              Quantum Crypto
            </button>
          </div>
        )}
      </div>

      {/* Main Layout Body */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Sidebar: Conversations History */}
        {sidebarOpen && (
          <div className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-10">
            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              <button
                onClick={handleNewConversation}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Conversation</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 font-bold">
                  Recent Conversations
                </span>

                {filteredConvs.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const isEditing = editingTitleId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                        isActive
                          ? 'bg-slate-900 text-cyan-300 border-cyan-500/40 shadow-sm'
                          : 'bg-slate-950 hover:bg-slate-900/60 text-slate-400 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingTitleText}
                            onChange={(e) => setEditingTitleText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 text-slate-100 text-xs px-1 rounded border border-cyan-500 w-full"
                          />
                        ) : (
                          <span className="truncate font-medium">{conv.title}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <button
                            onClick={(e) => handleSaveTitle(conv.id, e)}
                            className="text-emerald-400 hover:text-emerald-300 p-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(conv.id);
                              setEditingTitleText(conv.title);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Area: Messages Stream & Input */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40 relative overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeConversation?.messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
                      isUser
                        ? 'bg-purple-950/80 border-purple-800/80 text-purple-300'
                        : 'bg-cyan-950/80 border-cyan-800/80 text-cyan-300'
                    }`}
                  >
                    {isUser ? (
                      <Terminal className="w-4 h-4" />
                    ) : (
                      <Bot className="w-5 h-5 animate-pulse" />
                    )}
                  </div>

                  {/* Message Bubble Body */}
                  <div
                    className={`max-w-3xl rounded-2xl p-5 border space-y-3 ${
                      isUser
                        ? 'bg-purple-950/30 border-purple-800/60 text-purple-100 rounded-tr-none'
                        : 'bg-slate-950/90 border-slate-800/90 text-slate-200 rounded-tl-none shadow-xl'
                    }`}
                  >
                    {/* Header line for message */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-2 text-[11px] font-mono">
                      <span className="font-bold tracking-wide flex items-center gap-2">
                        {isUser ? 'HUMAN OPERATOR' : 'HERMES EXECUTIVE'}
                        {msg.intent && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 text-[10px]">
                            {msg.intent}
                          </span>
                        )}
                      </span>
                      <span className="text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {/* Cognitive Activity Steps */}
                    {!isUser && msg.activitySteps && msg.activitySteps.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                        <div className="text-slate-400 font-bold flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                          <span>Cognitive Execution Log:</span>
                        </div>
                        {msg.activitySteps.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{s.step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Body Text */}
                    <div className="text-sm font-sans leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {/* Rich Cards */}
                    {msg.richCards && msg.richCards.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {msg.richCards.map((card, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs"
                          >
                            <div className="font-mono font-bold text-cyan-300 flex items-center justify-between border-b border-slate-800 pb-2">
                              <span>{card.title || 'Live System Data'}</span>
                              <span className="text-[10px] text-slate-500 uppercase">{card.type}</span>
                            </div>

                            {card.type === 'status' && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300 text-[11px]">
                                <div>Working Agents: <strong className="text-emerald-400">{card.data.activeAgentsCount}</strong></div>
                                <div>Idle Agents: <strong className="text-slate-100">{card.data.idleAgentsCount}</strong></div>
                                <div>Active Missions: <strong className="text-cyan-400">{card.data.activeMissionsCount}</strong></div>
                                <div>Capabilities: <strong className="text-purple-400">{card.data.capabilitiesCount}</strong></div>
                              </div>
                            )}

                            {card.type === 'mission' && card.data.missions && (
                              <div className="space-y-2">
                                {card.data.missions.map((m: any) => (
                                  <div
                                    key={m.id}
                                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-200">{m.objective}</div>
                                      <div className="text-[10px] text-slate-400">Status: {m.status} • Tasks: {m.taskCount}</div>
                                    </div>
                                    <button
                                      onClick={() => onNavigateTab?.('missions')}
                                      className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] hover:bg-cyan-900 flex items-center gap-1"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {card.type === 'diagnostic' && card.data.recentIncidents && (
                              <div className="space-y-2">
                                {card.data.recentIncidents.map((i: any) => (
                                  <div
                                    key={i.id}
                                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="font-bold text-amber-300">{i.title}</div>
                                      <div className="text-[10px] text-slate-400">Severity: {i.severity} • Status: {i.status}</div>
                                    </div>
                                    <button
                                      onClick={() => onNavigateTab?.('diagnostics')}
                                      className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] hover:bg-amber-900 flex items-center gap-1"
                                    >
                                      <span>Inspect</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* High-Risk Action Confirmation Box */}
                    {msg.actionRequired && (
                      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-3 text-xs">
                        <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                          <ShieldAlert className="w-4 h-4" />
                          <span>EXECUTIVE ACTION AUTHORIZATION REQUIRED</span>
                        </div>
                        <div className="text-slate-300 space-y-1 text-[11px]">
                          <div>Action: <strong className="text-amber-300">{msg.actionRequired.actionType}</strong></div>
                          <div>Target: <strong className="text-slate-100">{msg.actionRequired.target}</strong></div>
                          <div>Risk: <strong className="text-rose-400">{msg.actionRequired.risk}</strong></div>
                          <div>Consequences: {msg.actionRequired.consequences}</div>
                        </div>

                        {msg.actionRequired.status === 'pending' ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-amber-900/60">
                            <button
                              onClick={() => handleConfirmAction(msg.actionRequired!.actionId)}
                              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Authorize & Execute Action</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Action Authorized & Executed</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expandable Evidence / Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60">
                        <button
                          onClick={() =>
                            setExpandedSources((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                          className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-mono"
                        >
                          {expandedSources[msg.id] ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                          <span>Provenances & Data Sources ({msg.sources.length})</span>
                        </button>

                        {expandedSources[msg.id] && (
                          <div className="mt-2 space-y-1 pl-4 text-[10px] text-slate-400 font-mono">
                            {msg.sources.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-cyan-400">• [{s.category}]</span>
                                <span>{s.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Streaming Indicator */}
            {loading && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="text-xs text-slate-300 font-mono flex items-center gap-2">
                  <span>Hermes reasoning across Hive state...</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Input Console */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0 relative">
            {/* Contextual Floating Action Cards */}
            {floatingCards.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse text-cyan-400" />
                  <span>Floating Cards:</span>
                </span>
                {floatingCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="group px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs font-medium cursor-pointer transition-all shrink-0 flex items-center gap-2 shadow-sm"
                  >
                    <span>{card.prompt}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFloatingCards((prev) => prev.filter((c) => c.id !== card.id));
                      }}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                      title="Dismiss card"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State Prompt Chips */}
            {activeConversation?.messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 border border-slate-800 text-xs text-left transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Command Palette Suggestions Popup */}
            {showCommandPalette && (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl space-y-1 text-xs mb-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1 font-bold">
                  Command Palette Shortcuts
                </div>
                {commands.map((c) => (
                  <button
                    key={c.cmd}
                    onClick={() => {
                      setInputText(c.cmd + ' ');
                      setShowCommandPalette(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                  >
                    <span className="font-mono text-cyan-400 font-bold">{c.cmd}</span>
                    <span className="text-slate-400 text-[11px]">{c.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <div className="relative flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (e.target.value.startsWith('/')) {
                      setShowCommandPalette(true);
                    } else {
                      setShowCommandPalette(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask Hermes anything about your Hive or issue commands... (Use / for shortcuts)"
                  rows={2}
                  className="w-full bg-slate-900 text-sm text-slate-100 placeholder-slate-500 p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all shrink-0"
                title="Send Message to Hermes"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
