import { CapabilityDescriptor, CapabilityResponse } from '../../shared/types';
import { capabilityReputationEngine } from './capabilityReputation';
import { worldModel } from './worldModel';
import { messageBus } from '../bus/messageBus';

export class OutcomeVerificationEngine {
  /**
   * Evaluates the execution outcome, audits results, feeds learning into reputation, and updates the world model.
   */
  public async verifyAndProcessOutcome(
    capability: CapabilityDescriptor,
    operation: string,
    parameters: Record<string, any>,
    response: CapabilityResponse
  ): Promise<{
    verified: boolean;
    confidence: number;
    notes: string;
  }> {
    const startMs = Date.now();
    let verified = false;
    let confidence = 0.5;
    let notes = '';
    let unexpectedBehavior = false;

    // 1. Analyze execution status
    if (response.status === 'REQUEST_SUCCESS' && response.executionStatus === 'COMPLETED') {
      verified = response.verificationStatus === 'VERIFIED';
      confidence = verified ? 0.95 : 0.4;
      notes = `Action executed successfully. Verification status: ${response.verificationStatus}.`;
      unexpectedBehavior = response.verificationStatus === 'FAILED';
    } else if (response.status === 'APPROVAL_REQUIRED') {
      verified = false;
      confidence = 1.0;
      notes = 'Execution pending policy approval.';
    } else {
      verified = false;
      confidence = 0.1;
      notes = `Execution failed with status: ${response.executionStatus}. Error: ${response.error?.message || 'Unknown error'}`;
      unexpectedBehavior = response.error?.severity === 'CRITICAL';
    }

    // 2. Feed performance metrics back into reputation engine
    const latency = response.timing.durationMs || (Date.now() - startMs);
    const accuracy = verified ? 100 : response.executionStatus === 'COMPLETED' ? 70 : 0;
    
    capabilityReputationEngine.recordExecution(
      capability.id,
      response.status === 'REQUEST_SUCCESS' && response.executionStatus === 'COMPLETED',
      latency,
      accuracy,
      unexpectedBehavior
    );

    // 3. Update the World Model
    const entityId = `web-cap-${capability.id}`;
    let stateUpdates: Record<string, any> = {
      lastExecutionId: response.executionId,
      lastStatus: response.executionStatus,
      lastVerificationStatus: response.verificationStatus,
      lastCheckedAt: new Date().toISOString(),
    };

    if (response.status === 'REQUEST_SUCCESS' && response.executionStatus === 'COMPLETED') {
      stateUpdates.health = 'operational';
      stateUpdates.availability = 'online';
      
      // Seed observation in WorldModel if it returned state-worthy info
      if (capability.id === 'web.search' && response.result) {
        worldModel.addEntity(
          `obs-query-${Math.random().toString(36).substring(2, 6)}`,
          `Query results: ${parameters.query || 'general'}`,
          'Observation',
          `Obtained live search query results with confidence ${confidence}`,
          {
            timestamp: new Date().toISOString(),
            query: parameters.query,
            totalFound: response.result.totalFound,
            source: 'hermes-web-search',
          }
        );
      }
    } else if (response.status === 'FAILED') {
      stateUpdates.health = 'degraded';
      stateUpdates.lastError = response.error?.message;
    }

    worldModel.updateEntityState(entityId, stateUpdates);

    // Track the outcome with message bus
    messageBus.publish('OUTCOME_VERIFIED', 'OutcomeVerificationEngine', {
      capabilityId: capability.id,
      operation,
      executionId: response.executionId,
      verified,
      confidence,
      notes,
    }, { severity: verified ? 'success' : 'warning' });

    return {
      verified,
      confidence,
      notes,
    };
  }
}

export const outcomeVerificationEngine = new OutcomeVerificationEngine();
export const outcomeVerification = outcomeVerificationEngine;
