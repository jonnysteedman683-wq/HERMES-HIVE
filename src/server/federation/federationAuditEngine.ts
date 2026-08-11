import { FederationEvent } from '../../shared/types';
import { federationEventRepository } from './federationRepositories';

export class FederationAuditEngine {
  public log(event: FederationEvent): FederationEvent {
    return federationEventRepository.logEvent(event);
  }

  public getAuditTrail(limit = 100): FederationEvent[] {
    return federationEventRepository.getEvents(limit);
  }
}

export const federationAuditEngine = new FederationAuditEngine();
