import { Agent, AgentRole, AgentTemplate, CapabilityDefinition, Mission } from '../../shared/types';
import { messageBus } from '../bus/messageBus';
import { agentLifecycleManager } from './agentLifecycle';
import { agentReputationEngine } from './agentReputation';

export interface SpawnSpecialistOptions {
  customName?: string;
  extraCapabilities?: string[];
  extraTools?: string[];
  customPermissions?: string[];
  missionId?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityDefinition> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    const defaults: CapabilityDefinition[] = [
      {
        id: 'cap-pqc',
        name: 'Post-Quantum Cryptography',
        description: 'Kyber, Dilithium, and post-quantum algorithm migration analysis.',
        category: 'security',
        requiredTools: ['security_auditor', 'repo_reader'],
        riskLevel: 'HIGH',
        defaultPermissions: ['read_code', 'audit_crypto'],
      },
      {
        id: 'cap-fuzzing',
        name: 'Automated Fuzzing & Static Analysis',
        description: 'Static application security testing and dynamic edge case detection.',
        category: 'security',
        requiredTools: ['security_auditor', 'json_parser'],
        riskLevel: 'MEDIUM',
        defaultPermissions: ['read_code', 'run_static_analysis'],
      },
      {
        id: 'cap-perf',
        name: 'High-Throughput Optimization',
        description: 'Memory leak profiling and async event loop optimization.',
        category: 'engineering',
        requiredTools: ['calculator', 'text_analyzer'],
        riskLevel: 'LOW',
        defaultPermissions: ['read_code'],
      },
      {
        id: 'cap-formal-verification',
        name: 'Formal Verification & Invariants',
        description: 'Mathematical safety invariant verification and model checking.',
        category: 'verification',
        requiredTools: ['json_parser', 'text_analyzer'],
        riskLevel: 'LOW',
        defaultPermissions: ['verify_state'],
      },
      {
        id: 'cap-compliance',
        name: 'Regulatory & Policy Compliance',
        description: 'NIST, ISO 27001, and SOC2 policy verification.',
        category: 'governance',
        requiredTools: ['text_analyzer'],
        riskLevel: 'LOW',
        defaultPermissions: ['audit_policy'],
      },
    ];

    defaults.forEach((c) => this.capabilities.set(c.id, c));
  }

  public registerCapability(capability: CapabilityDefinition): void {
    this.capabilities.set(capability.id, capability);
    messageBus.publish('CAPABILITY_REGISTERED', 'CapabilityRegistry', { capability }, {
      severity: 'info',
    });
  }

  public getCapability(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  public getAllCapabilities(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }
}

export class AgentTemplateRegistry {
  private templates: Map<string, AgentTemplate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates() {
    const defaultTemplates: AgentTemplate[] = [
      {
        id: 'tpl-pqc-specialist',
        name: 'Post-Quantum Crypto Specialist',
        role: 'SecurityAgent',
        description: 'Specialist in NIST PQC algorithm migration and lattice-based cryptography.',
        clusterId: 'Cluster B — Engineering & Security',
        capabilities: ['Post-Quantum Cryptography', 'security_audit', 'code_inspection'],
        assignedTools: ['security_auditor', 'repo_reader', 'text_analyzer'],
        defaultPermissions: ['read_code', 'audit_crypto'],
        riskLevel: 'HIGH',
        systemPrompt: 'You are an elite Post-Quantum Cryptography Security Specialist.',
      },
      {
        id: 'tpl-fuzzing-engineer',
        name: 'Static Analysis & Fuzzing Specialist',
        role: 'Developer',
        description: 'Expert in dynamic boundary testing and vulnerability remediation.',
        clusterId: 'Cluster B — Engineering & Security',
        capabilities: ['Automated Fuzzing & Static Analysis', 'code_generation', 'code_inspection'],
        assignedTools: ['security_auditor', 'json_parser', 'text_analyzer'],
        defaultPermissions: ['read_code', 'run_static_analysis'],
        riskLevel: 'MEDIUM',
        systemPrompt: 'You are an expert Static Analysis & Security Fuzzing Engineer.',
      },
      {
        id: 'tpl-perf-architect',
        name: 'Performance & Optimization Specialist',
        role: 'Developer',
        description: 'Architect specializing in microsecond event loops and memory profiling.',
        clusterId: 'Cluster B — Engineering & Security',
        capabilities: ['High-Throughput Optimization', 'architectural_analysis', 'code_generation'],
        assignedTools: ['calculator', 'text_analyzer', 'repo_reader'],
        defaultPermissions: ['read_code', 'profile_performance'],
        riskLevel: 'LOW',
        systemPrompt: 'You are a Systems Performance Architect.',
      },
      {
        id: 'tpl-formal-verifier',
        name: 'Formal Logic & Verification Specialist',
        role: 'Critic',
        description: 'Independent critic trained in state machine invariant verification.',
        clusterId: 'Cluster C — Verification & Healing',
        capabilities: ['Formal Verification & Invariants', 'verification', 'code_review'],
        assignedTools: ['json_parser', 'text_analyzer'],
        defaultPermissions: ['verify_state'],
        riskLevel: 'LOW',
        systemPrompt: 'You are a Formal Logic Verification Critic.',
      },
    ];

    defaultTemplates.forEach((t) => this.templates.set(t.id, t));
  }

  public registerTemplate(template: AgentTemplate): void {
    this.templates.set(template.id, template);
  }

  public getTemplate(id: string): AgentTemplate | undefined {
    return this.templates.get(id);
  }

  public getAllTemplates(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }
}

export class AgentFactory {
  public capabilityRegistry = new CapabilityRegistry();
  public templateRegistry = new AgentTemplateRegistry();

  /**
   * Analyze mission requirements against active swarm to detect missing capabilities
   */
  public analyzeCapabilityGaps(
    mission: Mission,
    activeAgents: Agent[]
  ): {
    missingCapabilities: string[];
    recommendedTemplates: AgentTemplate[];
  } {
    const requiredCapabilities = new Set<string>();

    mission.tasks.forEach((t) => {
      (t.requiredCapabilities || []).forEach((cap) => requiredCapabilities.add(cap));
    });

    const activeCapabilities = new Set<string>();
    activeAgents.forEach((a) => {
      a.capabilities.forEach((cap) => activeCapabilities.add(cap));
    });

    const missingCapabilities: string[] = [];
    requiredCapabilities.forEach((cap) => {
      if (!activeCapabilities.has(cap)) {
        missingCapabilities.push(cap);
      }
    });

    const recommendedTemplates: AgentTemplate[] = [];
    if (missingCapabilities.length > 0) {
      const templates = this.templateRegistry.getAllTemplates();
      templates.forEach((tpl) => {
        const matches = tpl.capabilities.some((c) => missingCapabilities.includes(c));
        if (matches) {
          recommendedTemplates.push(tpl);
        }
      });
    }

    return { missingCapabilities, recommendedTemplates };
  }

  /**
   * Spawn a new dynamic specialist agent instance with strictly bounded permissions
   */
  public spawnSpecialistAgent(
    templateId: string,
    options: SpawnSpecialistOptions = {}
  ): Agent {
    const template = this.templateRegistry.getTemplate(templateId);
    if (!template) {
      throw new Error(`AgentTemplate '${templateId}' not found in registry.`);
    }

    const id = `agent-spec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const capabilities = Array.from(
      new Set([...template.capabilities, ...(options.extraCapabilities || [])])
    );
    const permissions = Array.from(
      new Set([...template.defaultPermissions, ...(options.customPermissions || [])])
    );

    const agent: Agent = {
      id,
      name: options.customName || `${template.name} (${id.slice(-4)})`,
      role: template.role,
      capabilities,
      status: 'idle',
      lifecycleState: 'CREATED',
      health: 'healthy',
      currentMissionId: options.missionId,
      lastHeartbeat: now,
      createdAt: now,
      reputation: agentReputationEngine.getDefaultReputation(),
      resourceUsage: {
        cpuPct: 1,
        memoryMb: 128,
        tokensUsed: 0,
        apiCallsCount: 0,
      },
      clusterId: template.clusterId,
      systemPrompt: template.systemPrompt,
      riskLevel: options.riskLevel || template.riskLevel,
      permissions,
    };

    // Register in lifecycle manager
    agentLifecycleManager.registerAgent(agent, 'AVAILABLE');

    messageBus.publish('AGENT_CREATED', 'AgentFactory', {
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      templateId,
      clusterId: agent.clusterId,
      capabilities: agent.capabilities,
      riskLevel: agent.riskLevel,
      permissions: agent.permissions,
    }, {
      agentId: agent.id,
      missionId: options.missionId,
      severity: 'info',
    });

    return agent;
  }
}

export const agentFactory = new AgentFactory();
