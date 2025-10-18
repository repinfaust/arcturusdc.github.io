import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { configType, testRunId } = await request.json();

    if (!configType || !testRunId) {
      return NextResponse.json({ error: 'Missing configType or testRunId' }, { status: 400 });
    }

    const validConfigs = ['quick', 'critical', 'comprehensive'];
    if (!validConfigs.includes(configType)) {
      return NextResponse.json({ error: 'Invalid configType' }, { status: 400 });
    }

    console.log(`🚀 Starting test execution: ${configType} (${testRunId})`);

    // Start the test execution (simulation mode for now)
    simulateTestExecution(configType, testRunId);

    return NextResponse.json({
      success: true,
      testRunId,
      configType,
      message: 'Test execution started',
    }, { status: 202 });

  } catch (error) {
    console.error('Failed to start test execution:', error);
    return NextResponse.json({
      error: 'Failed to start test execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Optional: make GET clearly not allowed (helps debugging vs 404)
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

// Test execution simulation function
async function simulateTestExecution(configType: string, testRunId: string) {
  console.log(`🎭 Starting simulation for ${configType} (${testRunId})`);

  const testCounts = { quick: 45, critical: 89, comprehensive: 135 };
  const totalTests = testCounts[configType as keyof typeof testCounts] || 45;
  const duration = configType === 'comprehensive' ? 30000 : configType === 'critical' ? 15000 : 8000;
  const steps = 20;
  const stepDuration = duration / steps;

  for (let i = 0; i <= steps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepDuration));

    const progress = (i / steps) * 100;
    const passed = Math.floor((i / steps) * totalTests * 0.95);
    const failed = Math.floor((i / steps) * totalTests * 0.05);

    const progressData = {
      testRunId,
      progress,
      completed: i === steps,
      passed,
      failed,
      status: i === steps ? (failed > 0 ? 'failed' : 'completed') : 'running',
      currentPhase: i === steps ? 'Completed' : `Running tests... (${Math.floor(progress)}%)`,
      startTime: new Date().toISOString(),
    };

    if (i === steps) {
      progressData.endTime = new Date().toISOString();
    }

    saveProgressData(testRunId, progressData);

    console.log(`🎭 Progress: ${progress.toFixed(1)}% (${passed}/${totalTests} passed)`);
  }

  console.log(`🎭 Simulation completed for ${testRunId}`);
}

function saveProgressData(testRunId: string, data: any) {
  try {
    const progressDir = path.join(process.cwd(), 'test-progress');
    if (!fs.existsSync(progressDir)) {
      fs.mkdirSync(progressDir, { recursive: true });
    }

    const progressFile = path.join(progressDir, `${testRunId}.json`);
    fs.writeFileSync(progressFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save progress data:', error);
  }
}

function saveResultsData(testRunId: string, data: any) {
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
