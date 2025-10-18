import { accessibilityTester } from '../utils/AccessibilityTester';

describe('accessibilityTester', () => {
  afterEach(() => {
    accessibilityTester.reset();
    jest.restoreAllMocks();
  });

  test('runAccessibilityAudit returns a rich report and stores history', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const report = await accessibilityTester.runAccessibilityAudit('GiftFormScreen');

    expect(report.testName).toBe('GiftFormScreen');
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.warnings.length).toBeGreaterThanOrEqual(0);
    expect(report.violations.length).toBeGreaterThanOrEqual(0);
    expect(report.summary).toMatch(/accessibility/i);

    const history = accessibilityTester.getTestHistory('GiftFormScreen');
    expect(history).toHaveLength(1);

    randomSpy.mockRestore();
  });

  test('runComprehensiveAccessibilityTest aggregates component scores', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);

    const result = await accessibilityTester.runComprehensiveAccessibilityTest([
      'GiftFormScreen',
      'HomeScreen',
    ]);

    expect(result.componentReports).toHaveLength(2);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.summary).toContain('Overall accessibility');

    randomSpy.mockRestore();
  });
});
