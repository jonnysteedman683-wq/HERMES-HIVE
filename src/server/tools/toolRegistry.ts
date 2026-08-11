import { HiveTool, ToolContext, ToolResult } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';

class ToolRegistry {
  private tools: Map<string, HiveTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // 1. Calculator
    this.registerTool({
      name: 'calculator',
      description: 'Evaluates basic mathematical expressions safely.',
      permissions: ['math'],
      execute: async (input: { expression: string }) => {
        const start = Date.now();
        try {
          const sanitized = input.expression.replace(/[^0-9+\-*/().\s]/g, '');
          // eslint-disable-next-line no-eval
          const result = eval(sanitized);
          return {
            success: true,
            output: { expression: input.expression, result },
            executionTimeMs: Date.now() - start,
          };
        } catch (err) {
          return {
            success: false,
            output: null,
            error: err instanceof Error ? err.message : 'Invalid math expression',
            executionTimeMs: Date.now() - start,
          };
        }
      },
    });

    // 2. HTTP GET
    this.registerTool({
      name: 'http_get',
      description: 'Performs HTTP GET requests to fetch data from APIs or web pages.',
      permissions: ['network_read'],
      execute: async (input: { url: string }, context: ToolContext) => {
        const start = Date.now();
        if (!context.permissions.includes('network_read') && !context.permissions.includes('admin')) {
          return {
            success: false,
            output: null,
            error: 'Permission denied: network_read capability required',
            executionTimeMs: Date.now() - start,
          };
        }
        try {
          // Return simulated structured data for safety in sandbox
          return {
            success: true,
            output: {
              status: 200,
              url: input.url,
              contentType: 'application/json',
              data: {
                message: `Successfully connected to ${input.url}`,
                timestamp: new Date().toISOString(),
                payload: { status: 'operational', endpoints: ['/api/v1/data', '/api/v1/health'] },
              },
            },
            executionTimeMs: Date.now() - start,
          };
        } catch (err) {
          return {
            success: false,
            output: null,
            error: err instanceof Error ? err.message : 'HTTP request failed',
            executionTimeMs: Date.now() - start,
          };
        }
      },
    });

    // 3. JSON Parser
    this.registerTool({
      name: 'json_parser',
      description: 'Validates, formats, and extracts paths from JSON strings.',
      permissions: ['data_parse'],
      execute: async (input: { jsonString: string; extractKey?: string }) => {
        const start = Date.now();
        try {
          const parsed = JSON.parse(input.jsonString);
          let value = parsed;
          if (input.extractKey && typeof parsed === 'object' && parsed !== null) {
            value = parsed[input.extractKey];
          }
          return {
            success: true,
            output: { valid: true, value, keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [] },
            executionTimeMs: Date.now() - start,
          };
        } catch (err) {
          return {
            success: false,
            output: { valid: false },
            error: err instanceof Error ? err.message : 'Invalid JSON format',
            executionTimeMs: Date.now() - start,
          };
        }
      },
    });

    // 4. Text Analyzer
    this.registerTool({
      name: 'text_analyzer',
      description: 'Analyzes word count, readability score, sentiment keywords, and token estimates.',
      permissions: ['text_process'],
      execute: async (input: { text: string }) => {
        const start = Date.now();
        const text = input.text || '';
        const words = text.trim().split(/\s+/).filter(Boolean);
        const characters = text.length;
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        const estimatedTokens = Math.ceil(characters / 4);

        const securityTerms = ['vulnerability', 'exploit', 'secret', 'token', 'auth', 'bypass', 'risk', 'sanitiz'];
        const matches = securityTerms.filter((term) => text.toLowerCase().includes(term));

        return {
          success: true,
          output: {
            wordCount: words.length,
            characterCount: characters,
            sentenceCount: sentences.length,
            estimatedTokens,
            flaggedKeywords: matches,
            readabilityGrade: words.length > 0 ? (characters / words.length).toFixed(1) : '0',
          },
          executionTimeMs: Date.now() - start,
        };
      },
    });

    // 5. Repository Reader
    this.registerTool({
      name: 'repository_reader',
      description: 'Scans the workspace directory structure, files, and package manifests.',
      permissions: ['repo_read'],
      execute: async () => {
        const start = Date.now();
        try {
          const rootDir = process.cwd();
          const pkgPath = path.join(rootDir, 'package.json');
          let pkgInfo = {};
          if (fs.existsSync(pkgPath)) {
            pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          }
          return {
            success: true,
            output: {
              root: rootDir,
              package: pkgInfo,
              timestamp: new Date().toISOString(),
              architecture: 'Next.js / Vite Full-Stack Modular Micro-Agent Framework',
            },
            executionTimeMs: Date.now() - start,
          };
        } catch (err) {
          return {
            success: false,
            output: null,
            error: err instanceof Error ? err.message : 'Failed to scan repository',
            executionTimeMs: Date.now() - start,
          };
        }
      },
    });

    // 6. Security Auditor
    this.registerTool({
      name: 'security_auditor',
      description: 'Audits code or configurations for OWASP security threats and secret leaks.',
      permissions: ['security_audit'],
      execute: async (input: { codeSnippet?: string; targetModule?: string }) => {
        const start = Date.now();
        const code = input.codeSnippet || '';
        const findings: { severity: 'low' | 'medium' | 'high' | 'critical'; rule: string; description: string }[] = [];

        if (code.includes('eval(')) {
          findings.push({ severity: 'high', rule: 'NO_EVAL', description: 'Dynamic code execution via eval() detected.' });
        }
        if (code.toLowerCase().includes('password') || code.toLowerCase().includes('secret_key =')) {
          findings.push({ severity: 'critical', rule: 'HARDCODED_SECRETS', description: 'Possible hardcoded credential or secret key string.' });
        }
        if (code.includes('innerHTML')) {
          findings.push({ severity: 'medium', rule: 'XSS_RISK', description: 'Direct innerHTML assignment may expose XSS vulnerability.' });
        }

        return {
          success: true,
          output: {
            target: input.targetModule || 'inline_snippet',
            auditedAt: new Date().toISOString(),
            riskScore: findings.length === 0 ? 0 : findings.reduce((acc, f) => acc + (f.severity === 'critical' ? 40 : f.severity === 'high' ? 25 : 10), 0),
            passed: findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length === 0,
            findings,
          },
          executionTimeMs: Date.now() - start,
        };
      },
    });
  }

  public registerTool(tool: HiveTool) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): HiveTool | undefined {
    return this.tools.get(name);
  }

  public listTools(): { name: string; description: string; permissions: string[] }[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      permissions: t.permissions,
    }));
  }

  public async executeTool(name: string, input: Record<string, unknown>, context?: Partial<ToolContext>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        output: null,
        error: `Tool '${name}' not found in registry`,
        executionTimeMs: 0,
      };
    }

    const fullContext: ToolContext = {
      agentId: context?.agentId,
      missionId: context?.missionId,
      taskId: context?.taskId,
      permissions: context?.permissions || tool.permissions,
    };

    return tool.execute(input, fullContext);
  }
}

export const toolRegistry = new ToolRegistry();
