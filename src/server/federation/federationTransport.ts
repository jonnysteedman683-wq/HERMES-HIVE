import { FederatedMessage } from '../../shared/types';
import { federationMessageRepository } from './federationRepositories';

export class FederationTransport {
  private inFlightAck = new Map<string, (ack: boolean) => void>();

  /**
   * Transmits a message to a destination Hive
   */
  public async send(msg: FederatedMessage): Promise<{ success: boolean; acked: boolean; error?: string }> {
    if (!msg.messageId || !msg.sourceHiveId || !msg.destinationHiveId) {
      return { success: false, acked: false, error: 'Malformed message parameters' };
    }

    // Idempotency check
    if (federationMessageRepository.hasProcessedMessage(msg.messageId)) {
      msg.deliveryStatus = 'REPLAY_BLOCKED';
      return { success: false, acked: false, error: 'Duplicate or replay message detected' };
    }

    // Check expiration
    if (new Date(msg.expiration).getTime() < Date.now()) {
      msg.deliveryStatus = 'FAILED';
      return { success: false, acked: false, error: 'Message expired in transit' };
    }

    // Mark as delivered in local storage
    msg.deliveryStatus = 'DELIVERED';
    federationMessageRepository.saveMessage(msg);

    return { success: true, acked: true };
  }

  /**
   * Acknowledges message receipt
   */
  public acknowledge(messageId: string): boolean {
    const msg = federationMessageRepository.getMessage(messageId);
    if (!msg) return false;

    msg.deliveryStatus = 'DELIVERED';
    federationMessageRepository.saveMessage(msg);

    if (this.inFlightAck.has(messageId)) {
      const resolver = this.inFlightAck.get(messageId);
      if (resolver) resolver(true);
      this.inFlightAck.delete(messageId);
    }

    return true;
  }
}

export const federationTransport = new FederationTransport();
