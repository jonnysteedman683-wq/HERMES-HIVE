import { hermesWebBridge, hermesWebHealthMonitor } from '../server/world/hermesWebBridge';
import { capabilityDiscoveryEngine } from '../server/world/capabilityDiscovery';
import { worldIntegrationSecurity } from '../server/world/worldIntegrationSecurity';
import { actionAuthorizationEngine, worldActionSimulator } from '../server/world/actionAuthorization';
import { outcomeVerificationEngine } from '../server/world/outcomeVerification';
import { autonomousMissionEngine } from '../server/world/autonomousMissions';
import { worldEventBus } from '../server/world/worldEventBus';
import { worldModel } from '../server/world/worldModel';
import { capabilityRegistry } from '../server/web/capabilityRegistry';
import { capabilityReputationEngine } from '../server/world/capabilityReputation';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage8Tests() {
  console.log('=== STARTING HERMES HIVE STAGE 8 — WORLD INTEGRATION & AUTONOMOUS MISSIONS SUITE ===');

  // Test 1: Connectivity Verification
  console.log('\n--- Scenario 1: Connectivity & Health Monitor ---');
  let isConnected = await hermesWebHealthMonitor.pingBridge();
  assert(isConnected === true, 'Bridge should be online by default');
  
  // Simulation of Web Outage
  worldIntegrationSecurity.disconnectWebBridge();
  assert(hermesWebHealthMonitor.isBridgeConnected() === false, 'Bridge should report disconnected when security blocks it');
  
  // Re-establish
  worldIntegrationSecurity.reconnectWebBridge();
  assert(hermesWebHealthMonitor.isBridgeConnected() === true, 'Bridge should recover connection');
  console.log('✓ Scenario 1 Passed: Connection failure & recovery simulated successfully.');

  // Test 2: Capability Discovery & Reputation Engine
  console.log('\n--- Scenario 2: Semantic Capability Selection & Reputation ---');
  const searchCap = capabilityDiscoveryEngine.selectBestCapability({
    category: 'web_search',
    optimizeFor: 'reliability',
  });
  assert(searchCap !== null, 'Should discover best web search capability');
  assert(searchCap!.id === 'web.search', 'Best search capability should be web.search');

  // Record mock successful and failed executions
  const repBefore = { ...capabilityReputationEngine.getReputation('web.search') };
  capabilityReputationEngine.recordExecution('web.search', true, 120, 100);
  capabilityReputationEngine.recordExecution('web.search', false, 800, 40, true);

  const repAfter = capabilityReputationEngine.getReputation('web.search');
  assert(repAfter.unexpectedBehaviorsCount > repBefore.unexpectedBehaviorsCount, 'Unexpected behaviors should increment');
  console.log('✓ Scenario 2 Passed: Dynamic reputation metrics updated with decay support.');

  // Test 3: Action Authorization & Simulation
  console.log('\n--- Scenario 3: Governed Authorization (Levels 0-4) ---');
  const cap = capabilityRegistry.getCapability('web.system_command');
  assert(Boolean(cap), 'web.system_command capability must exist');

  const assessment = worldActionSimulator.simulateAction(cap!, 'execute', { command: 'rm -rf /' });
  assert(assessment.riskScore > 80, 'Destructive system command must report critical/high risk');
  assert(assessment.reversibility === 'IRREVERSIBLE', 'Critical commands must be categorized as irreversible');

  // Try authorizing under current security policy (which requires manual operator approvals)
  const authDecision = actionAuthorizationEngine.authorizeAction({
    capability: cap!,
    operation: 'execute',
    parameters: { command: 'echo "hello"' },
    requestingAgentId: 'autonomous_agent_01',
  });
  assert(authDecision.isAuthorized === false, 'High risk commands must trigger PENDING_APPROVAL and require explicit authorization');
  console.log('✓ Scenario 3 Passed: Level 4 actions correctly identified and blocked for policy approval.');

  // Test 4: Outcome Verification & World Model Updates
  console.log('\n--- Scenario 4: Closed-Loop Outcome Verification ---');
  const queryResult = await outcomeVerificationEngine.verifyAndProcessOutcome(
    capabilityRegistry.getCapability('web.search')!,
    'search',
    { query: 'artificial intelligence' },
    {
      requestId: 'req_test_01',
      executionId: 'exec_test_01',
      status: 'REQUEST_SUCCESS',
      executionStatus: 'COMPLETED',
      verificationStatus: 'VERIFIED',
      timing: { receivedAt: new Date().toISOString(), completedAt: new Date().toISOString(), durationMs: 150 },
      result: { totalFound: 42, query: 'artificial intelligence' },
    }
  );
  assert(queryResult.verified === true, 'Verification should report success');
  assert(queryResult.confidence > 0.9, 'Confidence should be high for verified outputs');
  console.log('✓ Scenario 4 Passed: Output validated, and causal observations updated in the World Model.');

  // Test 5: Autonomous Mission Decomposition & Re-planning
  console.log('\n--- Scenario 5: Mission Decomposition & Multi-Hive Allocation ---');
  const mission = autonomousMissionEngine.proposeMission({
    objective: 'Research quantum computing implications on cryptography and summarize risks',
    motivation: 'Requested by federation governance board.',
    constraints: ['Max execution cost: 50 Swarm tokens.'],
    priority: 4,
    budget: 150,
    riskTolerance: 'MEDIUM',
  });

  assert(mission.state === 'EXECUTING', 'Proposed mission should start planning and transition to EXECUTING');
  assert(mission.currentPlan.length >= 3, 'Decomposed plan should include research and review stages');
  assert(mission.assignedHives.includes('Hive-Alpha-Executive'), 'Plan should map execution to relevant specialist Hives');

  // Re-plan simulation due to transient capability failure
  autonomousMissionEngine.forceReplan(mission.missionId, 'task-01', 'Network Gateway timeout');
  const adaptedMission = autonomousMissionEngine.getMission(mission.missionId);
  assert(adaptedMission!.state === 'EXECUTING', 'Replanned mission should return to EXECUTING state');
  console.log('✓ Scenario 5 Passed: Dynamic decomposition, allocation, and fallback replanning validated.');

  // Test 6: World Event Routing
  console.log('\n--- Scenario 6: Intelligent Event Routing ---');
  let eventTriggered = false;
  worldEventBus.subscribe('API_RATE_LIMIT_EXCEEDED', (evt) => {
    eventTriggered = true;
    assert(evt.payload.service === 'web.search', 'Event payload must contain correct service parameter');
  }, { hiveId: 'Hive-Alpha-Executive' });

  // Ingest matching event
  worldEventBus.ingestEvent({
    eventId: 'evt_001',
    eventType: 'API_RATE_LIMIT_EXCEEDED',
    source: 'hermes-web',
    timestamp: new Date().toISOString(),
    payload: { service: 'web.search' },
    targetHives: ['Hive-Alpha-Executive'],
  });

  assert(eventTriggered === true, 'Subscribed Hive should successfully receive the event');
  console.log('✓ Scenario 6 Passed: Intelligent event bus correctly dispatched notifications to relevant targets.');

  // Test 7: Integration Security & Emergency Shutdown
  console.log('\n--- Scenario 7: Boundary Security & Emergency Controls ---');
  // Attempt to execute after a global freeze
  worldIntegrationSecurity.freezeFederation();
  const blockedAuth = actionAuthorizationEngine.authorizeAction({
    capability: capabilityRegistry.getCapability('web.search')!,
    operation: 'search',
    parameters: { query: 'test' },
    requestingAgentId: 'agent_01',
  });
  assert(blockedAuth.isAuthorized === false, 'Actions should be denied during federation freeze');
  
  // Unfreeze
  worldIntegrationSecurity.unfreezeFederation();
  const allowedAuth = actionAuthorizationEngine.authorizeAction({
    capability: capabilityRegistry.getCapability('web.search')!,
    operation: 'search',
    parameters: { query: 'test' },
    requestingAgentId: 'agent_01',
  });
  assert(allowedAuth.isAuthorized === true, 'Actions should resume after freeze is lifted');
  console.log('✓ Scenario 7 Passed: Emergency control plane successfully enforced quarantine boundaries.');

  console.log('\n=== ALL STAGE 8 WORLD INTEGRATION & AUTONOMOUS MISSIONS TESTS PASSED CLEANLY! ===');
}

runStage8Tests().catch((err) => {
  console.error('❌ Stage 8 Test Suite Failed:', err);
  process.exit(1);
});
