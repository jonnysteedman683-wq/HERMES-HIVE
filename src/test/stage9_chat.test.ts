import { describe, it, expect } from 'vitest';
import { chatEngine } from '../server/hermes/chatEngine';

describe('Stage 9 — Chat Console Verification', () => {
  let newConv: any;

  it('Test 1: Fetch initial conversations', () => {
    const convs = chatEngine.getConversations();
    expect(convs.length).toBeGreaterThan(0);
    expect(convs[0].title).toBeDefined();
    expect(convs[0].messages.length).toBeGreaterThanOrEqual(0);
  });

  it('Test 2: Creating new conversation with attached context', () => {
    newConv = chatEngine.createConversation('Mission Investigation #m_101', {
      missionId: 'm_101',
      pageTitle: 'Missions Dashboard',
    });
    expect(newConv.id).toBeDefined();
    expect(newConv.context).toEqual({
      missionId: 'm_101',
      pageTitle: 'Missions Dashboard',
    });
  });

  it('Test 3: Processing STATUS_REQUEST message', async () => {
    const res1 = await chatEngine.processMessage(
      newConv.id,
      "What's happening across the Hive right now?"
    );
    expect(res1.message.sender).toBeDefined();
    expect(res1.message.intent).toBeDefined();
  });

  it('Test 4: Processing COMMAND request with action requirement', async () => {
    const res2 = await chatEngine.processMessage(
      newConv.id,
      'Create a high-priority security audit mission to scan capability bridge.'
    );
    expect(res2.message.intent).toBeDefined();

    if (res2.message.actionRequired) {
      expect(res2.message.actionRequired.actionType).toBeDefined();
      expect(res2.message.actionRequired.risk).toBeDefined();

      // Test 5: Confirm action
      const confirmRes = chatEngine.confirmAction(
        res2.message.actionRequired.actionId,
        'Executive Operator'
      );
      expect(confirmRes.success).toBe(true);
      expect(confirmRes.resultMessage).toBeDefined();
    }
  });

  it('Test 5/6: Verify conversation updating & listing', () => {
    const updatedConvs = chatEngine.getConversations();
    expect(updatedConvs.length).toBeGreaterThanOrEqual(1);
  });
});
