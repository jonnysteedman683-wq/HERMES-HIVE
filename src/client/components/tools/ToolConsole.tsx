import React, { useState } from 'react';
import { Wrench, Play, Shield, Terminal } from 'lucide-react';

export const ToolConsole: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('calculator');
  const [inputJson, setInputJson] = useState('{"expression": "42 * 100 / 2"}');
  const [output, setOutput] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const toolsList = [
    { name: 'calculator', desc: 'Evaluates basic mathematical expressions safely.', permissions: ['math'] },
    { name: 'http_get', desc: 'Performs HTTP GET requests to fetch data from APIs or web pages.', permissions: ['network_read'] },
    { name: 'json_parser', desc: 'Validates, formats, and extracts paths from JSON strings.', permissions: ['data_parse'] },
    { name: 'text_analyzer', desc: 'Analyzes word count, readability score, sentiment keywords, and token estimates.', permissions: ['text_process'] },
    { name: 'repository_reader', desc: 'Scans the workspace directory structure, files, and package manifests.', permissions: ['repo_read'] },
    { name: 'security_auditor', desc: 'Audits code or configurations for OWASP security threats and secret leaks.', permissions: ['security_audit'] },
  ];

  const handleTestTool = async () => {
    setExecuting(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(inputJson);
      } catch {
        parsed = { text: inputJson, expression: inputJson };
      }

      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName: selectedTool, input: parsed }),
      });
      const data = await res.json();
      setOutput(data);
    } catch (err) {
      setOutput({ error: String(err) });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              PLUGGABLE TOOL REGISTRY
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono">
                6 Active Tools
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Safe tool environment enforcing permission boundaries and explicit scope limits across all swarm agents.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Col: Tool Registry List */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-5 flex flex-col shadow-xl min-h-0">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" /> Registered Tools & Scopes
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {toolsList.map((tool) => (
              <div
                key={tool.name}
                onClick={() => {
                  setSelectedTool(tool.name);
                  if (tool.name === 'calculator') setInputJson('{"expression": "42 * 100 / 2"}');
                  else if (tool.name === 'text_analyzer') setInputJson('{"text": "Hermes Hive is an autonomous multi-agent platform with zero vulnerability risks."}');
                  else setInputJson('{}');
                }}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                  selectedTool === tool.name
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-xs font-bold text-cyan-300">{tool.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {tool.permissions[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-sans">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Tool Testing Console */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800/80 p-6 flex flex-col shadow-xl min-h-0 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" /> Tool Execution Tester: {selectedTool}
            </h3>

            <button
              onClick={handleTestTool}
              disabled={executing}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5" /> Execute Tool
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase">Input JSON Payload</label>
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 text-xs font-mono text-slate-200 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase">Execution Output</label>
            <div className="flex-1 bg-slate-900/90 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-y-auto">
              {output ? (
                <pre>{JSON.stringify(output, null, 2)}</pre>
              ) : (
                <span className="text-slate-500 italic">Click 'Execute Tool' above to test tool execution and view raw output.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
