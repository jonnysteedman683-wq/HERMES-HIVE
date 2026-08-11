import { ResourceBudget } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export class ResourceManager {
  private budgets: Map<string, ResourceBudget> = new Map();

  /**
   * Allocate or update budget for an entity
   */
  public allocateBudget(
    entityType: ResourceBudget['entityType'],
    entityId: string,
    maxTokens: number = 100000,
    maxApiCalls: number = 50
  ): ResourceBudget {
    const key = `${entityType}:${entityId}`;
    const budget: ResourceBudget = {
      id: `bud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      entityType,
      entityId,
      maxTokens,
      consumedTokens: this.budgets.get(key)?.consumedTokens || 0,
      maxApiCalls,
      consumedApiCalls: this.budgets.get(key)?.consumedApiCalls || 0,
      updatedAt: new Date().toISOString(),
    };

    this.budgets.set(key, budget);

    messageBus.publish('RESOURCE_BUDGET_UPDATED', 'ResourceManager', {
      budget,
    }, { severity: 'info' });

    return budget;
  }

  /**
   * Check whether requested resource units are available under budget
   */
  public checkBudgetAvailable(
    entityType: ResourceBudget['entityType'],
    entityId: string,
    requestedTokens: number = 0,
    requestedApiCalls: number = 0
  ): boolean {
    const key = `${entityType}:${entityId}`;
    const budget = this.budgets.get(key);
    if (!budget) return true; // Default unconstrained if unbudgeted

    const tokenOk = budget.consumedTokens + requestedTokens <= budget.maxTokens;
    const apiOk = budget.consumedApiCalls + requestedApiCalls <= budget.maxApiCalls;
    return tokenOk && apiOk;
  }

  /**
   * Consume resources and trigger alerts if budget exhausted
   */
  public consumeResources(
    entityType: ResourceBudget['entityType'],
    entityId: string,
    tokens: number,
    apiCalls: number = 1
  ): ResourceBudget | undefined {
    const key = `${entityType}:${entityId}`;
    let budget = this.budgets.get(key);

    if (!budget) {
      budget = this.allocateBudget(entityType, entityId);
    }

    budget.consumedTokens += tokens;
    budget.consumedApiCalls += apiCalls;
    budget.updatedAt = new Date().toISOString();

    const tokenPct = (budget.consumedTokens / budget.maxTokens) * 100;
    if (tokenPct >= 90) {
      messageBus.publishSystemAlert(
        'ResourceManager',
        `Resource budget for ${entityType} ${entityId} is ${Math.round(tokenPct)}% exhausted!`,
        tokenPct >= 100 ? 'error' : 'warning',
        { budget }
      );
    }

    messageBus.publish('RESOURCE_BUDGET_UPDATED', 'ResourceManager', {
      budget,
      tokensConsumed: tokens,
    }, { severity: 'info' });

    return budget;
  }

  /**
   * Dynamically rebalance budgets across tasks/goals in a mission
   */
  public rebalanceBudgets(
    missionId: string,
    reallocations: { entityType: ResourceBudget['entityType']; entityId: string; newMaxTokens: number }[]
  ): void {
    reallocations.forEach((r) => {
      this.allocateBudget(r.entityType, r.entityId, r.newMaxTokens);
    });

    messageBus.publish('RESOURCE_BUDGET_UPDATED', 'ResourceManager', {
      missionId,
      action: 'REBALANCE',
      reallocations,
    }, { missionId, severity: 'info' });
  }

  public getBudget(entityType: ResourceBudget['entityType'], entityId: string): ResourceBudget | undefined {
    return this.budgets.get(`${entityType}:${entityId}`);
  }

  public getAllBudgets(): ResourceBudget[] {
    return Array.from(this.budgets.values());
  }
}

export const resourceManager = new ResourceManager();
