import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { configType, testRunId } = await request.json();

    if (!configType || !testRunId) {
      return NextResponse.json({ error: 'Missing configType or testRunId' }, { status: 400 });
    }

    const validConfigs = ['quick', 'critical', 'comprehensive'];
    if (!validConfigs.includes(configType)) {
      return NextResponse.json({ error: 'Invalid configType' }, { status: 400 });
    }

    console.log(`🚀 Starting REAL test execution: ${configType} (${testRunId})`);

    // Execute the REAL test suite
    executeRealTestSuite(configType, testRunId);

    return NextResponse.json({
      success: true,
      testRunId,
      configType,
      message: 'Real test execution started',
    }, { status: 202 });

  } catch (error) {
    console.error('Failed to start test execution:', error);
    return NextResponse.json({
      error: 'Failed to start test execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

async function executeRealTestSuite(configType, testRunId) {
  try {
    console.log(`🧪 Importing real test orchestrator...`);
    
    // Import the REAL test orchestrator and configs
    const { testOrchestrator } = await import('../../../../__tests__/utils/TestOrchestrator');
    const { COMPREHENSIVE_TEST_CONFIG, QUICK_TEST_CONFIG, CRITICAL_TEST_CONFIG } = 
      await import('../../../../__tests__/comprehensive-test-config');

    const configs = {
      comprehensive: COMPREHENSIVE_TEST_CONFIG,
      quick: QUICK_TEST_CONFIG,
      critical: CRITICAL_TEST_CONFIG,
    };

    const testConfig = configs[configType];
    if (!testConfig) {
      throw new Error(`Unknown test configuration: ${configType}`);
    }

    console.log(`🧪 Executing REAL ${configType} test suite with ${
      (testConfig.unitTests?.length || 0) +
      (testConfig.integrationTests?.length || 0) +
      (testConfig.e2eTests?.length || 0) +
      (testConfig.performanceTests?.length || 0) +
      (testConfig.accessibilityTests?.length || 0) +
      (testConfig.securityTests?.length || 0)
    } tests`);

    // Initialize progress tracking
    const initialProgress = {
      testRunId,
      progress: 0,
      completed: false,
      passed: 0,
      failed: 0,
      startTime: new Date().toISOString(),
      status: 'running',
    };
    saveProgressData(testRunId, initialProgress);

    // Execute the REAL comprehensive test suite
    const testSuiteResult = await testOrchestrator.executeTestSuite(testConfig);

    console.log(`✅ REAL test suite completed: ${testSuiteResult.summary.successRate.toFixed(1)}% success rate`);

    // Save final results
    const finalProgress = {
      testRunId,
      progress: 100,
      completed: true,
      passed: testSuiteResult.summary.passed,
      failed: testSuiteResult.summary.failed,
      endTime: new Date().toISOString(),
      status: testSuiteResult.summary.failed > 0 ? 'failed' : 'completed',
    };
    saveProgressData(testRunId, finalProgress);

    // Save detailed results
    const finalResults = {
      testRunId,
      summary: testSuiteResult.summary,
      coverage: testSuiteResult.coverage,
      performance: testSuiteResult.performance,
      accessibility: testSuiteResult.accessibility,
      security: testSuiteResult.security,
      recommendations: testSuiteResult.recommendations,
      detailedResults: testSuiteResult.detailedResults,
      completed: true,
    };
    saveResultsData(testRunId, finalResults);

  } catch (error) {
    console.error(`❌ REAL test suite execution failed:`, error);
    
    const errorProgress = {
      testRunId,
      progress: 0,
      completed: true,
      passed: 0,
      failed: 1,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    saveProgressData(testRunId, errorProgress);
  }
}

function saveProgressData(testRunId, data) {
  try {
    const progressDir = path.join(process.cwd(), 'test-progress');
    if (!fs.existsSync(progressDir)) {
      fs.mkdirSync(progressDir, { recursive: true });
    }
    const progressFile = path.join(progressDir, `${testRunId}.json`);
    fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
    console.log(`💾 Progress saved: ${data.progress}% (${data.passed}/${data.passed + data.failed} tests)`);
  } catch (error) {
    console.error('Failed to save progress data:', error);
  }
}

function saveResultsData(testRunId, data) {
  try {
    const reportsDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const reportFile = path.join(reportsDir, `${testRunId}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save results data:', error);
  }
}
