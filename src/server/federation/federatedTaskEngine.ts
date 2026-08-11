import { FederatedTask, FederatedTaskBid, RiskLevel } from '../../shared/types';
import { federatedTaskRepository, hiveRepository, federationEventRepository } from './federationRepositories';

export class FederatedTaskEngine {
  /**
   * Publishes a cross-Hive task to the multi-Hive task market
   */
  public publishTask(
    originatorHiveId: string,
    objective: string,
    requiredCapabilities: string[],
    constraints: string[],
    tokenBudget: number,
    compensationTokens: number,
    riskClassification: RiskLevel = 'MEDIUM',
    deadlineSec = 3600
  ): FederatedTask {
    const taskId = `fedtask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const deadline = new Date(Date.now() + deadlineSec * 1000).toISOString();

    const task: FederatedTask = {
      taskId,
      originatorHiveId,
      objective,
      requiredCapabilities,
      constraints,
      priority: 3,
      deadline,
      tokenBudget,
      compensationTokens,
      riskClassification,
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };

    federatedTaskRepository.saveTask(task);

    federationEventRepository.logEvent({
      eventId: `evt-taskpub-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: originatorHiveId,
      eventType: 'FEDERATED_TASK_PUBLISHED',
      details: { taskId, objective, tokenBudget },
      governanceResult: 'ALLOWED',
      traceId: `trace-task-${taskId}`,
    });

    return task;
  }

  /**
   * Submits a cross-Hive task bid
   */
  public submitBid(
    taskId: string,
    biddingHiveId: string,
    biddingHiveName: string,
    capabilitiesMatched: string[],
    estimatedCompletionTimeSec: number,
    confidence: number,
    bidPriceTokens: number
  ): FederatedTaskBid {
    const task = federatedTaskRepository.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const hive = hiveRepository.getHive(biddingHiveId);
    const reputationScore = hive ? hive.reputationScore : 80;

    // Multi-Hive Bid Scoring Formula
    const capMatchPct = capabilitiesMatched.length / Math.max(1, task.requiredCapabilities.length);
    const priceRatio = Math.min(1.0, task.compensationTokens / Math.max(1, bidPriceTokens));
    const bidScore = Math.round(
      capMatchPct * 40 + priceRatio * 30 + confidence * 15 + (reputationScore / 100) * 15
    );

    const bid: FederatedTaskBid = {
      bidId: `bid-${biddingHiveId}-${Date.now()}`,
      taskId,
      biddingHiveId,
      biddingHiveName,
      capabilitiesMatched,
      estimatedCompletionTimeSec,
      confidence,
      bidPriceTokens,
      reputationScore,
      bidScore,
      submittedAt: new Date().toISOString(),
    };

    task.status = 'BIDDING';
    federatedTaskRepository.saveTask(task);

    federationEventRepository.logEvent({
      eventId: `evt-bid-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: biddingHiveId,
      destinationHiveId: task.originatorHiveId,
      eventType: 'FEDERATED_TASK_BID_SUBMITTED',
      details: { taskId, bidId: bid.bidId, bidScore },
      governanceResult: 'ALLOWED',
      traceId: `trace-bid-${bid.bidId}`,
    });

    return bid;
  }

  /**
   * Assigns task to highest-scoring bid
   */
  public assignTask(taskId: string, winningBid: FederatedTaskBid): FederatedTask {
    const task = federatedTaskRepository.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.assignedHiveId = winningBid.biddingHiveId;
    task.status = 'ASSIGNED';
    federatedTaskRepository.saveTask(task);

    federationEventRepository.logEvent({
      eventId: `evt-assign-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: task.originatorHiveId,
      destinationHiveId: winningBid.biddingHiveId,
      eventType: 'FEDERATED_TASK_ASSIGNED',
      details: { taskId, assignedHiveId: winningBid.biddingHiveId },
      governanceResult: 'ALLOWED',
      traceId: `trace-assign-${taskId}`,
    });

    return task;
  }

  /**
   * Settles contract & updates economic allocation
   */
  public settleTask(taskId: string, success: boolean, resultData: string): FederatedTask {
    const task = federatedTaskRepository.getTask(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = success ? 'SETTLED' : 'FAILED';
    federatedTaskRepository.saveTask(task);

    federationEventRepository.logEvent({
      eventId: `evt-settle-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: task.assignedHiveId || 'unknown',
      destinationHiveId: task.originatorHiveId,
      eventType: 'FEDERATED_TASK_SETTLED',
      details: { taskId, success, resultData },
      governanceResult: 'ALLOWED',
      traceId: `trace-settle-${taskId}`,
    });

    return task;
  }

  public getTask(taskId: string): FederatedTask | undefined {
    return federatedTaskRepository.getTask(taskId);
  }

  public getAllTasks(): FederatedTask[] {
    return federatedTaskRepository.getAllTasks();
  }
}

export const federatedTaskEngine = new FederatedTaskEngine();
