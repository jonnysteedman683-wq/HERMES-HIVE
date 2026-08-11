import { CapabilityDescriptor } from '../../shared/types';

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityDescriptor> = new Map();

  constructor() {
    this.initializeDefaultCapabilities();
  }

  private initializeDefaultCapabilities(): void {
    // 1. Web Search Capability
    this.registerCapability({
      id: 'web.search',
      name: 'Global Web & Index Search',
      version: '1.0.0',
      category: 'web_search',
      description: 'Executes indexed internet queries and extracts live search knowledge.',
      provider: 'hermes-web-search-connector',
      operations: ['search', 'fetch_page'],
      inputSchema: {
        query: { type: 'string', required: true },
        maxResults: { type: 'number', default: 5 },
      },
      outputSchema: {
        results: { type: 'array', items: { type: 'object' } },
        totalFound: { type: 'number' },
      },
      permissions: ['web_read', 'network_access'],
      riskLevel: 'LOW',
      authenticationRequirements: ['service:hermes-hive'],
      availability: 'online',
      health: 'operational',
      rateLimits: {
        maxRequestsPerMin: 60,
        currentMinUsage: 4,
      },
      supportsSimulation: true,
      supportsCancellation: true,
      supportsVerification: true,
    });

    // 2. HTTP API Request Capability
    this.registerCapability({
      id: 'web.http_request',
      name: 'Universal HTTP & REST Connector',
      version: '1.1.0',
      category: 'http_api',
      description: 'Executes HTTP GET, POST, PUT, DELETE calls to external REST APIs with header/payload handling.',
      provider: 'hermes-web-http-connector',
      operations: ['get', 'post', 'put', 'delete'],
      inputSchema: {
        url: { type: 'string', required: true },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
        headers: { type: 'object' },
        body: { type: 'object' },
      },
      outputSchema: {
        statusCode: { type: 'number' },
        headers: { type: 'object' },
        data: { type: 'object' },
      },
      permissions: ['network_read', 'network_write'],
      riskLevel: 'MEDIUM',
      authenticationRequirements: ['service:hermes-hive', 'agent_identity'],
      availability: 'online',
      health: 'operational',
      rateLimits: {
        maxRequestsPerMin: 120,
        currentMinUsage: 12,
      },
      supportsSimulation: true,
      supportsCancellation: true,
      supportsVerification: true,
    });

    // 3. Repository Read Capability
    this.registerCapability({
      id: 'web.repository_read',
      name: 'Source Code & Repo Inspector',
      version: '1.0.0',
      category: 'repository',
      description: 'Inspects code repositories, reads files, inspects Git histories, and analyzes file structures.',
      provider: 'hermes-web-git-connector',
      operations: ['read_file', 'list_dir', 'search_code', 'git_log'],
      inputSchema: {
        repoPath: { type: 'string', required: true },
        filePath: { type: 'string' },
      },
      outputSchema: {
        content: { type: 'string' },
        stats: { type: 'object' },
      },
      permissions: ['repo_read'],
      riskLevel: 'LOW',
      authenticationRequirements: ['service:hermes-hive'],
      availability: 'online',
      health: 'operational',
      rateLimits: {
        maxRequestsPerMin: 300,
        currentMinUsage: 18,
      },
      supportsSimulation: true,
      supportsCancellation: false,
      supportsVerification: true,
    });

    // 4. Repository Write Capability (Requires High Risk Approval)
    this.registerCapability({
      id: 'web.repository_write',
      name: 'Source Code & Repo File Modification',
      version: '1.0.0',
      category: 'repository',
      description: 'Applies file changes, creates branches, commits edits, and manages PR patches.',
      provider: 'hermes-web-git-connector',
      operations: ['write_file', 'create_branch', 'commit_changes'],
      inputSchema: {
        filePath: { type: 'string', required: true },
        content: { type: 'string', required: true },
        commitMessage: { type: 'string' },
      },
      outputSchema: {
        success: { type: 'boolean' },
        commitHash: { type: 'string' },
      },
      permissions: ['repo_write', 'code_mutation'],
      riskLevel: 'HIGH',
      authenticationRequirements: ['service:hermes-hive', 'agent_identity', 'policy_approval'],
      availability: 'online',
      health: 'operational',
      rateLimits: {
        maxRequestsPerMin: 30,
        currentMinUsage: 2,
      },
      supportsSimulation: true,
      supportsCancellation: true,
      supportsVerification: true,
    });

    // 5. Database Query Capability
    this.registerCapability({
      id: 'web.database_query',
      name: 'Structured Database Query Engine',
      version: '1.2.0',
      category: 'database',
      description: 'Executes read and write queries against connected database instances.',
      provider: 'hermes-web-sql-connector',
      operations: ['query', 'schema_inspect'],
      inputSchema: {
        query: { type: 'string', required: true },
        params: { type: 'array' },
      },
      outputSchema: {
        rows: { type: 'array' },
        rowCount: { type: 'number' },
      },
      permissions: ['database_access'],
      riskLevel: 'MEDIUM',
      authenticationRequirements: ['service:hermes-hive', 'agent_identity'],
      availability: 'online',
      health: 'operational',
      rateLimits: {
        maxRequestsPerMin: 200,
        currentMinUsage: 8,
      },
      supportsSimulation: true,
      supportsCancellation: true,
      supportsVerification: true,
    });

    // 6. SaaS API Integration Connector
    this.registerCapability({
      id: 'web.saas_connector',
      name: 'External SaaS Service Adapter',
      version: '1.0.0',
      category: 'saas_integration',
      description: 'Interacts with external SaaS platforms (Slack, GitHub, Jira, Workspace, Cloud services).',
      provider: 'hermes-web-saas-adapter',
      operations: ['post_notification', 'sync_issue', 'trigger_webhook'],
      inputSchema: {
        serviceName: { type: 'string', required: true },
        action: { type: 'string', required: true },
        payload: { type: 'object' },
      },
      outputSchema: {
        response: { type: 'object' },
      },
      permissions: ['saas_write'],
      riskLevel: 'MEDIUM',
      authenticationRequirements: ['service:hermes-hive', 'agent_identity'],
      availability: 'online',
      health: 'operational',
      rateLimits: {
        maxRequestsPerMin: 60,
        currentMinUsage: 5,
      },
      supportsSimulation: true,
      supportsCancellation: true,
      supportsVerification: true,
    });

    // 7. System Command Execution Capability (CRITICAL Risk)
    this.registerCapability({
      id: 'web.system_command',
      name: 'Sandboxed System Command Executor',
      version: '1.0.0',
      category: 'system_command',
      description: 'Executes sandboxed system commands in isolated environments.',
      provider: 'hermes-web-sandbox-executor',
      operations: ['exec'],
      inputSchema: {
        command: { type: 'string', required: true },
        cwd: { type: 'string' },
      },
      outputSchema: {
        exitCode: { type: 'number' },
        stdout: { type: 'string' },
        stderr: { type: 'string' },
      },
      permissions: ['system_exec', 'root_policy'],
      riskLevel: 'CRITICAL',
      authenticationRequirements: ['service:hermes-hive', 'agent_identity', 'human_approval'],
      availability: 'online',
      health: 'operational',
      rateLimits: {
        maxRequestsPerMin: 15,
        currentMinUsage: 1,
      },
      supportsSimulation: true,
      supportsCancellation: true,
      supportsVerification: true,
    });
  }

  public registerCapability(capability: CapabilityDescriptor): void {
    this.capabilities.set(capability.id, capability);
  }

  public getCapability(id: string): CapabilityDescriptor | undefined {
    return this.capabilities.get(id);
  }

  public getAllCapabilities(filter?: {
    category?: string;
    riskLevel?: string;
    availability?: string;
  }): CapabilityDescriptor[] {
    let list = Array.from(this.capabilities.values());
    if (filter) {
      if (filter.category) {
        list = list.filter((c) => c.category === filter.category);
      }
      if (filter.riskLevel) {
        list = list.filter((c) => c.riskLevel === filter.riskLevel);
      }
      if (filter.availability) {
        list = list.filter((c) => c.availability === filter.availability);
      }
    }
    return list;
  }

  public updateCapabilityHealth(id: string, status: CapabilityDescriptor['health']): void {
    const cap = this.capabilities.get(id);
    if (cap) {
      cap.health = status;
      cap.availability = status === 'offline' ? 'offline' : status === 'degraded' ? 'degraded' : 'online';
    }
  }
}

export const capabilityRegistry = new CapabilityRegistry();
