import { TaskBid, ResourceAllocationRecord } from '../../shared/types';

export class SwarmEconomicsEngine {
  private bids: Map<string, TaskBid> = new Map();
  private allocations: Map<string, ResourceAllocationRecord> = new Map();

  constructor() {
    this.seedEconomics();
  }

  private seedEconomics(): void {
    const b1: TaskBid = {
      bidId: 'bid-001',
      taskId: 'task-opt-rpc-01',
      agentId: 'agent-perf-analyst',
      agentName: 'Performance Profiler Alpha',
      capabilityMatchScore: 0.95,
      estimatedTokenCost: 12000,
      expectedSuccessRate: 0.96,
      currentWorkload: 0.35,
      bidScore: 92.5,
      submittedAt: new Date(Date.now() - 1800000).toISOString(),
    };

    const b2: TaskBid = {
      bidId: 'bid-002',
      taskId: 'task-opt-rpc-01',
      agentId: 'agent-db-sentinel',
      agentName: 'Database Sentinel Beta',
      capabilityMatchScore: 0.88,
      estimatedTokenCost: 15000,
      expectedSuccessRate: 0.92,
      currentWorkload: 0.60,
      bidScore: 81.0,
      submittedAt: new Date(Date.now() - 1800000).toISOString(),
    };

    this.bids.set(b1.bidId, b1);
    this.bids.set(b2.bidId, b2);

    const r1: ResourceAllocationRecord = {
      allocationId: 'alloc-001',
      hiveId: 'hive-hermes-prime',
      teamId: 'team-opt-alpha',
      tokensAllocated: 100000,
      tokensUsed: 42000,
      priorityScore: 95,
      starvationRisk: false,
      status: 'ACTIVE',
      allocatedAt: new Date(Date.now() - 3600000).toISOString(),
    };

    const r2: ResourceAllocationRecord = {
      allocationId: 'alloc-002',
      hiveId: 'hive-research-alpha',
      tokensAllocated: 120000,
      tokensUsed: 89000,
      priorityScore: 98,
      starvationRisk: false,
      status: 'ACTIVE',
      allocatedAt: new Date(Date.now() - 3600000).toISOString(),
    };

    this.allocations.set(r1.allocationId, r1);
    this.allocations.set(r2.allocationId, r2);
  }

  public getAllBids(): TaskBid[] {
    return Array.from(this.bids.values());
  }

  public getAllAllocations(): ResourceAllocationRecord[] {
    return Array.from(this.allocations.values());
  }

  public submitBid(
    taskId: string,
    agentId: string,
    agentName: string,
    capabilityMatchScore: number,
    estimatedTokenCost: number,
    expectedSuccessRate: number,
    currentWorkload: number
  ): TaskBid {
    const bidId = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Compute bid score
    const score = Math.round(
      capabilityMatchScore * 40 +
      expectedSuccessRate * 40 +
      (1 - currentWorkload) * 20
    );

    const bid: TaskBid = {
      bidId,
      taskId,
      agentId,
      agentName,
      capabilityMatchScore,
      estimatedTokenCost,
      expectedSuccessRate,
      currentWorkload,
      bidScore: score,
      submittedAt: new Date().toISOString(),
    };

    this.bids.set(bidId, bid);
    return bid;
  }
}

export const swarmEconomicsEngine = new SwarmEconomicsEngine();
