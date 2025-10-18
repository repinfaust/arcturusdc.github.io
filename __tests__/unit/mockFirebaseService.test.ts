import { mockFirebaseService } from '../utils/MockFirebaseService';

describe('mockFirebaseService', () => {
  beforeEach(() => {
    mockFirebaseService.reset();
    mockFirebaseService.setCustomNetworkCondition({
      name: 'test',
      latency: 0,
      errorRate: 0,
      timeoutRate: 0,
    });
  });

  afterEach(() => {
    mockFirebaseService.reset();
  });

  test('writes and reads documents via collection helpers', async () => {
    const collection = mockFirebaseService.mockCollection('circles/test-circle/events');
    const ref = await collection.add({ name: 'Kickoff', status: 'scheduled' });
    const snapshot = await ref.get();

    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()).toMatchObject({ name: 'Kickoff', status: 'scheduled' });

    await ref.update({ status: 'completed' });
    const updated = await ref.get();
    expect(updated.data()).toMatchObject({ name: 'Kickoff', status: 'completed' });
  });

  test('honors offline simulation', async () => {
    const collection = mockFirebaseService.mockCollection('circles/demo/todos');

    mockFirebaseService.simulateOffline();
    await expect(collection.add({ title: 'Should fail' })).rejects.toThrow(/offline/i);
    mockFirebaseService.simulateOnline();

    await expect(collection.add({ title: 'Works again' })).resolves.toBeDefined();
  });

  test('notifies listeners for realtime updates', async () => {
    jest.useFakeTimers();
    const updates: any[] = [];
    const path = 'circles/demo/docs/doc-1';

    const unsubscribe = mockFirebaseService.onSnapshot(path, doc => {
      updates.push(doc?.data?.() ?? null);
    });

    mockFirebaseService.triggerRealtimeUpdate(path, { value: 1 });
    jest.runAllTimers();
    expect(updates).toEqual([{ value: 1 }]);

    unsubscribe();
    jest.useRealTimers();
  });
});
