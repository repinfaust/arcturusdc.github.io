import { testOrchestrator } from '../utils/TestOrchestrator';
import { QUICK_TEST_CONFIG } from '../comprehensive-test-config';

jest.setTimeout(60000);

describe('Real TestOrchestrator Execution', () => {
  test('executes the quick suite and returns a structured summary', async () => {
    const result = await testOrchestrator.executeTestSuite(QUICK_TEST_CONFIG as any);

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalTests).toBeGreaterThan(0);
    expect(result.summary.passed).toBeGreaterThanOrEqual(0);
    expect(result.summary.failed).toBeGreaterThanOrEqual(0);
    expect(result.summary.successRate).toBeGreaterThanOrEqual(0);
    expect(result.summary.successRate).toBeLessThanOrEqual(100);

    expect(Array.isArray(result.detailedResults)).toBe(true);
    expect(result.coverage).toBeDefined();
    expect(result.performance).toBeDefined();
    expect(result.accessibility).toBeDefined();
    expect(result.security).toBeDefined();

    // Reset state so later tests start from a clean slate
    testOrchestrator.reset();
  });
});
