#!/usr/bin/env node
/**
 * LinkedIn Morning Scout (Option B — Local Chrome / Safari Tab Bridge)
 *
 * Drives an already-open, logged-in LinkedIn Jobs tab in Google Chrome or Safari
 * via macOS AppleScript (`osascript`), steps through the visible job cards on the
 * search results page to harvest full job descriptions from the live DOM, and
 * pushes the harvested batch straight into your open Career Ops tab
 * (`https://www.arcturusdc.com/apps/stea/career` or `http://localhost:3000/apps/stea/career`).
 *
 * Usage:
 *   npm run career:scout
 *   node scripts/linkedin-morning-scout.mjs --max=10 --browser=chrome
 */

import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  })
);

const MAX_JOBS = Math.min(Math.max(Number(args.max) || 8, 1), 25);
const PREFERRED_BROWSER = (args.browser || '').toLowerCase(); // 'chrome' | 'safari' | ''
const CAREER_OPS_DEFAULT_URL = 'https://www.arcturusdc.com/apps/stea/career';

function runOsascript(script, scriptArgs = []) {
  return execFileSync('osascript', ['-e', script, ...scriptArgs], {
    encoding: 'utf8',
    maxBuffer: 25 * 1024 * 1024,
  }).trim();
}

function detectBrowserWithLinkedIn() {
  if (PREFERRED_BROWSER === 'chrome') return 'Google Chrome';
  if (PREFERRED_BROWSER === 'safari') return 'Safari';

  // Check Google Chrome first (matches David's primary Career Ops browser)
  try {
    const hasChrome = runOsascript(`
      tell application "System Events"
        if not (exists process "Google Chrome") then return "no"
      end tell
      tell application "Google Chrome"
        repeat with w in windows
          repeat with t in tabs of w
            if URL of t contains "linkedin.com/jobs" then return "yes"
          end repeat
        end repeat
      end tell
      return "no"
    `);
    if (hasChrome === 'yes') return 'Google Chrome';
  } catch {}

  // Check Safari next
  try {
    const hasSafari = runOsascript(`
      tell application "System Events"
        if not (exists process "Safari") then return "no"
      end tell
      tell application "Safari"
        repeat with w in windows
          repeat with t in tabs of w
            if URL of t contains "linkedin.com/jobs" then return "yes"
          end repeat
        end repeat
      end tell
      return "no"
    `);
    if (hasSafari === 'yes') return 'Safari';
  } catch {}

  return 'Google Chrome';
}

function execJsInBrowserTab(browser, urlSubstring, jsCode) {
  if (browser === 'Google Chrome') {
    const appleScript = `
      on run argv
        set targetSub to item 1 of argv
        set jsSource to item 2 of argv
        tell application "Google Chrome"
          repeat with w in windows
            repeat with t in tabs of w
              if URL of t contains targetSub then
                return execute t javascript jsSource
              end if
            end repeat
          end repeat
        end tell
        return "TAB_NOT_FOUND"
      end run
    `;
    return runOsascript(appleScript, [urlSubstring, jsCode]);
  } else {
    const appleScript = `
      on run argv
        set targetSub to item 1 of argv
        set jsSource to item 2 of argv
        tell application "Safari"
          repeat with w in windows
            repeat with t in tabs of w
              if URL of t contains targetSub then
                return do JavaScript jsSource in t
              end if
            end repeat
          end repeat
        end tell
        return "TAB_NOT_FOUND"
      end run
    `;
    return runOsascript(appleScript, [urlSubstring, jsCode]);
  }
}

function ensureCareerOpsTabOpen(browser) {
  if (browser === 'Google Chrome') {
    runOsascript(`
      tell application "Google Chrome"
        repeat with w in windows
          repeat with t in tabs of w
            if URL of t contains "/apps/stea/career" then
              return "FOUND"
            end if
          end repeat
        end repeat
        if (count of windows) is 0 then make new window
        tell front window to make new tab with properties {URL:"${CAREER_OPS_DEFAULT_URL}"}
        return "OPENED"
      end tell
    `);
  } else {
    runOsascript(`
      tell application "Safari"
        repeat with w in windows
          repeat with t in tabs of w
            if URL of t contains "/apps/stea/career" then
              return "FOUND"
            end if
          end repeat
        end repeat
        if (count of windows) is 0 then make new document
        tell front window to make new tab with properties {URL:"${CAREER_OPS_DEFAULT_URL}"}
        return "OPENED"
      end tell
    `);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = detectBrowserWithLinkedIn();
  console.log(`\n[LinkedIn Morning Scout] Using browser: ${browser}`);

  // 1. Discover how many job cards are visible on the open LinkedIn Jobs tab.
  const countRaw = execJsInBrowserTab(
    browser,
    'linkedin.com/jobs',
    `(function(){
      var cards = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item, li[data-occludable-job-id]');
      return String(cards.length);
    })()`
  );

  if (countRaw === 'TAB_NOT_FOUND') {
    console.error(
      `\nCould not find an open "linkedin.com/jobs" tab in ${browser}.\n` +
      `1. Open your saved LinkedIn Jobs search in ${browser}.\n` +
      (browser === 'Google Chrome'
        ? `2. In Chrome menu bar, ensure View -> Developer -> Allow JavaScript from Apple Events is ticked.\n`
        : `2. In Safari menu bar, ensure Develop -> Allow JavaScript from Apple Events is ticked.\n`) +
      `3. Re-run this script.`
    );
    process.exit(1);
  }

  const totalCards = parseInt(countRaw, 10) || 0;
  console.log(`[LinkedIn Morning Scout] Found ${totalCards} job card(s) on the open LinkedIn tab.`);

  const harvested = [];

  if (totalCards === 0) {
    // Single job view fallback
    const singleJson = execJsInBrowserTab(
      browser,
      'linkedin.com/jobs',
      `(function(){
        var t = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1');
        var c = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name');
        var l = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container, .jobs-unified-top-card__bullet');
        var b = document.querySelector('#job-details, .jobs-description__content, main');
        return JSON.stringify({
          title: t ? t.innerText.trim() : document.title,
          company: c ? c.innerText.trim() : 'LinkedIn Role',
          location: l ? l.innerText.trim().split('·')[0].trim() : '',
          url: location.href,
          jd_text: b ? b.innerText.trim().slice(0, 15000) : ''
        });
      })()`
    );
    try {
      const parsed = JSON.parse(singleJson);
      if (parsed && parsed.jd_text) harvested.push(parsed);
    } catch {}
  } else {
    const toScan = Math.min(totalCards, MAX_JOBS);
    for (let i = 0; i < toScan; i++) {
      // Click card i and scroll it into view
      execJsInBrowserTab(
        browser,
        'linkedin.com/jobs',
        `(function(){
          var cards = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item, li[data-occludable-job-id]');
          var card = cards[${i}];
          if (!card) return 'NONE';
          card.scrollIntoView({ block: 'center', behavior: 'instant' });
          var clickable = card.querySelector('a.job-card-container__link, a.job-card-list__title--link, a') || card;
          clickable.click();
          return 'CLICKED';
        })()`
      );

      // Wait for LinkedIn's right-hand JD pane to update
      await sleep(1300);

      const jobJson = execJsInBrowserTab(
        browser,
        'linkedin.com/jobs',
        `(function(){
          var cards = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item, li[data-occludable-job-id]');
          var card = cards[${i}];
          var cardTitle = card ? (card.querySelector('.job-card-list__title--link, .artdeco-entity-lockup__title, strong') || {}).innerText : '';
          var cardComp = card ? (card.querySelector('.artdeco-entity-lockup__subtitle, .job-card-container__primary-description') || {}).innerText : '';
          var cardLoc = card ? (card.querySelector('.job-card-container__metadata-item, .artdeco-entity-lockup__caption') || {}).innerText : '';
          var cardLink = card ? (card.querySelector('a[href*="/jobs/view/"]') || {}).href : '';

          var paneTitle = (document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1') || {}).innerText || '';
          var paneComp = (document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name') || {}).innerText || '';
          var jdEl = document.querySelector('#job-details, .jobs-description__content, .jobs-box__html-content');
          var jdText = jdEl ? jdEl.innerText.trim() : '';

          return JSON.stringify({
            title: (paneTitle || cardTitle || 'LinkedIn Role').replace(/\\s+/g, ' ').trim(),
            company: (paneComp || cardComp || 'Company').replace(/\\s+/g, ' ').trim(),
            location: (cardLoc || '').replace(/\\s+/g, ' ').trim(),
            url: (cardLink || location.href).split('?')[0],
            jd_text: jdText.slice(0, 15000)
          });
        })()`
      );

      try {
        const parsed = JSON.parse(jobJson);
        if (parsed && (parsed.jd_text || parsed.url)) {
          harvested.push(parsed);
          console.log(`  [${i + 1}/${toScan}] Harvested: ${parsed.title} @ ${parsed.company} (${parsed.jd_text.length} chars)`);
        }
      } catch {}
    }
  }

  if (harvested.length === 0) {
    console.log('\n[LinkedIn Morning Scout] No job descriptions found on the active tab.');
    process.exit(0);
  }

  // 2. Ensure Career Ops tab is open in the same browser and inject the harvested jobs.
  const tabState = ensureCareerOpsTabOpen(browser);
  if (tabState === 'OPENED') {
    console.log('[LinkedIn Morning Scout] Opened Career Ops tab, waiting 3s for page load...');
    await sleep(3000);
  }

  const payloadJson = JSON.stringify(harvested);
  const injectCode = `(function(){
    var jobs = ${payloadJson};
    if (typeof window.__careerOpsImportJobs === 'function') {
      return JSON.stringify(window.__careerOpsImportJobs(jobs));
    }
    window.postMessage({ type: 'CAREER_OPS_SCOUT_JOBS', jobs: jobs }, '*');
    return JSON.stringify({ ok: true, posted: jobs.length });
  })()`;

  const result = execJsInBrowserTab(browser, '/apps/stea/career', injectCode);
  console.log(`\n[LinkedIn Morning Scout] Sent ${harvested.length} role(s) to Career Ops! (${result})`);
  console.log('Switch to your Career Ops tab and click "Analyse All New" to score them.\n');
}

main().catch((err) => {
  console.error('\n[LinkedIn Morning Scout Error]:', err.message || err);
  process.exit(1);
});
