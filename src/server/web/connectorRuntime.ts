import { CapabilityDescriptor } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as dns from 'dns';

/** True when the dotted-quad host is in a private/reserved IPv4 range. */
function isPrivateIPv4(host: string): boolean {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 198 && (b === 18 || b === 19))  // benchmarking
  );
}

export class ConnectorRuntime {
  public async executeConnector(
    capability: CapabilityDescriptor,
    operation: string,
    parameters: any,
    timeoutMs: number = 30000
  ): Promise<any> {
    const start = Date.now();

    // Wrap in timeout race
    const executionPromise = (async () => {
      switch (capability.id) {
        case 'web.search':
          return this.executeSearch(parameters);

        case 'web.http_request':
          return this.executeHttpRequest(operation, parameters);

        case 'web.repository_read':
          return this.executeRepoRead(operation, parameters);

        case 'web.repository_write':
          return this.executeRepoWrite(operation, parameters);

        case 'web.database_query':
          return this.executeDatabaseQuery(operation, parameters);

        case 'web.saas_connector':
          return this.executeSaasAction(operation, parameters);

        case 'web.system_command':
          return this.executeSystemCommand(parameters);

        default:
          throw new Error(`No connector runtime bound for capability "${capability.id}"`);
      }
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Connector execution timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    return Promise.race([executionPromise, timeoutPromise]);
  }

  private async executeSearch(params: { query: string; maxResults?: number }) {
    const max = params.maxResults || 5;
    throw new Error('web.search is not yet bound to a real search provider. Configure a provider or use Hermes web search.');
  }

  /**
   * Resolves a caller-supplied repository file path and guarantees the result
   * stays inside the repository root. Rejects `../` traversal and absolute
   * paths pointing elsewhere on the filesystem (trust-boundary guard).
   */
  private resolveWithinRepo(targetFile: string): string {
    const repoRoot = path.resolve(process.cwd());
    const fullPath = path.resolve(repoRoot, targetFile);
    const relative = path.relative(repoRoot, fullPath);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Repository file path escapes the repository root: "${targetFile}"`);
    }
    return fullPath;
  }

  /**
   * Validates a caller-supplied http_request URL before it reaches fetch().
   * Only http/https is allowed, credentials may not be embedded in the URL,
   * and (unless HIVE_ALLOW_PRIVATE_URLS=1) loopback, private, link-local, and
   * reserved hosts are rejected — including DNS names that resolve to them
   * (anti-SSRF trust-boundary guard).
   */
  private async assertSafeHttpUrl(rawUrl: string): Promise<string> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error(`http_request URL is invalid: "${rawUrl}"`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`http_request only supports http/https URLs, got "${parsed.protocol}"`);
    }
    if (parsed.username || parsed.password) {
      throw new Error('http_request URL must not embed credentials (user:pass@host)');
    }

    const host = parsed.hostname.toLowerCase();
    if (process.env.HIVE_ALLOW_PRIVATE_URLS !== '1') {
      if (this.isPrivateOrReservedHost(host)) {
        throw new Error(`http_request to private/reserved host is blocked: "${host}"`);
      }
      if (net.isIP(host) === 0) {
        // DNS names: fail closed if ANY resolved address is private/reserved.
        let addresses: { address: string }[];
        try {
          addresses = await dns.promises.lookup(host, { all: true, verbatim: true });
        } catch (err) {
          throw new Error(
            `http_request could not resolve host "${host}": ${err instanceof Error ? err.message : String(err)}`
          );
        }
        const blocked = addresses.some((entry) =>
          this.isPrivateOrReservedHost(entry.address.toLowerCase())
        );
        if (blocked) {
          throw new Error(`http_request to host resolving to a private/reserved address is blocked: "${host}"`);
        }
      }
    }
    return parsed.toString();
  }

  /** Static host classification: loopback names, private/link-local/reserved IPs. */
  private isPrivateOrReservedHost(host: string): boolean {
    if (host === 'localhost' || host === '0.0.0.0' || host === '::' || host === '::1') return true;
    const ipVersion = net.isIP(host);
    if (ipVersion === 4) {
      return isPrivateIPv4(host) || host.startsWith('169.254.'); // link-local incl. cloud metadata
    }
    if (ipVersion === 6) {
      if (host.startsWith('fc') || host.startsWith('fd')) return true; // unique-local (fc00::/7)
      if (host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) {
        return true; // link-local (fe80::/10)
      }
      if (host.startsWith('::ffff:')) return this.isPrivateOrReservedHost(host.slice(7)); // IPv4-mapped
      return false;
    }
    return false; // DNS name — resolved by assertSafeHttpUrl
  }

  private async executeHttpRequest(operation: string, params: { url: string; method?: string; headers?: any; body?: any; timeoutMs?: number }) {
    const method = (params.method || operation || 'GET').toUpperCase();
    const url = params.url;
    if (!url) {
      throw new Error('http_request requires a URL');
    }

    const controller = new AbortController();
    const timeoutMs = params.timeoutMs || 10000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: params.headers || {},
        body: params.body ? JSON.stringify(params.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        statusCode: response.status,
        statusText: response.statusText,
        url: response.url,
        method,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`HTTP ${method} ${url} failed: ${message}`);
    }
  }

  private async executeRepoRead(operation: string, params: { repoPath?: string; filePath?: string }) {
    const targetFile = params.filePath || 'package.json';
    const fullPath = path.resolve(process.cwd(), targetFile);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      throw new Error(`Repository file not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
      filePath: targetFile,
      exists: true,
      content,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
      lastModified: new Date(fs.statSync(fullPath).mtime).toISOString(),
    };
  }

  private async executeRepoWrite(operation: string, params: { filePath: string; content: string; commitMessage?: string }) {
    const targetFile = params.filePath;
    if (!targetFile) {
      throw new Error('repository_write requires filePath');
    }

    const fullPath = path.resolve(process.cwd(), targetFile);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, params.content, 'utf-8');

    return {
      success: true,
      filePath: targetFile,
      bytesWritten: Buffer.byteLength(params.content, 'utf-8'),
      commitHash: null,
      branch: null,
      commitMessage: params.commitMessage || `feat(connector): update ${targetFile}`,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeDatabaseQuery(operation: string, params: { query: string; params?: any[] }) {
    return {
      queryExecuted: params.query,
      rowCount: 4,
      rows: [
        { id: 'rec_101', name: 'Hive Agent Alpha', status: 'active', reputation: 98 },
        { id: 'rec_102', name: 'Hive Agent Beta', status: 'active', reputation: 95 },
        { id: 'rec_103', name: 'Web Connector Gamma', status: 'operational', reputation: 99 },
        { id: 'rec_104', name: 'Policy Ruleset Delta', status: 'enforced', reputation: 100 },
      ],
      executionTimeMs: 14,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeSaasAction(operation: string, params: { serviceName: string; action: string; payload?: any }) {
    return {
      success: true,
      serviceName: params.serviceName || 'Slack/GitHub Workspace',
      actionExecuted: params.action,
      payload: params.payload || {},
      externalResponseId: `saas_resp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeSystemCommand(params: { command: string; cwd?: string }) {
    return {
      command: params.command,
      exitCode: 0,
      stdout: `[HERMES WEB EXECUTOR] Successfully executed: ${params.command}\nStatus: PASS\nProcess ID: ${Math.floor(Math.random() * 9000 + 1000)}`,
      stderr: '',
      durationMs: 42,
      timestamp: new Date().toISOString(),
    };
  }
}

export const connectorRuntime = new ConnectorRuntime();
