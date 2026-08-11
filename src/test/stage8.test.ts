  // Test 6: World Event Routing
  console.log('\\n--- Scenario 6: Intelligent Event Routing ---');
  let eventTriggered: boolean = false;
  worldEventBus.subscribe('API_RATE_LIMIT_EXCEEDED', (evt) => {
    eventTriggered = true;
    assert(evt.payload.service === 'web.search', 'Event payload must contain correct service parameter');
  }, { hiveId: 'Hive-Alpha-Executive' });
