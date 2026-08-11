import { messageBus } from '../bus/messageBus';

export class WorldIntegrationSecurity {
  private static readonly SECRET_KEY = 'hermes-secure-hive-web-token-xyz';
  private blockedCapabilities: Set<string> = new Set();
  private quarantinedHives: Set<string> = new Set();
  private isWebBridgeDisconnected = false;
  private isFederationFrozen = false;
  private disabledCapabilityClasses: Set<string> = new Set();

  /**
   * Generates a request signature to authenticate messages with Hermes Web.
   */
  public generateRequestSignature(requestId: string, capabilityId: string, timestamp: string): string {
    // Generate a secure mock SHA256-like hash representation
    const raw = `${requestId}:${capabilityId}:${timestamp}:${WorldIntegrationSecurity.SECRET_KEY}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `sig_h8_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Validates if a capability is allowed to execute based on current emergency policies.
   */
  public isCapabilityExecutionAllowed(capabilityId: string, category: string, hiveId?: string): { allowed: boolean; reason?: string } {
    if (this.isWebBridgeDisconnected) {
      return { allowed: false, reason: 'EMERGENCY_SHUTDOWN: Hermes Web is disconnected.' };
    }

    if (this.isFederationFrozen) {
      return { allowed: false, reason: 'EMERGENCY_FREEZE: Entire swarm federation is frozen.' };
    }

    if (hiveId && this.quarantinedHives.has(hiveId)) {
      return { allowed: false, reason: `QUARANTINE: Hive "${hiveId}" is quarantined due to safety anomalies.` };
    }

    if (this.blockedCapabilities.has(capabilityId)) {
      return { allowed: false, reason: `REVOKED: Capability "${capabilityId}" has been revoked.` };
    }

    if (this.disabledCapabilityClasses.has(category)) {
      return { allowed: false, reason: `DISABLED_CLASS: Capability category "${category}" has been disabled.` };
    }

    return { allowed: true };
  }

  // Emergency Control APIs
  public disconnectWebBridge(): void {
    this.isWebBridgeDisconnected = true;
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'DISCONNECT_WEB_BRIDGE',
      message: 'Hermes Web Bridge disconnected immediately by emergency control.',
    }, { severity: 'critical' });
  }

  public reconnectWebBridge(): void {
    this.isWebBridgeDisconnected = false;
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'RECONNECT_WEB_BRIDGE',
      message: 'Hermes Web Bridge connection re-established.',
    }, { severity: 'info' });
  }

  public freezeFederation(): void {
    this.isFederationFrozen = true;
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'FREEZE_FEDERATION',
      message: 'All federated operations frozen immediately.',
    }, { severity: 'critical' });
  }

  public unfreezeFederation(): void {
    this.isFederationFrozen = false;
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'UNFREEZE_FEDERATION',
      message: 'Swarm federation operations resumed.',
    }, { severity: 'info' });
  }

  public quarantineHive(hiveId: string): void {
    this.quarantinedHives.add(hiveId);
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'QUARANTINE_HIVE',
      hiveId,
      message: `Hive "${hiveId}" isolated. External capabilities cut off.`,
    }, { severity: 'error' });
  }

  public liftQuarantine(hiveId: string): void {
    this.quarantinedHives.delete(hiveId);
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'LIFT_QUARANTINE',
      hiveId,
      message: `Quarantine lifted for Hive "${hiveId}".`,
    }, { severity: 'info' });
  }

  public revokeCapability(capabilityId: string): void {
    this.blockedCapabilities.add(capabilityId);
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'REVOKE_CAPABILITY',
      capabilityId,
      message: `Capability "${capabilityId}" has been blacklisted.`,
    }, { severity: 'warning' });
  }

  public restoreCapability(capabilityId: string): void {
    this.blockedCapabilities.delete(capabilityId);
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'RESTORE_CAPABILITY',
      capabilityId,
      message: `Capability "${capabilityId}" restored to service.`,
    }, { severity: 'info' });
  }

  public disableCapabilityCategory(category: string): void {
    this.disabledCapabilityClasses.add(category);
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'DISABLE_CATEGORY',
      category,
      message: `All capabilities in category "${category}" are disabled.`,
    }, { severity: 'warning' });
  }

  public enableCapabilityCategory(category: string): void {
    this.disabledCapabilityClasses.delete(category);
    messageBus.publish('EMERGENCY_CONTROL', 'Security', {
      action: 'ENABLE_CATEGORY',
      category,
      message: `Capability category "${category}" re-enabled.`,
    }, { severity: 'info' });
  }

  public getSecurityState() {
    return {
      isWebBridgeDisconnected: this.isWebBridgeDisconnected,
      isFederationFrozen: this.isFederationFrozen,
      quarantinedHives: Array.from(this.quarantinedHives),
      blockedCapabilities: Array.from(this.blockedCapabilities),
      disabledCapabilityClasses: Array.from(this.disabledCapabilityClasses),
    };
  }
}

export const worldIntegrationSecurity = new WorldIntegrationSecurity();
export const emergencyControlPlane = worldIntegrationSecurity;
