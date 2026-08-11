import { Goal, GoalStatus, Mission } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export interface CreateGoalOptions {
  parentGoalId?: string;
  priority?: number;
  dependencies?: string[];
  assignedAgentIds?: string[];
  taskIds?: string[];
  metadata?: Record<string, unknown>;
}

export class GoalManager {
  private goals: Map<string, Goal> = new Map();

  /**
   * Create a new hierarchical goal in the goal graph
   */
  public createGoal(
    missionId: string,
    title: string,
    description: string,
    options: CreateGoalOptions = {}
  ): Goal {
    const id = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const goal: Goal = {
      id,
      missionId,
      parentGoalId: options.parentGoalId,
      childGoalIds: [],
      title,
      description,
      status: 'PROPOSED',
      priority: options.priority ?? 3,
      progress: 0,
      assignedAgentIds: options.assignedAgentIds || [],
      taskIds: options.taskIds || [],
      dependencies: options.dependencies || [],
      createdAt: now,
      updatedAt: now,
      metadata: options.metadata || {},
    };

    // Link parent-child relationship
    if (options.parentGoalId) {
      const parent = this.goals.get(options.parentGoalId);
      if (parent) {
        parent.childGoalIds.push(id);
        parent.updatedAt = now;
      }
    }

    this.goals.set(id, goal);

    messageBus.publish('GOAL_CREATED', 'GoalManager', { goal }, {
      missionId,
      severity: 'info',
    });

    return goal;
  }

  public decomposeMission(mission: Mission): Goal[] {
    return this.decomposeMissionToGoals(mission);
  }

  /**
   * Decompose a top-level Mission into a structured Goal Graph
   */
  public decomposeMissionToGoals(mission: Mission): Goal[] {
    const createdGoals: Goal[] = [];

    const title = mission.title || mission.objective;
    const description = mission.description || mission.objective;

    // Root Goal for the mission
    const rootGoal = this.createGoal(
      mission.id,
      `Strategic Goal: ${title}`,
      description,
      { priority: mission.priority || 4 }
    );
    rootGoal.status = 'ACTIVE';
    createdGoals.push(rootGoal);

    // Group tasks into subgoals based on roles/capabilities
    const roleTaskMap: Record<string, string[]> = {};
    mission.tasks.forEach((task) => {
      const role = task.requiredRole || 'General';
      if (!roleTaskMap[role]) roleTaskMap[role] = [];
      roleTaskMap[role].push(task.id);
    });

    Object.entries(roleTaskMap).forEach(([role, taskIds]) => {
      const subGoal = this.createGoal(
        mission.id,
        `Subgoal [${role}]: Execution Phase`,
        `Fulfill execution requirements for assigned ${role} tasks.`,
        {
          parentGoalId: rootGoal.id,
          taskIds,
          priority: mission.priority,
        }
      );
      subGoal.status = 'ACTIVE';
      createdGoals.push(subGoal);
    });

    return createdGoals;
  }

  /**
   * Get all goals associated with a mission
   */
  public getMissionGoals(missionId: string): Goal[] {
    return Array.from(this.goals.values()).filter((g) => g.missionId === missionId);
  }

  /**
   * Get goal by ID
   */
  public getGoal(id: string): Goal | undefined {
    return this.goals.get(id);
  }

  /**
   * Update goal status and cascade changes
   */
  public updateGoalStatus(
    goalId: string,
    status: GoalStatus,
    reason?: string
  ): Goal | undefined {
    const goal = this.goals.get(goalId);
    if (!goal) return undefined;

    goal.status = status;
    goal.updatedAt = new Date().toISOString();

    if (reason) {
      if (status === 'BLOCKED') goal.blockingReason = reason;
      if (status === 'SUPERSEDED') goal.obsoleteReason = reason;
      if (status === 'FAILED') goal.blockingReason = reason;
    }

    // Auto-update progress
    if (status === 'COMPLETED') {
      goal.progress = 100;
    }

    messageBus.publish('GOAL_UPDATED', 'GoalManager', {
      goalId: goal.id,
      status: goal.status,
      reason,
      progress: goal.progress,
    }, {
      missionId: goal.missionId,
      severity: status === 'BLOCKED' || status === 'FAILED' ? 'warning' : 'info',
    });

    // Cascade to parent if all children complete
    if (goal.parentGoalId && (status === 'COMPLETED' || status === 'SUPERSEDED')) {
      this.recalculateParentProgress(goal.parentGoalId);
    }

    return goal;
  }

  /**
   * Detect blocked goals due to unfulfilled dependency goals or blocked tasks
   */
  public detectBlockedGoals(missionId: string): Goal[] {
    const blocked: Goal[] = [];
    const missionGoals = this.getMissionGoals(missionId);

    missionGoals.forEach((goal) => {
      if (goal.status === 'ACTIVE' || goal.status === 'PROPOSED') {
        const hasUnmetDependency = goal.dependencies.some((depId) => {
          const depGoal = this.goals.get(depId);
          return depGoal && depGoal.status !== 'COMPLETED' && depGoal.status !== 'SUPERSEDED';
        });

        if (hasUnmetDependency) {
          goal.status = 'BLOCKED';
          goal.blockingReason = 'Prerequisite dependency goals not satisfied.';
          blocked.push(goal);

          messageBus.publish('GOAL_BLOCKED', 'GoalManager', {
            goalId: goal.id,
            reason: goal.blockingReason,
          }, { missionId, severity: 'warning' });
        }
      }
    });

    return blocked;
  }

  /**
   * Detect obsolete goals whose context or parent goals have completed or been abandoned
   */
  public detectObsoleteGoals(missionId: string): Goal[] {
    const obsolete: Goal[] = [];
    const missionGoals = this.getMissionGoals(missionId);

    missionGoals.forEach((goal) => {
      if (goal.parentGoalId) {
        const parent = this.goals.get(goal.parentGoalId);
        if (parent && (parent.status === 'ABANDONED' || parent.status === 'SUPERSEDED')) {
          goal.status = 'SUPERSEDED';
          goal.obsoleteReason = `Parent goal ${parent.id} was ${parent.status}.`;
          obsolete.push(goal);

          messageBus.publish('GOAL_SUPERSEDED', 'GoalManager', {
            goalId: goal.id,
            reason: goal.obsoleteReason,
          }, { missionId, severity: 'info' });
        }
      }
    });

    return obsolete;
  }

  /**
   * Detect conflicting goals (e.g. mutually exclusive priority/task specifications)
   */
  public detectConflictingGoals(missionId: string): { goalA: Goal; goalB: Goal; reason: string }[] {
    const conflicts: { goalA: Goal; goalB: Goal; reason: string }[] = [];
    const missionGoals = this.getMissionGoals(missionId);

    for (let i = 0; i < missionGoals.length; i++) {
      for (let j = i + 1; j < missionGoals.length; j++) {
        const a = missionGoals[i];
        const b = missionGoals[j];

        // Check if same tasks assigned with opposing priorities or conflicting status
        const overlappingTasks = a.taskIds.filter((tid) => b.taskIds.includes(tid));
        if (overlappingTasks.length > 0 && a.status === 'ACTIVE' && b.status === 'SUPERSEDED') {
          conflicts.push({
            goalA: a,
            goalB: b,
            reason: `Goals overlap on tasks [${overlappingTasks.join(', ')}] with inconsistent state.`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Dynamically reprioritize goals based on changing conditions
   */
  public reprioritizeGoals(missionId: string, priorityMap: Record<string, number>): void {
    Object.entries(priorityMap).forEach(([goalId, priority]) => {
      const goal = this.goals.get(goalId);
      if (goal && goal.missionId === missionId) {
        goal.priority = Math.max(1, Math.min(5, priority));
        goal.updatedAt = new Date().toISOString();

        messageBus.publish('GOAL_UPDATED', 'GoalManager', {
          goalId: goal.id,
          priority: goal.priority,
          reason: 'Reprioritized by Hermes Executive reasoning.',
        }, { missionId, severity: 'info' });
      }
    });
  }

  /**
   * Generate follow-up objectives when mission completes with potential extensions
   */
  public generateFollowUpObjectives(missionId: string): string[] {
    const goals = this.getMissionGoals(missionId);
    const followUps: string[] = [];

    const completed = goals.filter((g) => g.status === 'COMPLETED');
    if (completed.length > 0) {
      followUps.push(`Post-execution verification audit for ${completed.length} completed strategic goals.`);
      followUps.push(`Continuous telemetry observation and automated security regression sweep.`);
    }

    return followUps;
  }

  /**
   * Recalculate parent progress based on children status
   */
  private recalculateParentProgress(parentGoalId: string): void {
    const parent = this.goals.get(parentGoalId);
    if (!parent) return;

    const children = parent.childGoalIds.map((cid) => this.goals.get(cid)).filter((g): g is Goal => !!g);
    if (children.length === 0) return;

    const totalProgress = children.reduce((acc, c) => acc + c.progress, 0);
    parent.progress = Math.round(totalProgress / children.length);
    parent.updatedAt = new Date().toISOString();

    if (parent.progress >= 100 && parent.status !== 'COMPLETED') {
      parent.status = 'COMPLETED';
      messageBus.publish('GOAL_COMPLETED', 'GoalManager', { goalId: parent.id }, {
        missionId: parent.missionId,
        severity: 'success',
      });
    }
  }

  /**
   * Get all goals across system
   */
  public getAllGoals(): Goal[] {
    return Array.from(this.goals.values());
  }
}

export const goalManager = new GoalManager();
