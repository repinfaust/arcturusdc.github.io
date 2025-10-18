const fs = require('fs');
const path = require('path');

const PROGRESS_DIR = process.env.TEST_PROGRESS_DIR || '/tmp/test-progress';
const REPORTS_DIR  = process.env.TEST_REPORTS_DIR  || '/tmp/test-reports';
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }

class ProgressReporter {
  constructor(){ this.testRunId = process.env.TEST_RUN_ID || `run-${Date.now()}`; }
  onRunStart(){
    ensureDir(PROGRESS_DIR); ensureDir(REPORTS_DIR);
    fs.writeFileSync(path.join(PROGRESS_DIR, `${this.testRunId}.json`),
      JSON.stringify({ testRunId:this.testRunId, status:'running', progress:0, passed:0, failed:0 }, null, 2));
  }
  onTestResult(_, __, agg){
    const passed=agg.numPassedTests, failed=agg.numFailedTests, total=agg.numTotalTests||1;
    const progress=Math.round(((passed+failed)/total)*100);
    fs.writeFileSync(path.join(PROGRESS_DIR, `${this.testRunId}.json`),
      JSON.stringify({ testRunId:this.testRunId, status:'running', progress, passed, failed }, null, 2));
  }
  onRunComplete(_, results){
    const summary = {
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      total:  results.numTotalTests,
      successRate: results.numTotalTests ? (results.numPassedTests/results.numTotalTests)*100 : 0
    };
    fs.writeFileSync(path.join(REPORTS_DIR, `${this.testRunId}.json`),
      JSON.stringify({ testRunId:this.testRunId, summary, results }, null, 2));
    fs.writeFileSync(path.join(PROGRESS_DIR, `${this.testRunId}.json`),
      JSON.stringify({ testRunId:this.testRunId, status: summary.failed ? 'failed':'completed', progress:100, passed:summary.passed, failed:summary.failed }, null, 2));
  }
}
module.exports = ProgressReporter;
