import { performanceTestRunner } from '../utils/PerformanceTestRunner';

describe('performanceTestRunner', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('runComprehensiveTest returns a complete report snapshot', async () => {
    const runner: any = performanceTestRunner;
    const spies = [
      jest.spyOn(runner, 'simulateAppInitialization').mockResolvedValue(undefined),
      jest.spyOn(runner, 'simulateAuthCheck').mockResolvedValue(undefined),
      jest.spyOn(runner, 'simulateDataLoading').mockResolvedValue(undefined),
      jest.spyOn(runner, 'simulateUIRendering').mockResolvedValue(undefined),
      jest.spyOn(runner, 'simulateComponentRender').mockResolvedValue(undefined),
      jest.spyOn(runner, 'simulateUserInteraction').mockResolvedValue(undefined),
    ];

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const report = await performanceTestRunner.runComprehensiveTest('dashboard-perf');

    expect(report.testName).toBe('dashboard-perf');
    expect(report.metrics.startupTime).toBeGreaterThanOrEqual(0);
    expect(report.metrics.memoryUsage).toBeDefined();
    expect(report.metrics.batteryUsage).toBeDefined();
    expect(report.metrics.networkUsage).toBeDefined();
    expect(report.metrics.renderTime).toBeGreaterThanOrEqual(0);
    expect(report.metrics.interactionTime).toBeGreaterThanOrEqual(0);
    expect(report.summary).toContain('Startup');
    expect(report.timestamp).toBeInstanceOf(Date);

    spies.forEach(spy => spy.mockRestore());
    randomSpy.mockRestore();
  });

  test('compareWithBaseline detects regressions and improvements', () => {
    const baseline = {
      startupTime: 3000,
      memoryUsage: 150,
      batteryUsage: 5,
      renderTime: 400,
    };

    const metrics = {
      startupTime: 2500,
      memoryUsage: {
        peakMemory: 180,
        averageMemory: 190,
        memoryLeaks: true,
        garbageCollections: 8,
      },
      batteryUsage: {
        batteryDrainPerHour: 7,
        cpuUsage: 25,
        backgroundUsage: 3,
      },
      renderTime: 350,
    };

    const result = performanceTestRunner.compareWithBaseline(metrics, baseline);

    expect(result.hasRegressions).toBe(true);
    expect(result.regressions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: 'memoryUsage' }),
        expect.objectContaining({ metric: 'batteryUsage' }),
      ])
    );
    expect(result.improvements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: 'startupTime' }),
      ])
    );
  });

  test('checkPerformanceThresholds raises alerts for extreme values', () => {
    const alerts = performanceTestRunner.checkPerformanceThresholds({
      startupTime: 6000,
      memoryUsage: {
        peakMemory: 220,
        averageMemory: 240,
        memoryLeaks: false,
        garbageCollections: 7,
      },
      batteryUsage: {
        batteryDrainPerHour: 9,
        cpuUsage: 20,
        backgroundUsage: 4,
      },
    });

    expect(alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: 'startupTime' }),
        expect.objectContaining({ metric: 'memoryUsage' }),
        expect.objectContaining({ metric: 'batteryUsage' }),
      ])
    );
  });
});
