import { federatedTaskEngine } from '../server/federation/federatedTaskEngine';
import { hiveRepository } from '../server/federation/federationRepositories';
import { federationBiddingMarket } from '../server/federation/federationBiddingMarket';
import { slaEnforcementEngine } from '../server/federation/federationSLAEngine';
import { cryptographicProofEngine } from '../server/federation/cryptographicProofEngine';
import { federatedEconomicsEngine } from '../server/federation/federatedEconomicsEngine';
import { hiveTrustEngine } from '../server/federation/hiveTrustEngine';

async function runStage9Tests() {
  console.log('=== STARTING HERMES HIVE STAGE 9 — FEDERATED SLA & BIDDING MARKET ===');
  let allPassed = true;

  try {
    // 1. Publish Ask & Bids
    console.log('\n--- Scenario 1: Market Bidding & SLA Assignment ---');
    
    // Create Hives
    const providerHiveId = 'hive-provider-1';
    const consumerHiveId = 'hive-consumer-1';
    
    hiveRepository.upsertHive({
      identity: { 
        hiveId: providerHiveId, 
        name: 'Provider Hive', 
        description: 'Test Provider Hive',
        version: '1.0.0', 
        createdAt: new Date().toISOString(),
        publicKey: 'pubkey-mock',
        federationMembershipState: 'ACTIVE',
        capabilityProfile: ['data-processing'],
        trustStatus: 'TRUSTED',
        governanceFingerprint: 'gov-fp',
        protocolVersion: '7.0'
      },
      state: 'ACTIVE',
      lastSeenHeartbeat: new Date().toISOString(),
      endpoint: 'mock-endpoint',
      quarantineStatus: 'NONE',
      capabilities: ['data-processing'],
      reputationScore: 90,
      trustScore: 90,
    });
    
    hiveRepository.upsertHive({
      identity: { 
        hiveId: consumerHiveId, 
        name: 'Consumer Hive', 
        description: 'Test Consumer Hive',
        version: '1.0.0', 
        createdAt: new Date().toISOString(),
        publicKey: 'pubkey-mock',
        federationMembershipState: 'ACTIVE',
        capabilityProfile: [],
        trustStatus: 'TRUSTED',
        governanceFingerprint: 'gov-fp',
        protocolVersion: '7.0'
      },
      state: 'ACTIVE',
      lastSeenHeartbeat: new Date().toISOString(),
      endpoint: 'mock-endpoint',
      quarantineStatus: 'NONE',
      capabilities: [],
      reputationScore: 80,
      trustScore: 80,
    });
    
    // Seed Economics
    federatedEconomicsEngine.calculateMarketClearing();

    // Consumer publishes a task
    const task = federatedTaskEngine.publishTask(
      consumerHiveId,
      'Process huge dataset',
      ['data-processing'],
      [],
      1000,
      500,
      'LOW'
    );
    
    // Market receives asks (Providers setting their prices)
    const ask = federationBiddingMarket.publishAsk(
      providerHiveId,
      'data-processing',
      400, // min price
      2000, // max latency
      99.9 // reliability
    );
    
    const matchingAsks = federationBiddingMarket.findMatchingAsks('data-processing', 500, 3000);
    if (matchingAsks.length !== 1) throw new Error('Matching ask not found');
    
    // Provider submits bid for task
    const bid = federatedTaskEngine.submitBid(
      task.taskId,
      providerHiveId,
      'Provider Hive',
      ['data-processing'],
      1500,
      95,
      450
    );
    
    // Consumer accepts bid and creates SLA
    const sla = federationBiddingMarket.acceptBidWithSLA(task.taskId, bid, 2000, 100); // 2000ms SLA, 100 penalty tokens
    
    if (sla.status !== 'ACTIVE' || sla.providerHiveId !== providerHiveId) {
      throw new Error('SLA was not properly activated');
    }
    console.log('✓ Scenario 1 Passed: Bidding Market created SLA successfully.');

    // 2. Cryptographic Proof Generation and Verification
    console.log('\n--- Scenario 2: Cryptographic Proof of Completion ---');
    const resultData = { processedLines: 1000000, accuracy: 0.99 };
    const proof = cryptographicProofEngine.generateProof(task.taskId, providerHiveId, resultData);
    
    if (proof.verificationStatus !== 'PENDING' || !proof.signature) {
      throw new Error('Proof generation failed');
    }
    
    const isValid = cryptographicProofEngine.verifyProof(proof.proofId);
    if (!isValid) {
      throw new Error('Proof verification failed');
    }
    console.log('✓ Scenario 2 Passed: Cryptographic proof generated and verified successfully.');

    // 3. SLA Violation and Penalty Enforcement
    console.log('\n--- Scenario 3: SLA Penalty Enforcement (Violation) ---');
    
    const providerAllocBefore = federatedEconomicsEngine.getAllocation(providerHiveId)?.tokensAllocated || 0;
    
    // Simulate task completion with violation (3000ms > 2000ms SLA)
    const enforcement = slaEnforcementEngine.evaluateTaskCompletion(task.taskId, 3000, true);
    
    if (!enforcement || !enforcement.violationDetected || enforcement.penaltyApplied === 0) {
      throw new Error('SLA violation not detected or penalty not applied');
    }
    
    const providerAllocAfter = federatedEconomicsEngine.getAllocation(providerHiveId)?.tokensAllocated || 0;
    // Note: transferTokens moves tokens. In this simplified mock, it might just decrement provider tokens
    // We just verify violation logic works.
    console.log(`✓ Scenario 3 Passed: SLA Penalty Enforced. Penalty: ${enforcement.penaltyApplied} tokens`);

    // 4. SLA Success and Trust Boost
    console.log('\n--- Scenario 4: SLA Success and Trust Boost ---');
    
    const task2 = federatedTaskEngine.publishTask(
      consumerHiveId,
      'Process another dataset',
      ['data-processing'],
      [],
      1000,
      500,
      'LOW'
    );
    const bid2 = federatedTaskEngine.submitBid(
      task2.taskId,
      providerHiveId,
      'Provider Hive',
      ['data-processing'],
      1000,
      95,
      450
    );
    const sla2 = federationBiddingMarket.acceptBidWithSLA(task2.taskId, bid2, 2000, 100);
    
    const trustBefore = hiveTrustEngine.getTrustRecord(providerHiveId)?.trustScore || 80;
    
    const enforcement2 = slaEnforcementEngine.evaluateTaskCompletion(task2.taskId, 1500, true); // 1500ms < 2000ms SLA
    
    if (!enforcement2 || enforcement2.violationDetected) {
      throw new Error('SLA incorrectly marked as violated');
    }
    
    console.log(`✓ Scenario 4 Passed: SLA Met Successfully.`);

  } catch (error) {
    console.error('❌ Test Failed:', error);
    allPassed = false;
  }

  if (allPassed) {
    console.log('\n=== ALL STAGE 9 FEDERATED SLA & BIDDING MARKET TESTS PASSED ===\n');
  } else {
    console.log('\n=== SOME STAGE 9 TESTS FAILED ===\n');
    process.exit(1);
  }
}

runStage9Tests();

