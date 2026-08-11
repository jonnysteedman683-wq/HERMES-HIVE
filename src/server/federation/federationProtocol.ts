import { FederationMessage, FederationMessageType } from '../../shared/types';
import { localHiveIdentity } from './hiveIdentity';

export class FederationProtocol {
  private messageLog: FederationMessage[] = [];

  public createMessage(
    destinationHive: string,
    messageType: FederationMessageType,
    payload: Record<string, unknown>,
    correlationId?: string
  ): FederationMessage {
    const source = localHiveIdentity.getIdentity();
    const now = new Date().toISOString();
    const msgId = `fed-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const msg: FederationMessage = {
      messageId: msgId,
      federationId: 'fed-hermes-hive-network',
      sourceHive: source.hiveId,
      destinationHive,
      timestamp: now,
      messageType,
      correlationId,
      payload,
      signature: `sig-sha256-${msgId.slice(-8)}-${source.hiveId}`,
    };

    this.messageLog.push(msg);
    if (this.messageLog.length > 500) {
      this.messageLog.shift();
    }

    return msg;
  }

  public getAllMessages(): FederationMessage[] {
    return [...this.messageLog];
  }

  public getMessagesForHive(hiveId: string): FederationMessage[] {
    return this.messageLog.filter(m => m.sourceHive === hiveId || m.destinationHive === hiveId);
  }
}

export const federationProtocol = new FederationProtocol();
