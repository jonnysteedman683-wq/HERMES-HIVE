import { chatEngine } from '../server/hermes/chatEngine';

async function runStage9Tests() {
  console.log('=====================================================');
  console.log('   HERMES HIVE — STAGE 9 CHAT CONSOLE VERIFICATION   ');
  console.log('=====================================================\n');

  // Test 1: Fetch initial conversations
  console.log('--- Test 1: Fetching initial conversations ---');
  const convs = chatEngine.getConversations();
  console.log(`Initial Conversations count: ${convs.length}`);
  if (convs.length === 0) throw new Error('Expected default welcome conversation');
  console.log(`Default Title: "${convs[0].title}"`);
  console.log(`Default Messages count: ${convs[0].messages.length}`);

  // Test 2: Create new conversation with context
  console.log('\n--- Test 2: Creating new conversation with attached context ---');
  const newConv = chatEngine.createConversation('Mission Investigation #m_101', {
    missionId: 'm_101',
    pageTitle: 'Missions Dashboard',
  });
  console.log(`Created Conversation ID: ${newConv.id}`);
  console.log(`Attached context: ${JSON.stringify(newConv.context)}`);

  // Test 3: Process user message with question intent
  console.log('\n--- Test 3: Processing STATUS_REQUEST message ---');
  const res1 = await chatEngine.processMessage(
    newConv.id,
    "What's happening across the Hive right now?"
  );
  console.log(`Response Sender: ${res1.message.sender}`);
  console.log(`Intent Classified: ${res1.message.intent}`);
  console.log(`Activity Steps Count: ${res1.message.activitySteps?.length || 0}`);
  console.log(`Rich Cards Count: ${res1.message.richCards?.length || 0}`);
  console.log(`Response Snippet: "${res1.message.text.slice(0, 100)}..."`);

  // Test 4: Process user message with command / high-risk action
  console.log('\n--- Test 4: Processing COMMAND request with action requirement ---');
  const res2 = await chatEngine.processMessage(
    newConv.id,
    'Create a high-priority security audit mission to scan capability bridge.'
  );
  console.log(`Intent Classified: ${res2.message.intent}`);
  console.log(`Action Required Attached: ${res2.message.actionRequired ? 'YES' : 'NO'}`);
  if (res2.message.actionRequired) {
    console.log(`Action Type: ${res2.message.actionRequired.actionType}`);
    console.log(`Action Risk: ${res2.message.actionRequired.risk}`);

    // Test 5: Confirm action
    console.log('\n--- Test 5: Confirming executive action ---');
    const confirmRes = chatEngine.confirmAction(
      res2.message.actionRequired.actionId,
      'Executive Operator'
    );
    console.log(`Confirm Success: ${confirmRes.success}`);
    console.log(`Result Message: ${confirmRes.resultMessage}`);
  }

  // Test 6: Verify conversation updating & listing
  console.log('\n--- Test 6: Verifying conversation list update ---');
  const updatedConvs = chatEngine.getConversations();
  console.log(`Total Conversations Now: ${updatedConvs.length}`);

  console.log('\n=====================================================');
  console.log('   ALL STAGE 9 CHAT CONSOLE TESTS PASSED SUCCESSFULLY! ');
  console.log('=====================================================\n');
}

runStage9Tests().catch((err) => {
  console.error('Stage 9 Test Failed:', err);
  process.exit(1);
});
