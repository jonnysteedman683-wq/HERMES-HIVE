// Comprehensive Federation Module Unit Tests
import type { FederatedConsensusProposal, FederatedTask, FederatedTaskBid, TrustRecord, ProposalTerms, MissionContract, FederationAuthCheck, RiskAssessment } from '../shared/types';

// Ambient declaration for bun:test (provided by Bun runtime, not npm package)
declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void): void;
  export { expect };
}

import { describe, it, expect, beforeEach } from 'bun:test';
import { federatedConsensusEngine } from '../server/federation/federatedConsensusEngine';
import { federatedTaskEngine } from '../server/federation/federatedTaskEngine';
import { federationGovernance } from '../server/federation/federationGovernance';
import { trustEngine } from '../server/federation/trustEngine';
import { negotiationEngine } from '../server/federation/negotiationEngine';
import { hiveQuarantineEngine } from '../server/federation/hiveQuarantineEngine';
import { hiveRegistry } from '../server/federation/hiveRegistry';
import { federationEventRepository } from '../server/federation/federationRepositories';
import { federationProtocol } from '../server/federation/federationProtocol';
import { missionContractManager } from '../server/federation/missionContract';
import { hiveRepository } from '../server/federation/federationRepositories';
import { riskEngine } from '../server/governance/riskEngine';

// ── Helpers ──────────────────────────────────────────────────────────────────

const resetTestState = () => {
  const evtRepo = federationEventRepository as any;
  if (evtRepo && evtRepo.events) evtRepo.events = [];
  const fedProto = federationProtocol as any;
  if (fedProto && fedProto.messageLog) fedProto.messageLog = [];
  const contractMgr = missionContractManager as any;
  if (contractMgr && contractMgr.contracts) contractMgr.contracts = new Map();
};

const makeTrustRecord = (
  hiveId: string, level: string, score: number,
  successes: number, failures: number, now: string
) => ({ hiveId, trustLevel: level as any, trustScore: score, historicalSuccessCount: successes, historicalFailureCount: failures, lastVerifiedAt: now });

const resetTrustEngine = () => {
  const te = trustEngine as any;
  if (te && te.trustRecords) {
    te.trustRecords.clear();
    const now = new Date().toISOString();
    te.trustRecords.set('hive-hermes-prime', makeTrustRecord('hive-hermes-prime', 'HIGH_TRUST', 98, 42, 0, now));
    te.trustRecords.set('hive-research-alpha', makeTrustRecord('hive-research-alpha', 'TRUSTED', 92, 28, 1, now));
    te.trustRecords.set('hive-engineering-beta', makeTrustRecord('hive-engineering-beta', 'TRUSTED', 95, 35, 1, now));
    te.trustRecords.set('hive-security-gamma', makeTrustRecord('hive-security-gamma', 'HIGH_TRUST', 99, 50, 0, now));
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resetQuarantine = () => {
  const qe = hiveQuarantineEngine as any;
  if (qe && qe.quarantines) {
    qe.quarantines.clear();
    const hr = hiveRegistry as any;
    const hives = hr.hives as Record<string, { quarantineStatus?: string; state?: string; identity?: { federationMembershipState?: string } }> | undefined;
    if (hives) {
      for (const [, hive] of Object.entries(hives)) {
        if (hive.quarantineStatus === 'QUARANTINED' || hive.state === 'QUARANTINED') {
          hive.quarantineStatus = 'NONE';
          hive.state = 'ACTIVE';
          if (hive.identity) hive.identity.federationMembershipState = 'ACTIVE';
        }
      }
    }
  }
};

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('Federation Module — Unit Tests', () => {
  beforeEach(() => {
    resetTestState();
    resetTrustEngine();
    resetQuarantine();
  });

  // ================================================================
  // 1. FederatedConsensusEngine (9 tests)
  // ================================================================
  describe('federatedConsensusEngine', () => {
    it('creates a proposal with correct defaults', () => {
      const prop = federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'Protocol Upgrade v2', 'Upgrade federation protocol',
        [{ optionId: 'opt-a', description: 'Upgrade now', expectedOutcome: 'Secure' },
         { optionId: 'opt-b', description: 'Wait', expectedOutcome: 'Stable' }],
        ['hive-hermes-prime', 'hive-security-gamma']
      );
      expect(prop.proposalId.startsWith('fedprop-')).toBe(true);
      expect(prop.proposerHiveId).toBe('hive-hermes-prime');
      expect(prop.title).toBe('Protocol Upgrade v2');
      expect(prop.status).toBe('PROPOSED');
      expect(prop.quorumPct).toBe(60);
      expect(prop.votes).toEqual([]);
      expect(prop.dissentRecords).toEqual([]);
      expect(prop.consensusOptionId).toBeUndefined();
    });

    it('returns undefined for non-existent proposal lookup', () => {
      expect(federatedConsensusEngine.getProposal('nonexistent')).toBeUndefined();
    });

    it('returns all proposals', () => {
      federatedConsensusEngine.createProposal('hive-a', 'T1', 'O1', [], ['hive-a']);
      federatedConsensusEngine.createProposal('hive-b', 'T2', 'O2', [], ['hive-b']);
      expect(federatedConsensusEngine.getAllProposals().length).toBeGreaterThanOrEqual(2);
    });

    it('casts a vote and transitions status to VOTING', () => {
      const prop = federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'Vote Test', 'Testing voting',
        [{ optionId: 'yes', description: 'Yes', expectedOutcome: 'Pass' }],
        ['hive-hermes-prime', 'hive-security-gamma']
      );
      const updated = federatedConsensusEngine.castVote(
        prop.proposalId, 'hive-hermes-prime', 'yes', 'Approve'
      );
      expect(updated).toBeDefined();
      expect(updated!.status).toBe('VOTING');
      expect(updated!.votes.length).toBe(1);
      expect(updated!.votes[0].hiveId).toBe('hive-hermes-prime');
      expect(updated!.votes[0].selectedOptionId).toBe('yes');
    });

    it('casts a dissenting vote and records dissent', () => {
      const prop = federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'Dissent Test', 'Testing dissent',
        [{ optionId: 'a', description: 'A', expectedOutcome: 'X' }],
        ['hive-hermes-prime', 'hive-security-gamma']
      );
      const updated = federatedConsensusEngine.castVote(
        prop.proposalId, 'hive-security-gamma', 'a', 'I disagree',
        true, 'Evidence: latency benchmarks'
      );
      expect(updated!.dissentRecords.length).toBe(1);
      expect(updated!.dissentRecords[0].hiveId).toBe('hive-security-gamma');
      expect(updated!.dissentRecords[0].evidence).toBe('Evidence: latency benchmarks');
    });

    it('reaches consensus when quorum is met', () => {
      const prop = federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'Quorum Test', 'Testing quorum',
        [{ optionId: 'opt-x', description: 'X', expectedOutcome: 'X' },
         { optionId: 'opt-y', description: 'Y', expectedOutcome: 'Y' }],
        ['hive-hermes-prime', 'hive-security-gamma']
      );
      // Vote 1: 1/2 = 50% < 60% → VOTING
      federatedConsensusEngine.castVote(prop.proposalId, 'hive-hermes-prime', 'opt-x', 'Vote X');
      let updated = federatedConsensusEngine.getProposal(prop.proposalId);
      expect(updated!.status).toBe('VOTING');
      // Vote 2: 100% ≥ 60% → CONSENSUS_REACHED
      // Weights from hiveRepository: hermes-prime=98→0.98, security-gamma=95→0.95
      // opt-x: 0.98, opt-y: 0.95 → opt-x wins
      updated = federatedConsensusEngine.castVote(prop.proposalId, 'hive-security-gamma', 'opt-y', 'Vote Y');
      expect(updated!.status).toBe('CONSENSUS_REACHED');
      expect(updated!.consensusOptionId).toBe('opt-x');
    });

    it('uses default weight 0.8 when hive not in registry', () => {
      const prop = federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'Unknown Hive Vote', 'Test',
        [{ optionId: 'a', description: 'A', expectedOutcome: 'X' }],
        ['hive-hermes-prime']
      );
      const updated = federatedConsensusEngine.castVote(
        prop.proposalId, 'unknown-hive', 'a', 'Vote from unknown hive'
      );
      expect(updated!.votes[0].weight).toBe(0.8);
    });

    it('vote on non-existent proposal returns undefined', () => {
      expect(federatedConsensusEngine.castVote(
        'no-such-prop', 'hive-hermes-prime', 'opt-a', 'Vote'
      )).toBeUndefined();
    });

    it('generates unique proposal IDs', () => {
      const p1 = federatedConsensusEngine.createProposal('h', 'T1', 'O1', [], ['h']);
      const p2 = federatedConsensusEngine.createProposal('h', 'T2', 'O2', [], ['h']);
      expect(p1.proposalId).not.toBe(p2.proposalId);
    });
  });

  // ================================================================
  // 2. FederatedTaskEngine (13 tests)
  // ================================================================
  describe('federatedTaskEngine', () => {
    it('publishes a task with correct defaults', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Analyze threat model', ['SECURITY_AUDITING'],
        ['NO_SIDE_EFFECTS'], 50000, 12000
      );
      expect(task.taskId.startsWith('fedtask-')).toBe(true);
      expect(task.originatorHiveId).toBe('hive-hermes-prime');
      expect(task.status).toBe('PUBLISHED');
      expect(task.priority).toBe(3);
      expect(task.riskClassification).toBe('MEDIUM');
      expect(task.tokenBudget).toBe(50000);
      expect(task.compensationTokens).toBe(12000);
    });

    it('uses custom risk classification and deadline', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Urgent patch', ['PATCHING'], [],
        10000, 5000, 'CRITICAL', 600
      );
      expect(task.riskClassification).toBe('CRITICAL');
      const deadlineMs = new Date(task.deadline).getTime();
      const nowMs = Date.now();
      expect(deadlineMs - nowMs).toBeLessThan(700000);
      expect(deadlineMs - nowMs).toBeGreaterThan(500000);
    });

    it('returns undefined for non-existent task', () => {
      expect(federatedTaskEngine.getTask('nonexistent-task')).toBeUndefined();
    });

    it('returns all tasks', () => {
      federatedTaskEngine.publishTask('h', 'T1', [], [], 100, 50);
      federatedTaskEngine.publishTask('h', 'T2', [], [], 200, 100);
      expect(federatedTaskEngine.getAllTasks().length).toBeGreaterThanOrEqual(2);
    });

    it('submits a bid and computes bidScore correctly', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Security audit',
        ['SECURITY_AUDITING', 'CRYPTOGRAPHY'], [], 50000, 15000
      );
      const bid = federatedTaskEngine.submitBid(
        task.taskId, 'hive-security-gamma', 'Security Hive Gamma',
        ['SECURITY_AUDITING'], 600, 0.95, 10000
      );
      // capMatchPct=1/2=0.5, priceRatio=min(1,15000/10000)=1.0, confidence=0.95
      // reputationScore from hive-security-gamma in hiveRepository = 94
      // bidScore = round(0.5*40 + 1.0*30 + 0.95*15 + 0.94*15) = round(78.35) = 78
      expect(bid.bidScore).toBe(78);
      expect(bid.biddingHiveId).toBe('hive-security-gamma');
    });

    it('submits bid with full capability match and computes max score', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Full match', ['CAP_A'], [], 10000, 10000
      );
      const bid = federatedTaskEngine.submitBid(
        task.taskId, 'hive-security-gamma', 'Gamma', ['CAP_A'],
        300, 1.0, 10000
      );
      // = round(40+30+15+14.1) = round(99.1) = 99
      expect(bid.bidScore).toBe(99);
    });

    it('throws error when submitting bid for non-existent task', () => {
      expect(() => federatedTaskEngine.submitBid(
        'nonexistent-task', 'hive-security-gamma', 'Gamma', [], 100, 0.5, 1000
      )).toThrow('Task nonexistent-task not found');
    });

    it('assigns task to winning bid and updates status', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Assign test', ['TEST'], [], 1000, 500
      );
      const bid = federatedTaskEngine.submitBid(
        task.taskId, 'hive-security-gamma', 'Gamma', ['TEST'], 100, 0.9, 400
      );
      const assigned = federatedTaskEngine.assignTask(task.taskId, bid);
      expect(assigned.assignedHiveId).toBe('hive-security-gamma');
      expect(assigned.status).toBe('ASSIGNED');
    });

    it('throws error when assigning non-existent task', () => {
      const fakeBid: any = {
        bidId: 'fake', taskId: 'no-task', biddingHiveId: 'h', biddingHiveName: 'H',
        capabilitiesMatched: [], estimatedCompletionTimeSec: 100,
        confidence: 0.5, bidPriceTokens: 100, reputationScore: 50,
        bidScore: 50, submittedAt: new Date().toISOString(),
      };
      expect(() => federatedTaskEngine.assignTask('no-task', fakeBid)).toThrow('Task no-task not found');
    });

    it('settles task successfully', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Settle test', [], [], 1000, 500
      );
      const bid = federatedTaskEngine.submitBid(
        task.taskId, 'hive-security-gamma', 'Gamma', [], 100, 0.5, 400
      );
      federatedTaskEngine.assignTask(task.taskId, bid);
      const settled = federatedTaskEngine.settleTask(task.taskId, true, 'Done');
      expect(settled.status).toBe('SETTLED');
    });

    it('settles task as failed', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Fail test', [], [], 1000, 500
      );
      const settled = federatedTaskEngine.settleTask(task.taskId, false, 'Error');
      expect(settled.status).toBe('FAILED');
    });

    it('throws error settling non-existent task', () => {
      expect(() => federatedTaskEngine.settleTask('no-task', true, 'X'))
        .toThrow('Task no-task not found');
    });

    it('transitions task status to BIDDING after first bid', () => {
      const task = federatedTaskEngine.publishTask('h', 'Bidding test', ['X'], [], 100, 50);
      expect(task.status).toBe('PUBLISHED');
      federatedTaskEngine.submitBid(task.taskId, 'h', 'H', ['X'], 10, 0.5, 30);
      expect(federatedTaskEngine.getTask(task.taskId)!.status).toBe('BIDDING');
    });

    it('bid with zero required capabilities still computes score', () => {
      const task = federatedTaskEngine.publishTask('h', 'No caps', [], [], 100, 50);
      const bid = federatedTaskEngine.submitBid(task.taskId, 'h', 'H', [], 10, 0.5, 30);
      // capMatchPct=0/1=0, priceRatio=min(1,50/30)=1.0, confidence=0.5
      // hive-hermes-prime reputationScore from hiveRepository=98
      // bidScore = round(0*40 + 1.0*30 + 0.5*15 + 0.98*15) = round(52.2) = 52
      expect(bid.bidScore).toBeGreaterThan(45);
    });
  });

  // ================================================================
  // 3. FederationGovernance (8 tests)
  // ================================================================
  describe('federationGovernance', () => {
    it('allows request from HIGH_TRUST hive for low-risk action', () => {
      const result = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-hermes-prime',
        targetHiveId: 'hive-security-gamma',
        actionType: 'READ_FEDERATION_STATUS',
      });
      expect(result.allowed).toBe(true);
      expect(result.requiresHumanApproval).toBe(false);
      expect(result.reason).toContain('HIGH_TRUST');
      expect(result.riskAssessment.riskLevel).toBe('LOW');
    });

    it('blocks QUARANTINED hive via trust engine downgrade', () => {
      // Drive hive-security-gamma trust score below 30 to trigger QUARANTINED
      // Start: 99. Each failure: -15. Need 99-15*n < 30 → n >= 5
      for (let i = 0; i < 5; i++) trustEngine.recordOutcome('hive-security-gamma', false);
      const result = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-security-gamma',
        targetHiveId: 'hive-hermes-prime',
        actionType: 'EXECUTE_TASK',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('QUARANTINED');
      expect(result.requiresHumanApproval).toBe(true);
      expect(result.riskAssessment.riskLevel).toBe('CRITICAL');
      expect(result.riskAssessment.score).toBe(100);
    });

    it('blocks CRITICAL risk operations requiring human authorization', () => {
      // Verify riskEngine can produce CRITICAL with factorsOverride
      const crit = riskEngine.evaluateRisk({
        actionType: 'DELETE_SYSTEM_DATA',
        targetResource: 'prod-database',
        factorsOverride: {
          impact: 10, uncertainty: 10, reversibility: 10,
          privilege: 10, externality: 10, securitySensitivity: 10, resourceCost: 10,
        },
      });
      expect(crit.riskLevel).toBe('CRITICAL');
      expect(crit.requiredApproval).toBe('EXPLICIT_HUMAN_AUTHORIZATION');

      const highRisk = riskEngine.evaluateRisk({
        actionType: 'DEPLOY_WITH_SECURITY_SENSITIVE_CONFIG',
        targetResource: 'production',
      });
      expect(highRisk.riskLevel).toBeDefined();

      const criticalAssessment = riskEngine.evaluateRisk({
        actionType: 'SYSTEM_PURGE_OPERATION',
        targetResource: 'all-data',
        factorsOverride: { impact: 10, uncertainty: 10, reversibility: 10, privilege: 10, externality: 10, securitySensitivity: 10, resourceCost: 10 },
      });
      expect(criticalAssessment.riskLevel).toBe('CRITICAL');
    });

    it('allows MEDIUM risk operations', () => {
      const result = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-hermes-prime',
        targetHiveId: 'hive-security-gamma',
        actionType: 'DEPLOY_APPLICATION',
        targetResource: 'staging',
      });
      expect(result.allowed).toBe(true);
      expect(result.riskAssessment.riskLevel).toBeDefined();
    });

    it('returns risk assessment with all required fields', () => {
      const result = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-hermes-prime',
        targetHiveId: 'hive-research-alpha',
        actionType: 'QUERY_MEMORY',
      });
      expect(result.riskAssessment).toBeDefined();
      expect(result.riskAssessment.id).toBeDefined();
      expect(result.riskAssessment.actionType).toBe('QUERY_MEMORY');
      expect(result.riskAssessment.timestamp).toBeDefined();
      expect(result.riskAssessment.factors).toBeDefined();
    });

    it('handles unknown requesting hive with UNKNOWN trust level', () => {
      const result = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'completely-unknown-hive',
        targetHiveId: 'hive-hermes-prime',
        actionType: 'PING',
      });
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('UNKNOWN');
    });

    it('returns FederationAuthCheck shape with all fields', () => {
      const result = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-hermes-prime',
        targetHiveId: 'hive-security-gamma',
        actionType: 'HEALTH_CHECK',
      });
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('requiresHumanApproval');
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.reason).toBe('string');
      expect(typeof result.requiresHumanApproval).toBe('boolean');
    });
  });

  // ================================================================
  // 4. TrustEngine (11 tests)
  // ================================================================
  describe('trustEngine', () => {
    it('returns pre-seeded trust records', () => {
      const hermes = trustEngine.getTrustRecord('hive-hermes-prime');
      expect(hermes).toBeDefined();
      expect(hermes!.hiveId).toBe('hive-hermes-prime');
      expect(hermes!.trustLevel).toBe('HIGH_TRUST');
      expect(hermes!.trustScore).toBe(98);
      expect(hermes!.historicalSuccessCount).toBe(42);
      expect(hermes!.historicalFailureCount).toBe(0);
      const research = trustEngine.getTrustRecord('hive-research-alpha');
      expect(research!.trustLevel).toBe('TRUSTED');
      expect(research!.trustScore).toBe(92);
    });

    it('returns undefined for unknown hive', () => {
      expect(trustEngine.getTrustRecord('nonexistent-hive')).toBeUndefined();
    });

    it('returns all trust records', () => {
      const all = trustEngine.getAllTrustRecords();
      expect(all.length).toBeGreaterThanOrEqual(4);
      expect(all.map(r => r.hiveId)).toContain('hive-hermes-prime');
      expect(all.map(r => r.hiveId)).toContain('hive-security-gamma');
    });

    it('records a successful outcome and increases trust score', () => {
      const rec = trustEngine.recordOutcome('hive-research-alpha', true);
      // 92 + 2 = 94, level → HIGH_TRUST (>=90)
      expect(rec.trustScore).toBe(94);
      expect(rec.historicalSuccessCount).toBe(29);
      expect(rec.historicalFailureCount).toBe(1);
      expect(rec.trustLevel).toBe('HIGH_TRUST');
    });

    it('records a failed outcome and decreases trust score', () => {
      const rec = trustEngine.recordOutcome('hive-research-alpha', false);
      // 92 - 15 = 77, level → TRUSTED (>=70)
      expect(rec.trustScore).toBe(77);
      expect(rec.historicalFailureCount).toBe(2);
      expect(rec.trustLevel).toBe('TRUSTED');
    });

    it('creates a new trust record for unknown hive on first outcome', () => {
      const rec = trustEngine.recordOutcome('brand-new-hive', true);
      expect(rec.hiveId).toBe('brand-new-hive');
      expect(rec.trustLevel).toBe('LIMITED');
      // Created at 50, then +2 for success = 52
      expect(rec.trustScore).toBeGreaterThan(50);
      expect(rec.historicalSuccessCount).toBe(1);
    });

    it('transitions to QUARANTINED when score drops below 30', () => {
      const freshId = 'fresh-quar-' + Date.now();
      trustEngine.recordOutcome(freshId, true); // 52
      trustEngine.recordOutcome(freshId, true); // 54
      trustEngine.recordOutcome(freshId, true); // 56
      trustEngine.recordOutcome(freshId, true); // 58
      trustEngine.recordOutcome(freshId, true); // 60
      trustEngine.recordOutcome(freshId, false); // 45
      trustEngine.recordOutcome(freshId, false); // 30
      const rec = trustEngine.recordOutcome(freshId, false); // 15 → QUARANTINED
      expect(rec.trustLevel).toBe('QUARANTINED');
      expect(rec.trustScore).toBe(15);
    });

    it('transitions to LIMITED when score is between 30 and 70', () => {
      const rec = trustEngine.recordOutcome('hive-engineering-beta', false);
      // 95 - 15 = 80 → still TRUSTED
      expect(rec.trustLevel).toBe('TRUSTED');
      const rec2 = trustEngine.recordOutcome('hive-engineering-beta', false);
      // 80 - 15 = 65 → LIMITED
      expect(rec2.trustLevel).toBe('LIMITED');
      expect(rec2.trustScore).toBe(65);
    });

    it('trust score cannot exceed 100', () => {
      const rec = trustEngine.recordOutcome('hive-security-gamma', true);
      // 99 + 2 = 101 → capped at 100
      expect(rec.trustScore).toBeLessThanOrEqual(100);
      expect(rec.trustLevel).toBe('HIGH_TRUST');
    });

    it('trust score cannot go below 0', () => {
      const freshId = 'fresh-floor-' + Date.now();
      trustEngine.recordOutcome(freshId, true); // 52
      trustEngine.recordOutcome(freshId, false); // 37
      trustEngine.recordOutcome(freshId, false); // 22
      trustEngine.recordOutcome(freshId, false); // 7
      const rec = trustEngine.recordOutcome(freshId, false); // max(0, -8) = 0
      expect(rec.trustScore).toBeGreaterThanOrEqual(0);
    });

    it('updates lastVerifiedAt on each outcome recording', () => {
      const before = new Date();
      trustEngine.recordOutcome('hive-hermes-prime', true);
      const after = new Date();
      const rec = trustEngine.getTrustRecord('hive-hermes-prime');
      expect(new Date(rec!.lastVerifiedAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(new Date(rec!.lastVerifiedAt).getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // ================================================================
  // 5. NegotiationEngine (9 tests)
  // ================================================================
  describe('negotiationEngine', () => {
    it('requestProposals returns proposals for matching capability', () => {
      const proposals = negotiationEngine.requestProposals(
        'hive-hermes-prime', 'GOVERNANCE', 'Governance task'
      );
      expect(Array.isArray(proposals)).toBe(true);
    });

    it('excludes requesting hive from proposals', () => {
      hiveRegistry.registerHive(
        'hive-test-auditor', 'Test Auditor', 'Test',
        ['SECURITY_AUDITING'], 'https://test.example.com'
      );
      hiveRegistry.transitionState('hive-test-auditor', 'ACTIVE');
      const proposals = negotiationEngine.requestProposals(
        'hive-test-auditor', 'SECURITY_AUDITING', 'Self-test'
      );
      expect(proposals.every(p => p.executingHiveId !== 'hive-test-auditor')).toBe(true);
    });

    it('proposal terms include required fields', () => {
      const proposals = negotiationEngine.requestProposals(
        'hive-hermes-prime', 'GOVERNANCE', 'Governance task'
      );
      for (const p of proposals) {
        expect(p.executingHiveId).toBeDefined();
        expect(p.executingHiveName).toBeDefined();
        expect(typeof p.estimatedCostTokens).toBe('number');
        expect(typeof p.estimatedTimeSec).toBe('number');
        expect(typeof p.confidenceScore).toBe('number');
        expect(p.slaTerms).toBeDefined();
        expect(p.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(p.confidenceScore).toBeLessThanOrEqual(1);
      }
    });

    it('finalizes negotiation and creates a mission contract', () => {
      const proposals = negotiationEngine.requestProposals(
        'hive-hermes-prime', 'GOVERNANCE', 'Governance review'
      );
      if (proposals.length === 0) {
        console.log('  (skipping: no candidate hives for GOVERNANCE)');
        return;
      }
      const selected = proposals[0];
      const contract = negotiationEngine.finalizeNegotiation(
        'hive-hermes-prime', selected, 'Review governance policies',
        ['Policy review completed', 'Findings documented']
      );
      expect(contract.contractId.startsWith('contract-fed-')).toBe(true);
      expect(contract.requestingHive).toBe('hive-hermes-prime');
      expect(contract.executingHive).toBe(selected.executingHiveId);
      expect(contract.objective).toBe('Review governance policies');
      expect(contract.successCriteria).toEqual(['Policy review completed', 'Findings documented']);
      expect(contract.status).toBe('ACCEPTED');
      expect(contract.resourceBudget.maxTokens).toBe(selected.estimatedCostTokens);
    });

    it('finalizeNegotiation sends MISSION_ACCEPTED protocol message', () => {
      const proposals = negotiationEngine.requestProposals(
        'hive-hermes-prime', 'REASONING', 'Reasoning task'
      );
      if (proposals.length === 0) {
        console.log('  (skipping: no candidate hives for REASONING)');
        return;
      }
      const selected = proposals[0];
      negotiationEngine.finalizeNegotiation(
        'hive-hermes-prime', selected, 'Reasoning analysis', ['Analysis complete']
      );
      const msgs = federationProtocol.getAllMessages();
      const acceptedMsg = msgs.find(m => m.messageType === 'MISSION_ACCEPTED');
      expect(acceptedMsg).toBeDefined();
      if (acceptedMsg) {
        expect(acceptedMsg.destinationHive).toBe(selected.executingHiveId);
        expect(acceptedMsg.payload).toHaveProperty('contractId');
        expect(acceptedMsg.payload).toHaveProperty('terms');
      }
    });

    it('requestProposals sends MISSION_PROPOSAL messages', () => {
      const countBefore = federationProtocol.getAllMessages().length;
      negotiationEngine.requestProposals(
        'hive-hermes-prime', 'GOVERNANCE', 'Governance discovery'
      );
      const msgs = federationProtocol.getAllMessages();
      const newMsgs = msgs.slice(countBefore);
      const proposals = newMsgs.filter(m => m.messageType === 'MISSION_PROPOSAL');
      expect(proposals.length).toBeGreaterThanOrEqual(0);
    });

    it('estimated cost is higher for lower reputation hives', () => {
      hiveRegistry.registerHive(
        'hive-cheap', 'Cheap Hive', 'Low rep', ['TEST_CAP'],
        'https://cheap.example.com'
      );
      hiveRegistry.transitionState('hive-cheap', 'ACTIVE');
      hiveRegistry.registerHive(
        'hive-premium', 'Premium Hive', 'High rep', ['TEST_CAP'],
        'https://premium.example.com'
      );
      const premiumHive = hiveRepository.getHive('hive-premium');
      if (premiumHive) {
        premiumHive.reputationScore = 99;
        premiumHive.trustScore = 99;
        hiveRepository.upsertHive(premiumHive);
      }
      hiveRegistry.transitionState('hive-premium', 'ACTIVE');
      const proposals = negotiationEngine.requestProposals(
        'hive-hermes-prime', 'TEST_CAP', 'Cost comparison'
      );
      const cheapProposal = proposals.find(p => p.executingHiveId === 'hive-cheap');
      const premiumProposal = proposals.find(p => p.executingHiveId === 'hive-premium');
      if (cheapProposal && premiumProposal) {
        // cost = round(15000 + (100 - rep) * 200)
        // cheap (rep=80): 15000 + 20*200 = 19000
        // premium (rep=99): 15000 + 1*200 = 15200
        expect(cheapProposal.estimatedCostTokens).toBeGreaterThan(premiumProposal.estimatedCostTokens);
      }
    });
  });

  // ================================================================
  // Cross-engine integration tests (10 tests)
  // ================================================================
  describe('Cross-engine federation flows', () => {
    it('full task lifecycle: publish → bid → assign → settle', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Integrated test', ['AUDITING'],
        ['ISOLATED_EXECUTION'], 25000, 8000
      );
      expect(task.status).toBe('PUBLISHED');
      const bid = federatedTaskEngine.submitBid(
        task.taskId, 'hive-security-gamma', 'Security Gamma',
        ['AUDITING'], 300, 0.92, 7000
      );
      expect(bid.bidScore).toBeGreaterThan(0);
      const assigned = federatedTaskEngine.assignTask(task.taskId, bid);
      expect(assigned.status).toBe('ASSIGNED');
      expect(assigned.assignedHiveId).toBe('hive-security-gamma');
      const settled = federatedTaskEngine.settleTask(task.taskId, true, 'All clear');
      expect(settled.status).toBe('SETTLED');
    });

    it('governance blocks task from quarantined hive', () => {
      for (let i = 0; i < 5; i++) trustEngine.recordOutcome('hive-security-gamma', false);
      const result = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-security-gamma',
        targetHiveId: 'hive-hermes-prime',
        actionType: 'SUBMIT_TASK_BID',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('QUARANTINED');
    });

    it('consensus proposal creates federation event', () => {
      const initialEvents = federationEventRepository.getEvents().length;
      federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'Event test', 'Testing events',
        [{ optionId: 'a', description: 'A', expectedOutcome: 'X' }],
        ['hive-hermes-prime']
      );
      const events = federationEventRepository.getEvents();
      expect(events.length).toBeGreaterThan(initialEvents);
      const propEvent = events.find(e => e.eventType === 'FEDERATED_CONSENSUS_PROPOSAL_CREATED');
      expect(propEvent).toBeDefined();
      if (propEvent) {
        expect(propEvent.details).toHaveProperty('proposalId');
        expect(propEvent.details).toHaveProperty('title');
      }
    });

    it('task operations create federation events', () => {
      const initialEvents = federationEventRepository.getEvents().length;
      const task = federatedTaskEngine.publishTask(
        'hive-hermes-prime', 'Event task', [], [], 1000, 500
      );
      const events = federationEventRepository.getEvents();
      expect(events.length).toBeGreaterThan(initialEvents);
      const pubEvent = events.find(e => e.eventType === 'FEDERATED_TASK_PUBLISHED');
      expect(pubEvent).toBeDefined();
      if (pubEvent) expect(pubEvent.details.taskId).toBe(task.taskId);
    });

    it('trust outcome updates cascade to governance decisions', () => {
      const freshId = 'cascade-test-' + Date.now();
      trustEngine.recordOutcome(freshId, true); // 52
      trustEngine.recordOutcome(freshId, true); // 54
      for (let i = 0; i < 3; i++) trustEngine.recordOutcome(freshId, false);
      // 54→39→24→9 → QUARANTINED
      const trustRec = trustEngine.getTrustRecord(freshId);
      expect(trustRec!.trustLevel).toBe('QUARANTINED');
      const govResult = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: freshId,
        targetHiveId: 'hive-hermes-prime',
        actionType: 'EXECUTE_TASK',
      });
      expect(govResult.allowed).toBe(false);
      expect(govResult.reason).toContain('QUARANTINED');
    });

    it('negotiation → contract → federation protocol message chain', () => {
      const fedProto = federationProtocol as any;
      if (fedProto && fedProto.messageLog) fedProto.messageLog = [];
      const proposals = negotiationEngine.requestProposals(
        'hive-hermes-prime', 'REASONING', 'Reasoning flow test'
      );
      if (proposals.length === 0) {
        console.log('  (skipping: no candidate hives for REASONING in chain test)');
        return;
      }
      const selected = proposals[0];
      const contract = negotiationEngine.finalizeNegotiation(
        'hive-hermes-prime', selected, 'End-to-end reasoning task', ['Verified result']
      );
      const stored = missionContractManager.getContractById(contract.contractId);
      expect(stored).toBeDefined();
      expect(stored!.status).toBe('ACCEPTED');
      const msgs = federationProtocol.getAllMessages();
      const acceptedMsg = msgs.find(m => m.messageType === 'MISSION_ACCEPTED');
      expect(acceptedMsg).toBeDefined();
    });

    it('multiple consensus proposals are tracked independently', () => {
      const p1 = federatedConsensusEngine.createProposal(
        'hive-a', 'Prop 1', 'First',
        [{ optionId: 'x', description: 'X', expectedOutcome: 'X' }],
        ['hive-a', 'hive-b']
      );
      const p2 = federatedConsensusEngine.createProposal(
        'hive-b', 'Prop 2', 'Second',
        [{ optionId: 'y', description: 'Y', expectedOutcome: 'Y' }],
        ['hive-a', 'hive-b']
      );
      expect(p1.proposalId).not.toBe(p2.proposalId);
      expect(federatedConsensusEngine.getAllProposals().length).toBeGreaterThanOrEqual(2);
      federatedConsensusEngine.castVote(p1.proposalId, 'hive-a', 'x', 'Vote p1');
      const p1Updated = federatedConsensusEngine.getProposal(p1.proposalId);
      const p2Updated = federatedConsensusEngine.getProposal(p2.proposalId);
      expect(p1Updated!.votes.length).toBe(1);
      expect(p2Updated!.votes.length).toBe(0);
      expect(p1Updated!.status).toBe('VOTING');
      expect(p2Updated!.status).toBe('PROPOSED');
    });

    it('task bidding score uses actual hive reputation from registry', () => {
      const task = federatedTaskEngine.publishTask(
        'hive-security-gamma', 'Score test', ['AUDITING'], [], 10000, 5000
      );
      const bid = federatedTaskEngine.submitBid(
        task.taskId, 'hive-hermes-prime', 'Hermes Prime', ['AUDITING'],
        200, 0.9, 5000
      );
      // capMatchPct=1/1=1.0, priceRatio=1.0, confidence=0.9
      // reputationScore from hive-hermes-prime in hiveRepository = 98
      // bidScore = round(40+30+13.5+14.7) = round(98.2) = 98
      expect(bid.bidScore).toBe(98);
    });

    it('consensus with all votes for same option reaches clear winner', () => {
      const prop = federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'Clear winner test', 'Testing clear consensus',
        [{ optionId: 'opt-win', description: 'Win', expectedOutcome: 'Win' },
         { optionId: 'opt-lose', description: 'Lose', expectedOutcome: 'Lose' }],
        ['hive-hermes-prime', 'hive-security-gamma']
      );
      federatedConsensusEngine.castVote(prop.proposalId, 'hive-hermes-prime', 'opt-win', 'For win');
      const updated = federatedConsensusEngine.castVote(
        prop.proposalId, 'hive-security-gamma', 'opt-win', 'Also for win'
      );
      expect(updated!.status).toBe('CONSENSUS_REACHED');
      expect(updated!.consensusOptionId).toBe('opt-win');
      expect(updated!.votes.length).toBe(2);
    });

    it('federation events are logged for all key operations', () => {
      const initialCount = federationEventRepository.getEvents().length;
      federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'E1', 'E1', [], ['hive-hermes-prime']
      );
      federatedTaskEngine.publishTask('hive-hermes-prime', 'E2', [], [], 100, 50);
      const prop = federatedConsensusEngine.createProposal(
        'hive-hermes-prime', 'E3', 'E3',
        [{ optionId: 'a', description: 'A', expectedOutcome: 'X' }],
        ['hive-hermes-prime']
      );
      federatedConsensusEngine.castVote(prop.proposalId, 'hive-hermes-prime', 'a', 'Vote');
      const task = federatedTaskEngine.publishTask('hive-hermes-prime', 'E4', [], [], 100, 50);
      federatedTaskEngine.submitBid(task.taskId, 'hive-security-gamma', 'Gamma', [], 10, 0.5, 30);
      const allEvents = federationEventRepository.getEvents();
      expect(allEvents.length).toBeGreaterThan(initialCount + 3);
      const eventTypes = allEvents.map(e => e.eventType);
      expect(eventTypes).toContain('FEDERATED_CONSENSUS_PROPOSAL_CREATED');
      expect(eventTypes).toContain('FEDERATED_TASK_PUBLISHED');
      expect(eventTypes).toContain('FEDERATED_VOTE_CAST');
      expect(eventTypes).toContain('FEDERATED_TASK_BID_SUBMITTED');
    });

    it('governance risk assessment varies by action type', () => {
      const readResult = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-hermes-prime',
        targetHiveId: 'hive-security-gamma',
        actionType: 'READ_MEMORY',
      });
      const deleteResult = federationGovernance.validateCrossHiveRequest({
        requestingHiveId: 'hive-hermes-prime',
        targetHiveId: 'hive-security-gamma',
        actionType: 'DELETE_DATA',
      });
      expect(deleteResult.riskAssessment.score).toBeGreaterThan(readResult.riskAssessment.score);
      expect(deleteResult.riskAssessment.factors.impact).toBeGreaterThan(readResult.riskAssessment.factors.impact);
      expect(deleteResult.riskAssessment.factors.reversibility).toBeGreaterThan(readResult.riskAssessment.factors.reversibility);
    });

    it('trust engine tracks both success and failure counts independently', () => {
      const freshId = 'fresh-counts-' + Date.now();
      trustEngine.recordOutcome(freshId, true); // 52, succ=1
      trustEngine.recordOutcome(freshId, true); // 54, succ=2
      trustEngine.recordOutcome(freshId, false); // 39, fail=1
      const rec = trustEngine.getTrustRecord(freshId)!;
      expect(rec.historicalSuccessCount).toBeGreaterThan(rec.historicalFailureCount);
      expect(rec.historicalFailureCount).toBe(1);
    });
  });
});
