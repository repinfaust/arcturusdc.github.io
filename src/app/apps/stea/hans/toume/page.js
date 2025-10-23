'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

/* ===== Firestore ===== */
import { auth, db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/* ===== Constants ===== */
const BOARD_LS_KEY = 'stea-board-v1';
const STEA_COLUMNS = ['Idea', 'Planning', 'Design', 'Build'];
const TYPE_OPTIONS = [
  { value: 'idea', label: 'Idea', emoji: '💡' },
  { value: 'feature', label: 'Feature', emoji: '✨' },
  { value: 'bug', label: 'Bug', emoji: '🐞' },
  { value: 'observation', label: 'Observation', emoji: '👀' },
  { value: 'newapp', label: 'New App', emoji: '📱' },
];
const URGENCY_MAP_FROM_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};
const DEFAULT_URGENCY = 'medium';

export default function TouMeTestersOnly() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [feedback, setFeedback] = useState('');
  const [testerName, setTesterName] = useState('');
  const [currentBuild, setCurrentBuild] = useState('');
  const [platform, setPlatform] = useState('');
  const [expandedTests, setExpandedTests] = useState({});

  // Modal state for creating a STEa card from a result/feedback
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardSeed, setCardSeed] = useState(null); // { from: 'fail'|'feedback', test? , preset: {type, urgency, title, description} }
  const [cardForm, setCardForm] = useState({
    type: 'bug',
    urgency: 'medium',
    title: '',
    description: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        const next = encodeURIComponent('/apps/stea/hans');
        router.replace(`/apps/stea?next=${next}`);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Load saved results from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('toume-test-results');
    if (saved) {
      setTestResults(JSON.parse(saved));
    }
    const savedTester = localStorage.getItem('toume-tester-name');
    if (savedTester) {
      setTesterName(savedTester);
    }
    const savedFeedback = localStorage.getItem('toume-feedback');
    if (savedFeedback) {
      setFeedback(savedFeedback);
    }
  }, []);

  // Persist helper (local)
  const saveResultsLocal = (newResults) => {
    setTestResults(newResults);
    localStorage.setItem('toume-test-results', JSON.stringify(newResults));
  };

  const saveTesterInfo = () => {
    localStorage.setItem('toume-tester-name', testerName);
  };

  // Firestore: save a single test case result row immediately
  const saveResultToFirestore = async (testId, payload) => {
    try {
      await addDoc(collection(db, 'toume_test_results'), {
        testId,
        ...payload,
        savedAt: serverTimestamp(),
      });
      // no toast here to keep UX quiet
    } catch (e) {
      console.error('Failed to save test result to Firestore', e);
    }
  };

  // Firestore: optional “session snapshot” save (called manually if you want)
  const saveSessionSnapshot = async () => {
    try {
      await addDoc(collection(db, 'toume_test_sessions'), {
        tester: testerName || null,
        build: currentBuild || null,
        platform: platform || null,
        timestamp: serverTimestamp(),
        testResults,
        summary: {
          total: testCases.length,
          passed: Object.values(testResults).filter((r) => r.status === 'pass').length,
          failed: Object.values(testResults).filter((r) => r.status === 'fail').length,
          skipped: Object.values(testResults).filter((r) => r.status === 'skip').length,
        },
        generalFeedback: feedback || '',
      });
      alert('Session snapshot saved to Firestore ✅');
    } catch (e) {
      console.error('Failed to save session snapshot', e);
      alert('Could not save session snapshot to Firestore.');
    }
  };

  const updateTestResult = (testId, status, notes = '') => {
    const base = {
      status,
      notes,
      timestamp: new Date().toISOString(),
      tester: testerName,
      build: currentBuild,
      platform,
    };
    const newResults = {
      ...testResults,
      [testId]: base,
    };
    saveResultsLocal(newResults);
    // Save this row to Firestore too
    void saveResultToFirestore(testId, base);
    // If user just hit "Fail", open quick create-card prompt?
    // We'll show a contextual action instead (button), less intrusive.
  };

  // Calculations
  const getPassRate = () => {
    const total = testCases.length;
    const passed = Object.values(testResults).filter((r) => r.status === 'pass').length;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  const getCriticalPassRate = () => {
    const criticalTests = testCases.filter((t) => t.priority === 'CRITICAL');
    const criticalPassed = criticalTests.filter((t) => testResults[t.id]?.status === 'pass').length;
    return criticalTests.length > 0 ? Math.round((criticalPassed / criticalTests.length) * 100) : 0;
  };

  const exportResults = () => {
    const results = {
      tester: testerName,
      build: currentBuild,
      platform,
      timestamp: new Date().toISOString(),
      passRate: getPassRate(),
      criticalPassRate: getCriticalPassRate(),
      feedback,
      testResults,
      summary: {
        total: testCases.length,
        passed: Object.values(testResults).filter((r) => r.status === 'pass').length,
        failed: Object.values(testResults).filter((r) => r.status === 'fail').length,
        skipped: Object.values(testResults).filter((r) => r.status === 'skip').length,
      },
    };
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toume-test-results-${testerName || 'tester'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  /* ======== Card creation (STEa) ======== */

  // Open modal prefilled from a failing test
  const openCardFromFail = (test) => {
    const r = testResults[test.id];
    const urgency = URGENCY_MAP_FROM_PRIORITY[test.priority] || DEFAULT_URGENCY;
    const preset = {
      type: 'bug',
      urgency,
      title: `Tou.me: ${test.id} failed — ${test.name}`,
      description:
        `Test: ${test.id} — ${test.name}\nPriority: ${test.priority}\nBuild: ${currentBuild || 'n/a'}\nPlatform: ${platform || 'n/a'}\nTester: ${testerName || 'n/a'}\n\nSteps/Description:\n${test.description}\n\nNotes:\n${r?.notes || '(none)'}\n`,
    };
    setCardSeed({ from: 'fail', test, preset });
    setCardForm(preset);
    setCardModalOpen(true);
  };

  // Open modal from additional feedback (for any status)
  const openCardFromFeedback = (test) => {
    const r = testResults[test.id];
    const urgency = URGENCY_MAP_FROM_PRIORITY[test.priority] || DEFAULT_URGENCY;
    const preset = {
      type: 'observation',
      urgency,
      title: `Tou.me feedback — ${test.id}: ${test.name}`,
      description:
        `Feedback on: ${test.id} — ${test.name}\nPriority: ${test.priority}\nBuild: ${currentBuild || 'n/a'}\nPlatform: ${platform || 'n/a'}\nTester: ${testerName || 'n/a'}\n\nFeedback:\n${r?.notes || '(add details here)'}\n`,
    };
    setCardSeed({ from: 'feedback', test, preset });
    setCardForm(preset);
    setCardModalOpen(true);
  };

  const saveCardToLocalStorage = (card) => {
    try {
      const raw = localStorage.getItem(BOARD_LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      localStorage.setItem(BOARD_LS_KEY, JSON.stringify([card, ...arr]));
    } catch {
      // ignore
    }
  };

  const createSteaCard = async () => {
    const nowIso = new Date().toISOString();
    if (!cardForm.title.trim()) {
      alert('Please enter a card title.');
      return;
    }
    // Build a card compatible with the /board page schema
    const newCard = {
      id: `stea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'Idea', // start in Idea
      createdAt: nowIso,
      updatedAt: nowIso,
      type: cardForm.type,
      urgency: cardForm.urgency,
      title: cardForm.title.trim(),
      description: cardForm.description || '',
    };

    // 1) Save in Firestore (future board sync)
    try {
      await addDoc(collection(db, 'stea_cards'), {
        ...newCard,
        savedAt: serverTimestamp(),
        source: 'toume_test_portal',
      });
    } catch (e) {
      console.error('Failed to create STEa card in Firestore', e);
      alert('Could not save card to Firestore (it will still appear on your /board via localStorage).');
    }

    // 2) Also add to localStorage so current /board shows it immediately
    saveCardToLocalStorage(newCard);

    setCardModalOpen(false);
    setCardSeed(null);
    setCardForm({ type: 'bug', urgency: 'medium', title: '', description: '' });
    alert('Card created! Check /apps/stea/filo.');
  };

  /* ===== Test cases (from USER_TESTING_SCRIPT.md) ===== */
  const testCases = [
    // CRITICAL TEST CASES
    {
      id: 'TC-001a',
      name: 'First-Time User Onboarding',
      priority: 'CRITICAL',
      time: '2-3 min',
      description: 'Fresh app install onboarding flow',
      details: `**Preconditions:**
- Fresh app install
- Cache cleared
- WiFi connected
- No prior account on device

**Test Steps:**
1. Launch app
2. Observe welcome screen appears
3. Tap "Sign in with Google"
4. Complete Google authentication
5. Tour modal automatically appears
6. Read first tour step
7. Tap "Next" through all tour steps (observe each screen navigation)
8. Tap "Done" on final step
9. Observe landing screen (should be "Create Circle" or "Join Circle")

**Expected Results:**
- Welcome screen displays clearly with tou.me branding
- Google sign-in completes without errors
- Tour modal appears automatically (no manual trigger needed)
- Tour modal positioned at bottom ~40% of screen height
- Screen content visible behind light backdrop
- All 6 tour steps navigate correctly
- Each tour step matches the screen shown behind modal
- "Done" dismisses tour and shows appropriate next screen`
    },
    {
      id: 'TC-001b',
      name: 'Core Setup Flow',
      priority: 'CRITICAL',
      time: '3-5 min',
      description: 'Create circle → Add child → Create event',
      details: `**Preconditions:**
- Completed TC-001a
- Signed in with valid account
- No circles created yet

**Test Steps:**
1. From circle creation screen, enter circle name: "My Family"
2. Tap "Create circle"
3. Wait for circle creation (observe loading state)
4. Verify landing on Home screen
5. Navigate to Inventory tab
6. Tap "Add Child" or equivalent
7. Enter child name and details
8. Save child profile
9. Navigate to Schedule tab
10. Tap "Create Event"
11. Enter event details (name, date, time)
12. Save event
13. Verify event appears in calendar

**Expected Results:**
- Circle creation shows loading indicator
- Successfully creates circle without timeout
- Home screen shows new circle as active
- Child profile saves and appears in list
- Event creation form is intuitive
- Event appears in calendar view
- No crashes or data loss`
    },
    {
      id: 'TC-002',
      name: 'Circle Creation and Member Invitation',
      priority: 'CRITICAL',
      time: '5-7 min',
      description: 'Create circle → Invite member → Accept invitation',
      details: `**Preconditions:**
- Two devices/accounts available (User A & User B)
- Both users signed in
- WiFi connected on both devices

**Test Steps:**

**User A (Inviter):**
1. Create circle: "Shared Circle"
2. Navigate to circle settings
3. Tap "Invite Members"
4. Generate invite link
5. Copy link
6. Send link to User B (via test messaging)

**User B (Invitee):**
7. Open invite link on device
8. App opens to invite acceptance screen
9. Review circle details
10. Tap "Accept Invitation"
11. Wait for processing

**User A:**
12. Verify User B appears in member list
13. Check User B's role/permissions

**User B:**
14. Verify circle appears in circle list
15. Switch to shared circle
16. Verify access to circle data

**Expected Results:**
- Invite link generates successfully
- Link opens app (or app store if not installed)
- Invite details display clearly (circle name, inviter)
- Acceptance processes without errors
- Both users see each other in member list
- Permissions assigned correctly
- Real-time update when member joins`
    },
    {
      id: 'TC-003',
      name: 'Event Creation with Privacy Controls',
      priority: 'CRITICAL',
      time: '4-6 min',
      description: 'Create event → Set privacy to Private → Verify visibility',
      details: `**Preconditions:**
- Two users in same circle (from TC-002)
- Both devices available
- At least one child profile exists

**Test Steps:**

**User A:**
1. Navigate to Schedule tab
2. Tap "Create Event"
3. Enter event name: "Private Test Event"
4. Select child/recipient
5. Set privacy level to "Private"
6. Note the privacy description/icon
7. Save event
8. Verify event appears with privacy indicator

**User B:**
9. Navigate to Schedule tab in same circle
10. Look for "Private Test Event"
11. Note: event should NOT be visible

**User A:**
12. Edit event, change privacy to "Visible"
13. Save changes

**User B:**
14. Refresh/check schedule again
15. Verify event NOW appears

**Expected Results:**
- Privacy options clearly labeled
- "Private" events invisible to other users
- "Visible" events shown to all circle members
- Privacy indicators visible on events
- Changes sync in real-time`
    },
    {
      id: 'TC-006',
      name: 'Gift Reservation System',
      priority: 'CRITICAL',
      time: '4-5 min',
      description: 'Add gift → Reserve as User A → Verify User B cannot reserve',
      details: `**Preconditions:**
- Two users in same circle
- Both devices available
- At least one child profile exists

**Test Steps:**

**User A:**
1. Navigate to Inventory tab
2. Tap "Add Gift"
3. Enter gift details: "Test Toy"
4. Assign to child
5. Save gift
6. Tap on gift to view details
7. Tap "Reserve" or "I'll buy this"
8. Confirm reservation

**User B:**
9. Navigate to Inventory tab
10. Locate "Test Toy" in gift list
11. Tap on gift to view details
12. Observe reservation status
13. Attempt to reserve the same gift
14. Note the button state/message

**User A:**
15. View gift details again
16. Verify your reservation is marked
17. Tap "Unreserve" or "Cancel reservation"
18. Confirm cancellation

**User B:**
19. Refresh or wait for sync
20. Verify gift is now available to reserve
21. Reserve the gift
22. Confirm your reservation

**User A:**
23. Verify you can no longer reserve
24. Check that User B's name appears as reserver

**Expected Results:**
- Gift creation successful
- Reservation marks gift immediately
- Other users see "Reserved by [Name]"
- Reserved gifts cannot be reserved by others
- Unreserving makes gift available again
- Real-time sync between users
- Clear visual indicators for reservation status`
    },
    {
      id: 'TC-008',
      name: 'App Store Reviewer Access',
      priority: 'CRITICAL',
      time: '5-7 min',
      description: 'Tap logo 7 times → Verify demo mode → Test features',
      details: `**Preconditions:**
- Fresh app launch
- Not currently in reviewer mode
- Any user account (or no account)

**Test Steps:**
1. Navigate to any screen with tou.me logo
2. Tap logo 7 times rapidly
3. Observe reviewer mode activation
4. Note the reviewer badge appearance
5. Navigate to Home screen
6. Create a demo circle (should auto-populate)
7. Verify demo data exists (members, events, gifts)
8. Navigate to Inventory tab
9. Add a test gift
10. Navigate to Schedule tab
11. Create a test event
12. Switch between tabs
13. Test all major features
14. Tap reviewer badge or logo again
15. Exit reviewer mode
16. Verify return to normal state

**Expected Results:**
- Logo tap activates reviewer mode (7 taps)
- Clear visual indicator (badge) shows reviewer mode is active
- Demo circle auto-created with sample data
- All features work in reviewer mode
- Can create/edit data without real Firebase calls
- Badge visible throughout session
- Easy exit from reviewer mode
- Clean return to normal app state`
    },
    {
      id: 'TC-012',
      name: 'Data Deletion Compliance',
      priority: 'CRITICAL',
      time: '3-5 min',
      description: 'Create test account → Delete account → Verify complete removal',
      details: `**Preconditions:**
- Test account created with some data
- Account has: 1 circle, 1 child, 1 event, 1 gift
- Device connected to internet

**Test Steps:**
1. Sign in with test account
2. Verify test data is visible
3. Navigate to Settings
4. Scroll to "Delete Account" option
5. Tap "Delete Account"
6. Read warning/confirmation dialog
7. Confirm deletion (may require re-auth)
8. Wait for deletion to complete
9. Observe result (should sign out)
10. Attempt to sign back in with same account
11. Verify account no longer exists or all data gone
12. (Optional) Check shared circles from another account
13. Verify deleted user removed from member lists

**Expected Results:**
- Clear warning about data deletion
- Deletion requires confirmation
- May require re-authentication
- Deletion completes within 30 seconds
- User signed out after deletion
- Cannot sign back in with deleted account, OR sign-in succeeds but all user data is gone
- User removed from all circles
- No orphaned data remains`
    },
    {
      id: 'TC-021',
      name: 'Tour Replay from Settings',
      priority: 'CRITICAL',
      time: '2-3 min',
      description: 'Replay tour → Verify no circle switching',
      details: `**Preconditions:**
- Existing user account with circles
- User has completed tour at least once
- Currently in a specific circle (e.g., "My Family")
- Note the current circle name before starting

**Test Steps:**
1. Navigate to Settings screen
2. Scroll to "Replay Tour" button
3. Note your current circle (top of screen)
4. Tap "Replay Tour"
5. Observe tour modal appears
6. Check that you're still in the same circle
7. Complete first tour step
8. Observe screen navigation (should go to Home tab)
9. Verify circle hasn't changed
10. Tap "Next" through remaining tour steps
11. Observe each screen as tour navigates
12. On final step, tap "Done"
13. Verify you land on Home screen
14. Check circle selector - should be same circle as step 3
15. Navigate to other tabs
16. Verify all your existing data is intact

**Expected Results:**
- "Replay Tour" button visible in Settings
- Tour modal appears immediately on tap
- User stays in their current circle throughout
- Tour navigates to appropriate screens (Home, Inventory, Schedule, Circle)
- Modal positioned at bottom ~40% height
- Screen content visible behind modal
- Tour completes without errors
- User returns to normal app state in same circle
- No data loss or circle switching`
    },
    {
      id: 'TC-022',
      name: 'Circle Switching Stability',
      priority: 'CRITICAL',
      time: '4-6 min',
      description: 'Switch between circles → Verify data loads correctly',
      details: `**Preconditions:**
- User account with 2+ circles created
- Each circle has different data (members, events)
- App freshly launched

**Test Steps:**
1. Launch app
2. Note which circle is active on launch
3. Navigate to Home tab
4. Tap circle selector at top
5. Switch to Circle B
6. Wait for data to load
7. Verify Circle B's events/members display
8. Navigate to Inventory tab
9. Note which tab is active
10. Switch back to Circle A via selector
11. Verify Circle A's data loads
12. Check which tab is now active (should remember Inventory)
13. Navigate to Schedule tab
14. Switch to Circle B again
15. Verify Schedule tab is remembered for Circle B
16. Rapidly switch between circles 3-4 times
17. Force close app
18. Relaunch app
19. Verify last active circle is restored
20. Verify last active tab per circle is restored

**Expected Results:**
- Circle switching loads within 2-3 seconds
- Correct data displays for each circle
- Last active tab remembered per circle
- No crashes during rapid switching
- Last active circle persists across app restarts
- Tab state persists per circle
- No data mixing between circles
- Smooth tab animations`
    },
    {
      id: 'TC-023',
      name: 'Invite Link Handling',
      priority: 'CRITICAL',
      time: '5-7 min',
      description: 'Generate invite → Send link → Accept invitation',
      details: `**Preconditions:**
- Two devices with app installed (User A & User B)
- User A has existing circle
- User B signed in but not in the circle
- Test messaging app available to send links

**Test Steps:**

**User A:**
1. Open circle settings
2. Generate invite link
3. Copy link to clipboard
4. Send via test messaging app to User B

**User B:**
5. Receive link in messaging app
6. Tap link
7. Observe app behavior (should open tou.me)
8. Review invite details screen
9. Verify circle name, inviter name visible
10. Tap "Accept"
11. Wait for processing
12. Verify circle appears in circle list
13. Switch to newly joined circle
14. Verify access to circle data

**User A:**
15. Check member list
16. Verify User B appears

**Additional Test:**
17. User A generates new invite link
18. User B (already member) taps link
19. Observe behavior (should show "already a member")

**Expected Results:**
- Link opens app directly (deep link works)
- Invite screen shows clear circle details
- Accept button processes successfully
- Circle appears in user's list immediately
- Both users see updated member list
- Duplicate join handled gracefully
- No orphaned invites`
    },
    // HIGH PRIORITY TEST CASES
    {
      id: 'TC-004',
      name: 'Google Calendar Connection (Enhanced)',
      priority: 'HIGH',
      time: '5-8 min',
      description: 'Connect Google Calendar → Import events → Add overlay metadata',
      details: `**Preconditions:**
- User signed in with Google account
- Google Calendar with events exists
- WiFi connected

**Test Steps:**
1. Navigate to Settings or Calendar
2. Find "Connect Google Calendar" option
3. Tap to initiate connection
4. Complete Google OAuth flow
5. If multiple calendars, verify selection screen appears
6. Select calendar to connect
7. Grant permissions
8. Wait for sync to complete
9. Navigate to Schedule tab
10. Verify Google Calendar events appear
11. Identify visual distinction (icon/label) between:
    - tou.me events
    - Google Calendar events
12. Tap on a Google Calendar event
13. Observe event details
14. Look for "Add overlay metadata" or similar option
15. Add tou.me metadata (notes, child assignment)
16. Save changes
17. Return to calendar view
18. Verify metadata attached to Google event
19. In Google Calendar (separate app/web), add new event
20. Return to tou.me
21. Pull to refresh or wait for sync
22. Verify new Google event appears

**Expected Results:**
- OAuth flow completes without errors
- Calendar selection shown if multiple calendars
- Events sync within 30 seconds
- Clear visual distinction between event types
- Google events not editable directly
- Can add tou.me metadata overlay
- New Google events sync into tou.me
- Bi-directional sync works
- Disconnection option available`
    },
    {
      id: 'TC-005',
      name: 'Handover Creation and Completion',
      priority: 'HIGH',
      time: '5-7 min',
      description: 'Create handover → Add checklist → Attach inventory → Complete → Verify location update',
      details: `**Preconditions:**
- Two users in same circle
- Both devices available
- At least 2 inventory items exist

**Test Steps:**

**User A (Creating Handover):**
1. Navigate to Handovers or Schedule tab
2. Tap "Create Handover"
3. Select handover date/time
4. Select recipient (User B)
5. Add checklist item: "Pack snacks"
6. Add checklist item: "Include favorite toy"
7. Tap "Attach Inventory"
8. Select 2 inventory items to include
9. Add notes: "Pickup at 3pm"
10. Save handover

**User B (Receiving Notification):**
11. Observe notification of new handover
12. Navigate to handover details
13. Review checklist
14. Review attached inventory items
15. Note current location of inventory items

**User A (Completing):**
16. Open handover
17. Check off first checklist item
18. Save progress

**User B:**
19. Refresh/observe real-time update
20. Verify first item checked

**User A:**
21. Check off second checklist item
22. Tap "Complete Handover"
23. Confirm completion

**Both Users:**
24. Navigate to Inventory
25. Verify location of inventory items updated to User B
26. Check handover status shows "Completed"

**Expected Results:**
- Handover creation smooth and intuitive
- Checklist items save correctly
- Inventory items attach successfully
- User B receives notification
- Real-time sync of checklist progress
- Completion updates inventory locations
- Historical record maintained`
    },
    {
      id: 'TC-007',
      name: 'Real-Time Multi-User Updates',
      priority: 'HIGH',
      time: '4-6 min',
      description: 'Two users edit same data → Verify real-time sync',
      details: `**Preconditions:**
- Two devices with same circle
- Both users viewing same screen
- WiFi connected on both

**Test Steps:**

**Setup:**
1. Both users navigate to Inventory tab
2. Both viewing same item list

**User A:**
3. Add new gift: "Real-Time Test Item"
4. Save gift

**User B:**
5. Observe screen (pull to refresh if needed)
6. Note time until "Real-Time Test Item" appears
7. Record time: _____ seconds

**User A:**
8. Edit "Real-Time Test Item"
9. Change name to "Updated Test Item"
10. Save changes

**User B:**
11. Observe update
12. Record time until update appears: _____ seconds

**User B:**
13. Reserve "Updated Test Item"

**User A:**
14. Observe reservation status update
15. Record time: _____ seconds

**User A:**
16. Navigate to Schedule tab

**User B:**
17. Navigate to Schedule tab

**User A:**
18. Create event: "Sync Test Event"

**User B:**
19. Observe schedule update
20. Record time: _____ seconds

**Expected Results:**
- New items appear within 5-10 seconds
- Edits sync within 5-10 seconds
- Reservations sync immediately or within 5 seconds
- Consistent data across all users
- No conflicts or data loss`
    },
    {
      id: 'TC-024',
      name: 'Dark Mode Theming',
      priority: 'HIGH',
      time: '5-8 min',
      description: 'Toggle dark/light mode → Check readability across all screens',
      details: `**Preconditions:**
- App installed
- User signed in
- Access to device Settings or in-app theme toggle

**Test Steps:**
1. Ensure app is in Light mode
2. Navigate through all major screens:
   - Home
   - Inventory
   - Schedule
   - Circle Settings
   - User Settings
3. Note any readability issues in Light mode
4. Toggle to Dark mode (device Settings or in-app)
5. Observe theme transition
6. Navigate through same screens in Dark mode
7. Check text readability on all screens
8. Look for white-on-white or black-on-black issues
9. Check button visibility and contrast
10. Open modals/dialogs (tour modal, create gift, etc.)
11. Verify modal backgrounds appropriate for dark mode
12. Toggle back to Light mode
13. Verify smooth transition

**Areas to Check:**
- Text on backgrounds (primary, secondary text)
- Button text on buttons
- Input field text and borders
- Card backgrounds vs screen backgrounds
- Modal backdrops
- Icon colors
- Status bar style
- Navigation bar colors
- Tab bar colors

**Expected Results:**
- Smooth transition between themes
- All text readable in both modes
- Appropriate contrast ratios (WCAG AA minimum)
- No white-on-white or black-on-black text
- Buttons clearly visible
- Consistent theming across all screens
- Modals styled appropriately
- Theme preference persists across sessions`
    },
    {
      id: 'TC-025',
      name: 'Tour Modal UX Validation',
      priority: 'HIGH',
      time: '3-5 min',
      description: 'Validate tour modal positioning and visibility',
      details: `**Preconditions:**
- Fresh install OR access to replay tour
- User ready to complete tour

**Test Steps:**
1. Trigger tour (first launch or Settings → Replay Tour)
2. Observe modal appearance animation
3. Measure/estimate modal height as % of screen
4. Estimate backdrop opacity (light/medium/heavy)
5. Try to see screen content behind modal
6. Read tour step content in modal
7. Observe screen behind modal (Home, Inventory, etc.)
8. Rate how well you can see the feature being described
9. Tap backdrop (outside modal)
10. Verify tour dismisses
11. Re-trigger tour
12. Tap "Skip tour"
13. Verify immediate dismissal
14. Re-trigger tour
15. Use "Previous" button
16. Verify smooth back navigation
17. Use "Next" button through all steps
18. Observe slide animations between steps
19. On last step, verify "Done" button appears
20. Tap "Done"
21. Observe dismissal animation

**Evaluation Criteria:**
- Modal Size: Should be ~40% of screen height, bottom-aligned
- Backdrop: Should be light enough to see behind (40% opacity)
- Readability: Modal content easily readable
- Visibility: Screen features behind modal clearly visible
- Animations: Smooth slide-up/down, no janky movements
- Controls: Previous/Next/Skip/Done all work correctly

**Expected Results:**
- Modal appears at bottom, not center
- Modal takes up ~40% or less of screen height
- Very light backdrop (semi-transparent)
- Can clearly see and understand screen behind modal
- Modal content readable and clear
- Smooth animations
- All navigation controls work
- Progress dots update correctly`
    },
    {
      id: 'TC-026',
      name: 'Welcome Screen Transition',
      priority: 'HIGH',
      time: '2-3 min',
      description: 'Test welcome screen timing and transition',
      details: `**Preconditions:**
- Fresh install OR cleared app data
- No existing circles for account

**Test Steps:**
1. Launch app
2. Sign in with account that has no circles
3. Welcome screen should appear
4. Read welcome screen content
5. Note the "Continue" button
6. Tap "Continue"
7. Start timer
8. Observe loading state/animation
9. Wait for transition to complete
10. Stop timer when next screen appears
11. Record time: _____ seconds
12. Verify next screen is appropriate (Create/Join Circle)

**Repeat Test:**
13. Sign out
14. Sign back in with same account
15. Welcome screen should NOT appear (already seen)
16. Verify direct navigation to home or onboarding

**Expected Results:**
- Welcome screen appears for new users with no circles
- Content is clear and welcoming
- "Continue" button visible and tappable
- Transition completes within 2-3 seconds
- Loading state visible if delay
- No hanging or frozen states
- Lands on appropriate next screen
- Welcome screen doesn't repeat unnecessarily`
    },
    {
      id: 'TC-027',
      name: 'Household Query Performance',
      priority: 'HIGH',
      time: '6-10 min',
      description: 'Test app performance with realistic data load',
      details: `**Preconditions:**
- User account with circle
- WiFi connected
- Ability to create test data

**Test Steps:**

**Setup (Create Load):**
1. Create circle: "Performance Test"
2. Add 5 members (or invite 5 test accounts)
3. Add 5 child profiles
4. Create 10 events over next 30 days
5. Add 15 gifts to inventory
6. Create 3 handovers

**Performance Testing:**
7. Force close app
8. Launch app
9. Start timer
10. Wait for data to load
11. Stop timer when Home screen fully loaded
12. Record load time: _____ seconds
13. Navigate to Inventory tab
14. Record time to display: _____ seconds
15. Navigate to Schedule tab
16. Record time to display: _____ seconds
17. Switch to different circle (if available)
18. Record switch time: _____ seconds
19. Switch back to "Performance Test" circle
20. Record switch time: _____ seconds
21. Scroll through event list (Schedule)
22. Observe any lag or stuttering
23. Scroll through inventory list
24. Observe any lag or stuttering
25. Open event details (tap event)
26. Record time to open: _____ seconds
27. Close and open another event
28. Record time: _____ seconds

**Expected Results:**
- Initial app load: <5 seconds
- Tab switching: <1 second
- Circle switching: <3 seconds
- Event/gift details: <1 second
- Smooth scrolling, no stutters
- No noticeable lag during navigation`
    },
    {
      id: 'TC-028',
      name: 'Function Timeout Handling',
      priority: 'HIGH',
      time: '4-6 min',
      description: 'Test graceful handling of slow network and timeouts',
      details: `**Preconditions:**
- Ability to simulate slow network (or use slow 3G)
- User account ready to create circle

**Test Steps:**

**Simulate Slow Network:**
1. Enable slow network simulation:
   - iOS: Settings → Developer → Network Link Conditioner → Very Bad Network
   - Android: Developer Options → Networking → Slow 3G
2. Launch tou.me app

**Test Circle Creation Timeout:**
3. Navigate to Create Circle screen
4. Enter circle name: "Timeout Test"
5. Tap "Create Circle"
6. Observe loading state
7. Wait up to 15 seconds
8. Note any timeout message or behavior
9. Observe if button stays in loading state
10. Wait additional 10 seconds
11. Check if circle eventually appears in list

**Test with Better Network:**
12. Disable network throttling (restore normal speed)
13. Check if "Timeout Test" circle now appears
14. If not, try creating another circle
15. Verify it works normally with good network

**Test Offline Handling:**
16. Enable Airplane Mode
17. Try to create circle: "Offline Test"
18. Observe error handling
19. Note any helpful error messages

**Expected Results:**
- Loading indicator shows during operation
- Timeout handled gracefully (no crash)
- Clear feedback if operation times out
- Eventual sync when network improves
- Offline operations show helpful errors
- User not stuck on loading screen forever`
    },
    // MEDIUM PRIORITY TEST CASES
    {
      id: 'TC-009',
      name: 'Inventory Location Tracking',
      priority: 'MEDIUM',
      time: '5-7 min',
      description: 'Add item → Create handover → Complete → Verify location update',
      details: `**Preconditions:**
- Two users in same circle
- At least 2 inventory items exist

**Test Steps:**
1. User A adds item: "Tracking Test Item"
2. Note initial location (User A)
3. Create handover from User A to User B
4. Attach "Tracking Test Item" to handover
5. User B accepts handover
6. Complete handover
7. Check item location (should update to User B)
8. Verify location history/log if available
9. Create return handover from User B to User A
10. Attach same item
11. Complete handover
12. Verify location back to User A

**Expected Results:**
- Location tracks correctly
- Updates on handover completion
- Historical record maintained
- Both users see consistent location`
    },
    {
      id: 'TC-010',
      name: 'Calendar Conflict Detection',
      priority: 'MEDIUM',
      time: '4-6 min',
      description: 'Create overlapping events → Verify conflict badge → Check suggestions',
      details: `**Preconditions:**
- User with calendar access
- Ability to create events

**Test Steps:**
1. Create event: "Event A" at 2:00 PM - 3:00 PM
2. Create event: "Event B" at 2:30 PM - 3:30 PM (overlapping)
3. Observe any conflict warning or badge
4. Check if suggestions provided
5. View calendar to see visual conflict indication
6. Edit Event B to resolve conflict
7. Verify conflict warning removed

**Expected Results:**
- Conflicts detected and indicated
- Visual badge or warning shown
- Suggestions for resolution (optional)
- Easy to identify conflicts in calendar view`
    },
    {
      id: 'TC-011',
      name: 'Permission Enforcement',
      priority: 'MEDIUM',
      time: '4-6 min',
      description: 'Sign in as Trusted Adult → Verify blocked actions',
      details: `**Preconditions:**
- Two users in circle with different roles
- User B has "Trusted Adult" role (limited permissions)

**Test Steps:**

**User B (Trusted Adult):**
1. Attempt to delete circle
2. Observe if blocked or allowed
3. Attempt to remove admin member
4. Observe result
5. Attempt to change circle settings
6. Note what is allowed vs blocked
7. Attempt to invite new members
8. Note result

**User A (Admin):**
9. Verify User B cannot perform admin actions
10. Perform same actions as admin
11. Verify they work for admin

**Expected Results:**
- Clear permission boundaries
- Trusted Adults cannot perform admin actions
- Attempts blocked with helpful message
- No confusion about permissions`
    },
    {
      id: 'TC-013',
      name: 'Large Circle Performance',
      priority: 'MEDIUM',
      time: '10-15 min',
      description: 'Test with 8+ members, 50+ events → Measure response times',
      details: `**Preconditions:**
- Ability to create large dataset
- Test account

**Test Steps:**
1. Create circle with 8 members
2. Add 10 child profiles
3. Create 50 events over 3 months
4. Add 50 gifts to inventory
5. Navigate to Home
6. Observe load time
7. Scroll through event list
8. Measure scrolling smoothness
9. Switch tabs multiple times
10. Measure response times
11. Search for specific event/gift
12. Measure search speed
13. Filter calendar by child
14. Measure filter speed

**Expected Results:**
- Reasonable load times (<10 seconds)
- Smooth scrolling with large lists
- Search/filter remain responsive
- No crashes with large datasets`
    },
    {
      id: 'TC-014',
      name: 'Offline/Online Synchronization',
      priority: 'MEDIUM',
      time: '5-7 min',
      description: 'Edit offline → Reconnect → Verify sync',
      details: `**Preconditions:**
- Device with WiFi
- User signed in with circle

**Test Steps:**
1. With WiFi on, view circle data
2. Enable Airplane Mode
3. Attempt to add gift "Offline Item"
4. Note any offline indicators
5. Edit existing event
6. Navigate between screens
7. Disable Airplane Mode (go online)
8. Observe sync behavior
9. Verify "Offline Item" appears
10. Verify event edit synced
11. Check for conflicts or duplicates

**Expected Results:**
- Clear offline indicator
- Some operations cached
- Automatic sync when online
- No data loss
- Conflicts handled gracefully`
    },
    {
      id: 'TC-015',
      name: 'File Upload Security',
      priority: 'MEDIUM',
      time: '5-7 min',
      description: 'Test file size limits → Type validation → Security checks',
      details: `**Preconditions:**
- Access to test files (images, PDFs, large files)

**Test Steps:**
1. Attempt to upload child profile photo
2. Try very large file (>10MB)
3. Observe size limit enforcement
4. Try invalid file type (.exe, .zip)
5. Observe type validation
6. Upload valid image (<5MB)
7. Verify successful upload
8. Attempt to upload gift photo
9. Repeat file validation tests
10. Upload PDF (if supported)
11. Test size/type limits

**Expected Results:**
- Clear file size limits
- Type validation enforced
- Helpful error messages
- Valid uploads succeed
- Invalid uploads blocked gracefully`
    },
    {
      id: 'TC-016',
      name: 'App Crash Prevention',
      priority: 'MEDIUM',
      time: '5-8 min',
      description: 'Rapid navigation → Invalid data → Network errors → Monitor crashes',
      details: `**Preconditions:**
- User signed in
- Circle with data

**Test Steps:**

**Rapid Navigation:**
1. Quickly tap between tabs 10 times
2. Rapidly switch circles 5 times
3. Open and close modals rapidly

**Invalid Data:**
4. Try to create event with empty name
5. Create gift with very long name (1000+ chars)
6. Enter invalid date (e.g., Feb 31)

**Network Errors:**
7. Enable Airplane Mode mid-operation
8. Try to save data
9. Force network timeout

**Edge Cases:**
10. Sign out while data loading
11. Background app mid-save
12. Return and observe state

**Monitor:**
- Any crashes
- Frozen screens
- Error dialogs
- Recovery behavior

**Expected Results:**
- No crashes in any scenario
- Graceful error handling
- Validation prevents bad data
- Network errors handled
- App recovers from interruptions`
    },
    {
      id: 'TC-017',
      name: 'Onboarding Completion Rate',
      priority: 'MEDIUM',
      time: '5-10 min',
      description: 'Fresh install → Complete onboarding → Note confusing steps',
      details: `**Preconditions:**
- Fresh install
- User ready for full onboarding

**Test Steps:**
1. Launch app (fresh install)
2. Complete sign-in
3. Start tour
4. Note any confusing steps
5. Rate each tour step clarity (1-5)
6. Complete tour
7. Follow prompts to create circle
8. Note any confusion
9. Add first child
10. Note clarity of process
11. Create first event
12. Complete onboarding flow
13. Rate overall experience

**Things to Note:**
- Which steps caused hesitation
- Where you looked for help
- Any unclear terminology
- Missing information
- Overwhelming steps

**Expected Results:**
- Smooth progression through onboarding
- Clear next steps at each stage
- Minimal confusion
- Completed within 10 minutes`
    },
    {
      id: 'TC-019',
      name: 'Accessibility Basics',
      priority: 'MEDIUM',
      time: '8-10 min',
      description: 'Enable screen reader → Test navigation → Check contrast',
      details: `**Preconditions:**
- Device with accessibility features
- User signed in

**Test Steps:**

**Screen Reader (iOS VoiceOver / Android TalkBack):**
1. Enable screen reader
2. Navigate Home screen
3. Verify all elements announced
4. Try to create event using screen reader
5. Navigate through form fields
6. Submit form
7. Verify success message announced

**Font Scaling:**
8. Disable screen reader
9. Increase device font size to largest
10. Open tou.me
11. Check if text scales
12. Verify no text cutoff
13. Verify buttons still usable

**Color Contrast:**
14. Check text readability in light mode
15. Check text readability in dark mode
16. Verify buttons have sufficient contrast
17. Check disabled states are distinguishable

**Touch Targets:**
18. Verify buttons large enough (min 44x44 points)
19. Check adequate spacing between tap targets

**Expected Results:**
- Screen reader announces all elements
- Navigation possible with screen reader
- Font scaling works
- No text cutoff at large sizes
- Good contrast ratios (WCAG AA)
- Touch targets adequate size`
    },
    {
      id: 'TC-020',
      name: 'Cross-Platform Consistency',
      priority: 'MEDIUM',
      time: '15-20 min',
      description: 'Compare iOS/Android → Check feature parity → Performance',
      details: `**Preconditions:**
- iOS and Android devices available
- Same account on both
- Same circle with data

**Test Steps:**
1. Sign in on iOS device
2. Note visual design
3. Create event on iOS
4. Sign in on Android device
5. Verify event appears
6. Note visual design differences
7. Create gift on Android
8. Switch to iOS
9. Verify gift appears
10. Compare feature availability
11. Test same workflows on both
12. Compare performance
13. Note any iOS-only or Android-only features

**Areas to Compare:**
- Visual design consistency
- Feature parity
- Navigation patterns
- Performance
- Push notifications
- File uploads
- Calendar integration

**Expected Results:**
- Core features available on both
- Similar visual design
- Comparable performance
- Data syncs between platforms
- Platform-specific features acceptable`
    },
  ];

  /* ===== UI ===== */
  const priorityColors = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  if (!authReady) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Checking your STEa access…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Redirecting you to the STEa home to sign in…
        </div>
      </main>
    );
  }

  return (
    <main className="pb-10 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/tou.me_logo.jpeg"
          width={64}
          height={64}
          alt="Tou.me logo"
          priority
        />
        <div>
          <div className="font-extrabold text-red-600">🧪 Tou.me Testing Portal</div>
          <div className="text-muted text-sm">Internal testing for team and user group</div>
          <p className="mt-2 text-sm text-neutral-700">
            This page is for coordinated testing of Tou.me MVP 1.3. Complete the test cases below,
            report issues, and provide feedback. Results now save to Firestore and you can create STEa cards directly.
          </p>
        </div>
      </div>

      {/* Tester Info */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Tester Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              onBlur={saveTesterInfo}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Build Version</label>
            <input
              type="text"
              value={currentBuild}
              onChange={(e) => setCurrentBuild(e.target.value)}
              placeholder="e.g., 1.3.0-beta.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select platform</option>
              <option value="iOS">iOS</option>
              <option value="Android">Android</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Actions</label>
            <div className="flex gap-2">
              <button
                onClick={exportResults}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export Results
              </button>
              <button
                onClick={saveSessionSnapshot}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Summary */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Testing Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{getPassRate()}%</div>
            <div className="text-sm text-blue-800">Overall Pass Rate</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{getCriticalPassRate()}%</div>
            <div className="text-sm text-red-800">Critical Tests</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(testResults).filter((r) => r.status === 'pass').length}
            </div>
            <div className="text-sm text-green-800">Tests Passed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {Object.values(testResults).filter((r) => r.status === 'fail').length}
            </div>
            <div className="text-sm text-gray-800">Tests Failed</div>
          </div>
        </div>
      </section>

      {/* Test Cases */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Test Cases</h2>
        <div className="space-y-4">
          {testCases.map((test) => {
            const result = testResults[test.id];
            const isExpanded = expandedTests[test.id];

            return (
              <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-medium">{test.id}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${priorityColors[test.priority]}`}>
                        {test.priority}
                      </span>
                      <span className="text-sm text-gray-500">{test.time}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{test.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>

                    {/* Expand/Collapse button */}
                    {test.details && (
                      <button
                        onClick={() => setExpandedTests((prev) => ({ ...prev, [test.id]: !prev[test.id] }))}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'Show'} detailed steps
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => updateTestResult(test.id, 'pass', result?.notes || '')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      ✓ Pass
                    </button>
                    <button
                      onClick={() => updateTestResult(test.id, 'fail', result?.notes || '')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'fail' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                      }`}
                    >
                      ✗ Fail
                    </button>
                    <button
                      onClick={() => updateTestResult(test.id, 'skip', result?.notes || '')}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        result?.status === 'skip' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                      }`}
                    >
                      ⏭ Skip
                    </button>
                  </div>
                </div>

                {/* Expanded details section */}
                {isExpanded && test.details && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="prose prose-sm max-w-none">
                      {test.details.split('\n').map((line, idx) => {
                        // Simple markdown-like rendering
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <h4 key={idx} className="font-bold text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={idx} className="text-sm ml-4">{line.substring(2)}</li>;
                        }
                        if (line.match(/^\d+\./)) {
                          return <li key={idx} className="text-sm ml-4">{line}</li>;
                        }
                        if (line.trim() === '') {
                          return <br key={idx} />;
                        }
                        return <p key={idx} className="text-sm">{line}</p>;
                      })}
                    </div>
                  </div>
                )}

                {/* Notes + Actions */}
                <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>
                      Status:{' '}
                      <strong className="capitalize">
                        {result?.status || '—'}
                      </strong>
                    </span>
                    <span>{result?.timestamp ? new Date(result.timestamp).toLocaleString() : ''}</span>
                  </div>
                  <textarea
                    placeholder="Add notes about this test (issues found, observations, etc.)"
                    value={result?.notes || ''}
                    onChange={(e) => updateTestResult(test.id, result?.status || 'pass', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none"
                    rows={2}
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* Create STEa card from Fail */}
                    <button
                      onClick={() => openCardFromFail(test)}
                      disabled={result?.status !== 'fail'}
                      className={`px-3 py-2 text-sm rounded border ${
                        result?.status === 'fail'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      title={result?.status === 'fail' ? 'Create a bug card from this fail' : 'Only enabled when failed'}
                    >
                      ➕ Create STEa Card (Fail)
                    </button>

                    {/* Additional feedback → Create card for any status */}
                    <button
                      onClick={() => openCardFromFeedback(test)}
                      className="px-3 py-2 text-sm rounded border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      title="Create a card from feedback for this test"
                    >
                      📝 Create STEa Card (Feedback)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* General Feedback */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">General Feedback & Issues</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share any general feedback, bugs found, UX issues, or suggestions for improvement..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={6}
        />
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <p className="text-sm text-gray-600 flex-1">
            Click "Save Feedback" to save all test results and feedback to Firestore.
          </p>
          <button
            onClick={saveSessionSnapshot}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Feedback
          </button>

          {/* Quick card from general feedback */}
          <button
            onClick={() => {
              const preset = {
                type: 'observation',
                urgency: 'medium',
                title: `Tou.me — General Feedback (${testerName || 'tester'})`,
                description:
                  `Build: ${currentBuild || 'n/a'}\nPlatform: ${platform || 'n/a'}\nTester: ${testerName || 'n/a'}\n\nFeedback:\n${feedback || '(add details)'}\n`,
              };
              setCardSeed({ from: 'general', test: null, preset });
              setCardForm(preset);
              setCardModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create STEa Card from Feedback
          </button>
        </div>
      </section>

      {/* Release Readiness */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Release Readiness Checklist</h2>
        <div className="space-y-2">
          <div className={`flex items-center gap-2 ${getCriticalPassRate() === 100 ? 'text-green-600' : 'text-red-600'}`}>
            <span>{getCriticalPassRate() === 100 ? '✅' : '❌'}</span>
            <span>All critical tests passing (currently {getCriticalPassRate()}%)</span>
          </div>
          <div className={`flex items-center gap-2 ${getPassRate() >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
            <span>{getPassRate() >= 90 ? '✅' : '⚠️'}</span>
            <span>Overall pass rate ≥90% (currently {getPassRate()}%)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📋</span>
            <span>No critical bugs reported in feedback</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>🚀</span>
            <span>App store reviewer access working (TC-008)</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="card p-6 mt-4 text-center">
        <p className="text-sm text-gray-600">
          This testing portal is for internal use only. Results save locally and to Firestore on each action.
          <br />
          Need the board?{' '}
          <Link href="/apps/stea/filo" className="text-blue-600 hover:underline">
            Open STEa board
          </Link>
          .
        </p>
      </section>

      {/* ===== Card Modal ===== */}
      {cardModalOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCardModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl card p-5">
            <h3 className="text-xl font-extrabold mb-3">
              Create STEa Card {cardSeed?.test ? `— ${cardSeed.test.id}` : ''}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={cardForm.type}
                  onChange={(e) => setCardForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Urgency</label>
                <select
                  value={cardForm.urgency}
                  onChange={(e) => setCardForm((f) => ({ ...f, urgency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {['low', 'medium', 'high', 'critical'].map((u) => (
                    <option key={u} value={u}>
                      {u[0].toUpperCase() + u.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={cardForm.title}
                  onChange={(e) => setCardForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Fix calendar privacy not applying on private events"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={6}
                  value={cardForm.description}
                  onChange={(e) => setCardForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Repro steps, expected vs actual, context…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setCardModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createSteaCard}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
