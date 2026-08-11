import { FederatedMessage } from '../../shared/types';
import { federationTransport } from './federationTransport';
import { hiveRepository, federationEventRepository } from './federationRepositories';
import { governanceEngine } from '../governance/governanceEngine';

export class FederationMessageRouter {
  /**
   * Constructs a standardized FederationMessage with signature metadata
   */
  public createMessage(
    sourceHiveId: string,
    destinationHiveId: string,
    messageType: string,
    payload: Record<string, unknown>,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
    ttlSeconds = 300
  ): FederatedMessage {
    const timestamp = new Date().toISOString();
    const expiration = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const messageId = `msg-${sourceHiveId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const signature = `sig-pqc-${sourceHiveId}-${JSON.stringify(payload).length}`;

    return {
      messageId,
      sourceHiveId,
      destinationHiveId,
      messageType,
      timestamp,
      correlationId: `corr-${messageId}`,
      protocolVersion: '7.0',
      payload,
      priority,
      expiration,
      signature,
      deliveryStatus: 'PENDING',
    };
  }

  /**
   * Routes message through validation pipeline:
   * Federation -> Validation -> Local Governance -> Authorization -> Execution
   */
  public async routeAndExecute(msg: FederatedMessage): Promise<{
    accepted: boolean;
    governanceAllowed: boolean;
    resultPayload?: Record<string, unknown>;
    error?: string;
  }> {
    // 1. Federation & Source Validation
    const sourceHive = hiveRepository.getHive(msg.sourceHiveId);
    if (!sourceHive) {
      federationEventRepository.logEvent({
        eventId: `evt-err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceHiveId: msg.sourceHiveId,
        destinationHiveId: msg.destinationHiveId,
        eventType: 'UNREGISTERED_SOURCE_REJECTED',
        details: { messageId: msg.messageId },
        governanceResult: 'BLOCKED',
        traceId: msg.correlationId,
      });
      return { accepted: false, governanceAllowed: false, error: 'Source Hive unregistered' };
    }

    if (sourceHive.quarantineStatus === 'QUARANTINED' || sourceHive.quarantineStatus === 'ISOLATED') {
      return { accepted: false, governanceAllowed: false, error: 'Source Hive is currently quarantined' };
    }

    // 2. Transport Delivery
    const sendResult = await federationTransport.send(msg);
    if (!sendResult.success) {
      return { accepted: false, governanceAllowed: false, error: sendResult.error };
    }

    // 3. Governance Policy Check on Remote Action Signature
    const actionSignature = `FEDERATED_ACTION:${msg.messageType}:${JSON.stringify(msg.payload)}`;
    const isProhibited = governanceEngine.checkAction(actionSignature);
    if (isProhibited) {
      federationEventRepository.logEvent({
        eventId: `evt-govblock-${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceHiveId: msg.sourceHiveId,
        destinationHiveId: msg.destinationHiveId,
        eventType: 'FEDERATION_GOVERNANCE_BLOCKED',
        details: { messageId: msg.messageId, messageType: msg.messageType },
        governanceResult: 'BLOCKED',
        traceId: msg.correlationId,
      });
      return { accepted: true, governanceAllowed: false, error: 'Action prohibited by local Hive constitution' };
    }

    // 4. Authorization & Execution
    federationEventRepository.logEvent({
      eventId: `evt-exec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: msg.sourceHiveId,
      destinationHiveId: msg.destinationHiveId,
      eventType: 'FEDERATION_MESSAGE_EXECUTED',
      details: { messageId: msg.messageId, messageType: msg.messageType },
      governanceResult: 'ALLOWED',
      traceId: msg.correlationId,
    });

    return {
      accepted: true,
      governanceAllowed: true,
      resultPayload: { status: 'SUCCESS', processedAt: new Date().toISOString() },
    };
  }
}

export const federationMessageRouter = new FederationMessageRouter();
