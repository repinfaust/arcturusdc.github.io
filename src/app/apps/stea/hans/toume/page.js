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

/* ===== Multi-tenant ===== */
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';

/* ===== Constants ===== */
// Workspaces allowed to access Tou.me testing portal
const ALLOWED_TENANT_NAMES = ['ArcturusDC'];
const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

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
  const { currentTenant, loading: tenantLoading } = useTenant();
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
    if (!currentTenant?.id) {
      console.warn('No tenant selected, skipping Firestore save');
      return;
    }
    try {
      await addDoc(collection(db, 'toume_test_results'), {
        testId,
        ...payload,
        tenantId: currentTenant.id,
        savedAt: serverTimestamp(),
      });
      // no toast here to keep UX quiet
    } catch (e) {
      console.error('Failed to save test result to Firestore', e);
    }
  };

  // Firestore: optional "session snapshot" save (called manually if you want)
  const saveSessionSnapshot = async () => {
    if (!currentTenant?.id) {
      alert('No workspace selected. Please select a workspace first.');
      return;
    }
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
        tenantId: currentTenant.id,
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
      if (!currentTenant?.id) {
        throw new Error('No workspace selected');
      }
      await addDoc(collection(db, 'stea_cards'), {
        ...newCard,
        tenantId: currentTenant.id,
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

  /* ===== Test cases (from TEST_CASES.md) ===== */
  const testCases = [
    // CRITICAL TEST CASES
    {
      id: 'TC-001a',
      name: 'First-Time User Onboarding',
      priority: 'CRITICAL',
      time: '2-3 min',
      description: 'Fresh app install onboarding flow.',
      details: `**Preconditions:**
- Fresh app install
- Cache cleared
- WiFi connected
- No prior account on device

**Test Steps:**
1. Launch app
2. Observe welcome screen appears
3. Tap "Sign in with Google" (or "Sign in with Apple")
4. Complete authentication flow
5. Tour modal automatically appears
6. Read first tour step
7. Tap "Next" through all tour steps (observe each screen navigation)
8. Tap "Done" on final step
9. Observe landing screen (should be "Create Circle" or "Join Circle")

**Expected Results:**
- Welcome screen displays clearly with tou.me branding
- Google/Apple sign-in completes without errors
- Tour modal appears automatically (no manual trigger needed)
- Tour modal positioned at bottom ~40% of screen height
- Screen content visible behind light backdrop
- All tour steps navigate correctly
- Each tour step matches the screen shown behind modal
- "Done" dismisses tour and shows appropriate next screen`
    },
    {
      id: 'TC-001b',
      name: 'Core Setup Flow',
      priority: 'CRITICAL',
      time: '3-5 min',
      description: 'Create circle → Add child → Create event.',
      details: `**Preconditions:**
- User authenticated
- On CircleOnboarding screen

**Test Steps:**
1. Tap "Create a new circle"
2. Enter circle name (e.g., "Loki")
3. Tap "Create circle"
4. Observe navigation to Home screen
5. Navigate to Circle tab
6. Observe prompt to add child profile
7. Tap "Add child" or navigate to Settings > Overview > Child profiles
8. Enter child name (e.g., "Felix")
9. Optionally enter nickname
10. Tap "Save child"
11. Navigate to Events tab
12. Tap floating "+" button
13. Select "Standard" event type
14. Enter event title (e.g., "Football practice")
15. Set date/time
16. Select child from "Child selection" (if applicable)
17. Tap "Save"

**Expected Results:**
- Circle created successfully
- Home screen displays circle name
- Child profile added and visible
- Event created successfully
- Event appears in events list
- Event shows correct child assignment if selected`
    },
    {
      id: 'TC-001c',
      name: 'Child Profile Management',
      priority: 'HIGH',
      time: '4-5 min',
      description: 'Add multiple child profiles and verify they appear correctly throughout the app.',
      details: `**Preconditions:**
- User authenticated
- Circle created

**Test Steps:**
1. Navigate to Settings > Overview > Child profiles
2. Add first child:
   - Enter name "Felix"
   - Enter nickname "Fel"
   - Tap "Save child"
3. Verify Felix appears in "Current profiles" list
4. Add second child:
   - Enter name "Harley"
   - Leave nickname empty
   - Tap "Save child"
5. Verify both Felix and Harley appear in list
6. Add third child:
   - Enter name "Olivia"
   - Enter nickname "Liv"
   - Tap "Save child"
7. Add fourth child:
   - Enter name "Noah"
   - Leave nickname empty
   - Tap "Save child"
8. Verify all 4 children appear in "Current profiles" list
9. Navigate to Circle tab > Inventory
10. Tap "+" to add inventory item
11. Verify all 4 children appear in "Children" selection
12. Verify "All" pill selects all 4 children
13. Navigate to Events tab
14. Create standard event
15. Verify all 4 children appear in "Child selection"
16. Navigate to Circle tab > Gifts
17. Tap "+" to add gift
18. Verify all 4 children appear in "Assign to" dropdown
19. Navigate to Handovers screen
20. Create handover event
21. Verify all 4 children appear in "Children" selection

**Expected Results:**
- All 4 children can be added successfully
- Children appear in "Current profiles" list with names and nicknames
- All children appear in inventory item selection
- All children appear in event child selection
- All children appear in gift assignment dropdown
- All children appear in handover children selection
- "All" pill works correctly with multiple children
- No duplicate children appear anywhere`
    },
    {
      id: 'TC-002',
      name: 'Circle Creation and Member Invitation',
      priority: 'CRITICAL',
      time: '5-7 min',
      description: 'Create circle and invite another member via share link.',
      details: `**Preconditions:**
- User authenticated
- Two devices available (or ability to test share link)

**Test Steps:**
1. Create a new circle
2. On home screen, observe share prompt appears
3. Tap "Share circle" button
4. Observe ShareCircleModal opens
5. Verify invite code is displayed (no 0, O, o characters)
6. Tap on invite code to copy to clipboard
7. Verify code copied successfully
8. Copy share link manually
9. On second device/user, paste invite code or link
10. Complete join flow
11. Verify second user appears in circle members list
12. Verify invite code refreshes/disappears after use

**Expected Results:**
- Share modal displays correctly
- Invite code contains only valid characters (no ambiguous 0/O/o)
- Invite code is tappable and copies to clipboard
- Share link works correctly
- Second user can join circle successfully
- Both users appear in members list with correct names (not user IDs)
- Invite code cannot be reused after acceptance`
    },
    {
      id: 'TC-003',
      name: 'Calendar Sync and Selection',
      priority: 'HIGH',
      time: '4-6 min',
      description: 'Connect Google Calendar and select calendar for circle.',
      details: `**Preconditions:**
- User authenticated
- Circle created
- Google account available

**Test Steps:**
1. Navigate to Settings > Overview > Calendar sync
2. Tap "Calendar connections"
3. Tap "Connect Google Calendar"
4. Complete Google OAuth flow
5. Observe calendar selection modal appears
6. Verify circle's default calendar is pre-selected (if creator)
7. Select a calendar from list
8. Verify calendar name appears on home screen in active circle component
9. Verify calendar pill is green (aligned) or pale red (misaligned)
10. As second user, connect Google Calendar
11. Verify default calendar is pre-selected
12. Select different calendar
13. Verify warning alert appears about misalignment
14. Choose to use different calendar anyway
15. Verify calendar pill shows pale red on both users' home screens

**Expected Results:**
- Google OAuth completes successfully
- Calendar selection modal displays all available calendars
- Default calendar pre-selected for new members
- Warning appears when selecting different calendar than default
- Calendar name displays correctly on home screen
- Calendar alignment status (green/red) reflects correctly
- Apple ID users see clear messaging about separate Google authorization`
    },
    {
      id: 'TC-004',
      name: 'Standard Event Creation with Child Selection',
      priority: 'HIGH',
      time: '3-4 min',
      description: 'Create standard event and assign to specific children.',
      details: `**Preconditions:**
- Circle created
- At least one child profile added

**Test Steps:**
1. Navigate to Events tab
2. Tap floating "+" button
3. Verify "Standard" is selected by default
4. Enter event title
5. Scroll to "Child selection" section
6. Verify "All" pill appears
7. Verify individual child pills appear (e.g., "Felix", "Harley")
8. Tap "All" pill
9. Verify all children selected
10. Tap "All" again to deselect all
11. Select individual child (e.g., "Felix")
12. Set event date/time
13. Add notes if desired
14. Tap "Save"

**Expected Results:**
- Child selection section appears only for standard events
- "All" pill selects/deselects all children correctly
- Individual child pills work correctly
- Selected children saved with event
- Event displays correct child assignment`
    },
    {
      id: 'TC-005',
      name: 'Handover Event Creation',
      priority: 'HIGH',
      time: '4-5 min',
      description: 'Create handover event with pickup/drop-off details.',
      details: `**Preconditions:**
- Circle created
- At least 2 members in circle
- At least one child profile added

**Test Steps:**
1. Navigate to Events tab
2. Tap floating "+" button
3. Select "Handover" event type
4. Verify "Handover type" appears beneath "Event type"
5. Select "Pickup" or "Drop-off"
6. Verify "Tag" section appears beneath "Handover type"
7. Select a tag (e.g., "School")
8. Verify title auto-populates (e.g., "School Pickup")
9. Change tag to "Activity"
10. Verify title updates to "Activity Pickup"
11. Change handover type to "Drop-off"
12. Verify title updates to "Activity Drop-off"
13. Verify "From:" or "To:" section appears based on type
14. Select member name or "School" or "Other"
15. Select children for handover
16. Add checklist items if needed
17. Assign to member
18. Tap "Save"

**Expected Results:**
- Handover type appears in correct position
- Tag appears beneath handover type
- Title auto-populates correctly
- Title updates when tag or handover type changes
- "From:" appears for Pickup, "To:" appears for Drop-off
- No "Ends" date/time field for handover events
- Handover saves successfully with all details`
    },
    {
      id: 'TC-006',
      name: 'Inventory Item Management',
      priority: 'MEDIUM',
      time: '3-4 min',
      description: 'Add and manage inventory items with child assignment.',
      details: `**Preconditions:**
- Circle created
- At least one child profile added

**Test Steps:**
1. Navigate to Circle tab > Inventory
2. Tap floating "+" button
3. Enter item name (e.g., "Lunchbox")
4. Verify "Children" section shows individual child pills
5. Verify "All" pill appears (not "Both")
6. Select "All" or individual children
7. Select location(s) (multiple selection enabled)
8. Verify location options show member names (not "Home A/Home B")
9. Set "Needed by" date if applicable
10. Verify calendar picker is visible and positioned correctly
11. Add quantity, size, condition if needed
12. Tap "Save"
13. Verify item appears in inventory list
14. Tap on item to view/edit
15. Verify all details editable
16. Verify "needed by" date displays correctly

**Expected Results:**
- "All" pill displays (not "Both")
- All pills have consistent height
- Location options show member names dynamically
- Multiple location selection works
- Calendar picker visible and accessible
- Inventory items save and display correctly
- Items are editable after creation
- "Needed by" date displays in correct format`
    },
    {
      id: 'TC-007',
      name: 'Gift Management',
      priority: 'MEDIUM',
      time: '4-5 min',
      description: 'Add, reserve, and manage gifts for children.',
      details: `**Preconditions:**
- Circle created
- At least one child profile added
- At least one member in circle

**Test Steps:**
1. Navigate to Circle tab > Gifts
2. Tap floating "+" button
3. Enter gift name (e.g., "Lego set")
4. Select child from "Assign to" dropdown
5. Select event type (Birthday/Christmas/Reward)
6. Enter price (verify price box is appropriately sized)
7. Add link URL if applicable
8. Tap "Save"
9. Verify gift appears in gift list
10. Tap on gift to view details
11. Verify gift is editable
12. As another member, tap "Reserve" on gift
13. Verify reservation works
14. Tap "Decline" on gift
15. Verify decline works

**Expected Results:**
- Gift modal displays all fields correctly
- Price input box is appropriately sized (not too large)
- Gift saves successfully
- Gift appears in list immediately after saving
- Gift is viewable and editable
- Reserve and decline actions work correctly
- Optional fields (link, event) save as null if empty (not empty strings)`
    },
    {
      id: 'TC-008',
      name: 'Dark Mode Functionality',
      priority: 'MEDIUM',
      time: '3-4 min',
      description: 'Verify dark mode works across all screens.',
      details: `**Preconditions:**
- User authenticated
- Circle created

**Test Steps:**
1. Navigate to Settings > Account > Theme
2. Select "Dark" theme
3. Verify Settings screen switches to dark mode
4. Navigate to Home screen
5. Verify dark mode applied
6. Navigate to Events tab
7. Tap "+" to create new event
8. Verify EventFormScreen uses dark mode
9. Navigate to Handovers screen
10. Verify HandoversScreen uses dark mode
11. Tap "+" to create handover
12. Verify handover form uses dark mode
13. Navigate to Circle tab
14. Verify CircleScreen uses dark mode
15. Open inventory modal
16. Verify inventory modal uses dark mode
17. Open gift modal
18. Verify gift modal uses dark mode

**Expected Results:**
- Dark mode applies consistently across all screens
- Text is readable (no pale text on pale backgrounds)
- Buttons and pills have appropriate contrast
- Status pills (e.g., "Accepted") are readable in dark mode
- All modals support dark mode`
    },
    {
      id: 'TC-009',
      name: 'Notification Settings Configuration',
      priority: 'MEDIUM',
      time: '3-4 min',
      description: 'Configure notification preferences and verify settings save correctly.',
      details: `**Preconditions:**
- User authenticated
- Circle created
- Notification permissions granted

**Test Steps:**
1. Navigate to Settings > Account > Notification Preferences
2. Tap "Manage Notifications"
3. Verify notification settings screen opens
4. Verify "Enable Notifications" toggle is ON (if permissions granted)
5. Toggle "Event Reminders" OFF
6. Toggle "Handover Reminders" OFF
7. Toggle "Birthday Reminders" ON
8. Toggle "School Holiday Reminders" ON
9. Verify "Reminder Timing" section displays options: 5m, 15m, 30m, 1h, 2h, 1d, 2d
10. Select "1d" (1 day) reminder option
11. Enable "Quiet Hours"
12. Set quiet hours start time to 22:00
13. Set quiet hours end time to 08:00
14. Toggle "Sound" OFF
15. Toggle "Badge" ON
16. Navigate back to Settings
17. Return to Notification Settings
18. Verify all settings persisted correctly

**Expected Results:**
- Notification settings screen accessible
- All event type toggles work correctly
- Reminder options include 1 day (1d) and 2 days (2d)
- Quiet hours can be enabled and times set
- Time pickers work correctly
- Sound and Badge toggles work
- Settings save and persist correctly
- Settings load correctly when returning to screen
- Dark mode works on notification settings screen`
    },
    {
      id: 'TC-009a',
      name: 'Notification Functionality Testing',
      priority: 'HIGH',
      time: '5-7 min',
      description: 'Verify notification settings actually work when events are created and reminders are scheduled.',
      details: `**Preconditions:**
- User authenticated
- Circle created
- Notification permissions granted
- Notification settings configured (from TC-009)

**Test Steps:**
1. Configure notification settings:
   - Enable notifications
   - Enable "Event Reminders" only (disable others)
   - Set reminder timing to "15m"
   - Disable quiet hours
2. Create a standard event:
   - Title: "Test Notification Event"
   - Set start time to 5 minutes from now
   - Set reminder to "15 minutes before"
   - Save event
3. Wait for notification (should arrive 15 minutes before event)
4. Verify notification appears
5. Verify notification title and body are correct
6. Create a handover event:
   - Set reminder to "15 minutes before"
   - Save event
7. Verify NO notification arrives (handover reminders disabled)
8. Go back to Notification Settings
9. Enable "Handover Reminders"
10. Create another handover event with reminder
11. Verify notification arrives
12. Test quiet hours:
    - Enable quiet hours: 22:00 - 08:00
    - Create event with start time during quiet hours
    - Set reminder to trigger during quiet hours
    - Verify NO notification arrives during quiet hours
13. Create event with reminder outside quiet hours
14. Verify notification arrives outside quiet hours
15. Test reminder timing:
    - Change reminder timing to "1d" (1 day)
    - Create event 2 days from now
    - Verify notification arrives 1 day before event
    - Change reminder timing to "2d" (2 days)
    - Create event 3 days from now
    - Verify notification arrives 2 days before event
16. Test disabling notifications:
    - Disable "Enable Notifications"
    - Create event with reminder
    - Verify NO notification arrives

**Expected Results:**
- Notifications respect event type settings (only enabled types send notifications)
- Reminder timing works correctly (15m, 1d, 2d)
- Quiet hours prevent notifications during specified times
- Quiet hours allow notifications outside specified times
- Disabling notifications prevents all reminders
- Notification content (title, body) is correct
- Settings persist across app restarts`
    },
    {
      id: 'TC-010',
      name: 'Member Management',
      priority: 'HIGH',
      time: '3-4 min',
      description: 'View and manage circle members.',
      details: `**Preconditions:**
- Circle created
- At least 2 members in circle
- User is circle creator

**Test Steps:**
1. Navigate to Settings > Overview > Manage Members
2. Verify all members display with names (not user IDs)
3. Verify member count is correct (no duplicates)
4. Verify share modal functionality available
5. Tap "Share circle"
6. Verify share modal opens
7. Verify invite code is tappable and copies
8. As circle creator, verify remove member option available
9. Attempt to remove another member
10. Verify confirmation dialog appears
11. Confirm removal
12. Verify member removed successfully

**Expected Results:**
- All members display with correct names
- No duplicate members shown
- Member count accurate
- Share modal works correctly
- Invite code copyable
- Circle creator can remove members
- Removal confirmation works
- Removed member no longer appears in list`
    },
    {
      id: 'TC-011',
      name: 'Event Privacy and Assignment',
      priority: 'MEDIUM',
      time: '3-4 min',
      description: 'Set event privacy and assign to specific members.',
      details: `**Preconditions:**
- Circle created
- At least 2 members in circle

**Test Steps:**
1. Create new standard event
2. Scroll to "Privacy" section
3. Select "Selected adults"
4. Verify member selection UI appears
5. Select specific members
6. Verify selection count updates
7. Scroll to "Assigned to" section
8. Verify "All adults" and individual member pills appear
9. Select specific member
10. Verify member name displays correctly (not user ID)
11. Save event
12. Verify event displays assigned member correctly

**Expected Results:**
- Privacy options work correctly
- Member selection for privacy works
- "Assigned to" section displays member names correctly
- No duplicate members in selection
- Assignment saves correctly
- Assigned member displays on event card`
    },
    {
      id: 'TC-012',
      name: 'Sign Out and Sign In Flow',
      priority: 'HIGH',
      time: '2-3 min',
      description: 'Verify sign out clears data and new sign in works correctly.',
      details: `**Preconditions:**
- User authenticated
- Circle created
- Some data in app

**Test Steps:**
1. Navigate to Settings > Account
2. Scroll to bottom
3. Tap "Sign Out"
4. Verify confirmation dialog appears
5. Confirm sign out
6. Verify app returns to welcome/auth screen
7. Sign in with different Google account
8. Verify no data from previous account loads
9. Verify no permission errors in console
10. Create new circle
11. Verify new circle loads correctly

**Expected Results:**
- Sign out works correctly
- All user data cleared on sign out
- No previous account data persists
- New sign in works without errors
- No permission errors in logs
- New circle creation works correctly`
    },
    {
      id: 'TC-013',
      name: 'Circle Switching',
      priority: 'MEDIUM',
      time: '2-3 min',
      description: 'Switch between multiple circles.',
      details: `**Preconditions:**
- User belongs to at least 2 circles

**Test Steps:**
1. On home screen, verify active circle name displays
2. If multiple circles, verify circle chips appear
3. Tap on different circle chip
4. Verify circle switches
5. Verify circle-specific data loads (events, members, etc.)
6. Navigate to Settings
7. Verify settings reflect current circle
8. Switch circle from Settings if available
9. Verify switch works correctly

**Expected Results:**
- Circle chips display correctly
- Circle switching works smoothly
- Circle-specific data loads correctly
- No data from previous circle persists
- Settings reflect current circle`
    },
    {
      id: 'TC-014',
      name: 'UK Spelling Verification',
      priority: 'LOW',
      time: '2 min',
      description: 'Verify UK spelling used throughout app.',
      details: `**Test Steps:**
1. Navigate through all screens
2. Check for "authorise" (not "authorize")
3. Check for "authorisation" (not "authorization")
4. Check for "organised" (not "organized")
5. Verify no American spellings in user-facing text

**Expected Results:**
- All user-facing text uses UK spelling
- No American spellings found
- Consistent spelling throughout app`
    },
    {
      id: 'TC-015',
      name: 'Calendar Alignment Warning',
      priority: 'MEDIUM',
      time: '3-4 min',
      description: 'Verify calendar alignment warning appears correctly.',
      details: `**Preconditions:**
- Circle created
- Two members in same circle
- Both members have Google Calendar connected

**Test Steps:**
1. As circle creator, select a calendar
2. Verify calendar becomes default for circle
3. As second member, connect Google Calendar
4. Verify default calendar is pre-selected
5. Select different calendar than default
6. Verify warning alert appears
7. Verify alert message is privacy-friendly (no other users' calendar names)
8. Choose "Reselect calendar"
9. Select default calendar
10. Verify no warning appears
11. Verify calendar pill shows green on home screen

**Expected Results:**
- Default calendar set when creator selects
- Default calendar pre-selected for new members
- Warning appears when selecting different calendar
- Warning message is privacy-friendly
- Calendar alignment status (green/red) reflects correctly
- Alert appears at correct time (when selecting, not after)`
    },
    {
      id: 'TC-016',
      name: 'Back Button Text Consistency',
      priority: 'LOW',
      time: '1-2 min',
      description: 'Verify back button shows "< Back" not "< MainTabs".',
      details: `**Test Steps:**
1. Navigate to Settings > Overview > Manage Members
2. Verify back button shows "< Back"
3. Navigate to Settings > Account > Notification Preferences
4. Verify back button shows "< Back"
5. Navigate to any sub-screen
6. Verify back button text is consistent

**Expected Results:**
- All back buttons show "< Back"
- No "< MainTabs" text appears
- Consistent navigation experience`
    },
    {
      id: 'TC-017',
      name: 'Duplicate Member Prevention',
      priority: 'HIGH',
      time: '2-3 min',
      description: 'Verify no duplicate members appear in selection lists.',
      details: `**Preconditions:**
- Circle created
- User is member of circle

**Test Steps:**
1. Create new event
2. Navigate to "Assigned to" section
3. Verify user appears only once
4. Navigate to "Privacy" > "Selected adults"
5. Verify user appears only once
6. Navigate to Handover event creation
7. Verify members appear only once in "From:"/"To:" sections
8. Navigate to Gift modal
9. Verify members appear only once in "Assign to"

**Expected Results:**
- No duplicate members in any selection list
- User appears only once everywhere
- Member names display correctly (not user IDs)`
    },
    {
      id: 'TC-018',
      name: 'Invite Code Validation',
      priority: 'HIGH',
      time: '2-3 min',
      description: 'Verify invite codes don\'t contain ambiguous characters.',
      details: `**Test Steps:**
1. Create circle
2. Open share modal
3. Verify invite code displayed
4. Check code contains no '0', 'O', 'o', 'I', 'L', '1'
5. Copy invite code
6. Verify code pastes correctly
7. Use code to join circle
8. Verify code works correctly

**Expected Results:**
- Invite codes contain only unambiguous characters
- No '0', 'O', 'o', 'I', 'L', '1' in codes
- Code is copyable
- Code works for joining circle`
    },
    {
      id: 'TC-019',
      name: 'Event Form Field Ordering',
      priority: 'MEDIUM',
      time: '2-3 min',
      description: 'Verify correct field order for handover events.',
      details: `**Preconditions:**
- Circle created

**Test Steps:**
1. Create new handover event
2. Verify field order:
   - Event type
   - Handover type
   - Tag
   - Title
   - Notes
3. Verify "From:"/"To:" appears based on handover type
4. Verify "Ends" date/time does NOT appear for handover
5. Verify other fields appear in correct order

**Expected Results:**
- Handover type appears beneath Event type
- Tag appears beneath Handover type
- Title appears beneath Tag
- Notes appears beneath Title
- Field order matches specification
- No "Ends" field for handover events`
    },
    {
      id: 'TC-020',
      name: 'Profile Sync and Display',
      priority: 'HIGH',
      time: '3-4 min',
      description: 'Verify member profiles sync and display correctly.',
      details: `**Preconditions:**
- Circle created
- At least 2 members in circle

**Test Steps:**
1. As first user, verify own name displays correctly
2. Verify other member's name displays (not user ID)
3. Sign out
4. Sign in as second user
5. Verify second user's name displays correctly
6. Verify first user's name displays correctly
7. Check Settings > Overview > Manage Members
8. Verify all member names display correctly
9. Verify no partial user IDs shown

**Expected Results:**
- All member names display correctly
- No user IDs shown (except as fallback)
- Profile sync works automatically
- Names update when profiles sync
- No "Loading..." states persist`
    },
    {
      id: 'TC-021',
      name: 'Settings Overview Tab Components',
      priority: 'HIGH',
      time: '4-5 min',
      description: 'Verify all components and links in Settings Overview tab work correctly.',
      details: `**Preconditions:**
- User authenticated
- Circle created
- At least one child profile added
- Google Calendar connected (optional)

**Test Steps:**
1. Navigate to Settings screen
2. Verify "Overview" tab is selected by default
3. Verify "Members" card displays:
   - Correct member count
   - "Manage Members" link
4. Tap "Manage Members"
5. Verify CircleMembersScreen opens
6. Navigate back to Settings
7. Verify "Calendar sync" card displays:
   - Connection status
   - "Calendar connections" button
8. Tap "Calendar connections"
9. Verify ConnectionsScreen opens
10. Navigate back to Settings
11. Verify "Child profiles" card displays:
   - Child count or "Add first child" message
   - "Manage profiles" link
12. Tap "Manage profiles"
13. Verify CircleChildProfilesScreen opens
14. Navigate back to Settings
15. Verify "Wellbeing logs" card displays (if applicable)
16. Verify "Events" card displays (if applicable)
17. Verify "Analytics" card displays (if applicable)
18. Verify all cards are theme-aware (test in dark mode)
19. Verify all links navigate correctly
20. Verify no broken links or missing components

**Expected Results:**
- All cards display correctly
- Member count is accurate (no duplicates)
- Calendar sync status displays correctly
- All links navigate to correct screens
- Calendar sync component positioned correctly (under Members)
- All components support dark mode
- No broken or missing links`
    },
    {
      id: 'TC-022',
      name: 'Settings Account Tab Components',
      priority: 'HIGH',
      time: '4-5 min',
      description: 'Verify all components and links in Settings Account tab work correctly.',
      details: `**Preconditions:**
- User authenticated
- Circle created

**Test Steps:**
1. Navigate to Settings screen
2. Tap "Account" tab
3. Verify "Rename circle" card displays (if active circle exists):
   - Circle name input field
   - "Save name" button
4. Test renaming circle:
   - Change circle name
   - Tap "Save name"
   - Verify name updates
5. Verify "Create or Join Circle" card displays:
   - "Create a new circle" button
   - "Join with an invite" button
6. Tap "Create a new circle"
7. Verify CreateCircleScreen opens
8. Navigate back to Settings
9. Tap "Join with an invite"
10. Verify JoinCircleScreen opens
11. Navigate back to Settings
12. Verify "Subscription" card displays:
   - Subscription status
   - "Manage Subscription" link
13. Tap "Manage Subscription"
14. Verify PremiumGateModal opens
15. Verify modal can be dismissed
16. Verify "Notification Preferences" card displays:
   - "Manage Notifications" link
17. Tap "Manage Notifications"
18. Verify NotificationSettingsScreen opens
19. Navigate back to Settings
20. Verify "Theme" card displays:
   - System/Light/Dark options
   - Current selection highlighted
21. Test theme switching:
   - Select "Dark"
   - Verify dark mode applies
   - Select "Light"
   - Verify light mode applies
   - Select "System"
   - Verify system theme applies
22. Verify "Legal & Policies" card displays:
   - "Privacy Policy" link
   - "Terms & Conditions" link
23. Tap "Privacy Policy"
24. Verify browser opens to: https://www.arcturusdc.com/apps/toume/privacy-policy
25. Close browser and return to app
26. Tap "Terms & Conditions"
27. Verify browser opens to: https://www.arcturusdc.com/apps/toume/terms
28. Close browser and return to app
29. Verify "Account Actions" card displays:
   - "Sign Out" link
   - "Delete Data or Account" link (in destructive/red text)
30. Tap "Delete Data or Account"
31. Verify alert dialog appears with options:
   - "Delete Data Only"
   - "Delete Account"
   - "Cancel"
32. Tap "Delete Data Only"
33. Verify alert shows: "This feature is coming soon. Contact help@arcturusdc.com for assistance."
34. Dismiss alert
35. Tap "Delete Data or Account" again
36. Tap "Delete Account"
37. Verify alert shows: "This feature is coming soon. Contact help@arcturusdc.com for assistance."
38. Verify "Reviewer Mode" card displays (if applicable)
39. Verify all components are theme-aware
40. Verify all links navigate correctly
41. Verify no broken links or missing components

**Expected Results:**
- All cards display correctly
- "Create or Join Circle" card positioned between "Rename circle" and "Subscription"
- Rename circle functionality works
- Create/Join circle buttons navigate correctly
- Subscription management opens premium modal
- Notification settings screen accessible
- Theme switching works correctly
- Privacy Policy link opens correct URL in browser
- Terms & Conditions link opens correct URL in browser
- Delete Data/Account shows appropriate "coming soon" messages
- Delete Data/Account link styled in destructive/red text
- All components support dark mode
- All links navigate to correct screens
- No broken or missing links`
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

  if (tenantLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Loading workspace…
        </div>
      </main>
    );
  }

  if (!currentTenant) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-amber-900">No Workspace Access</h2>
          <p className="mb-4 text-sm text-amber-700">
            You don&apos;t have access to any workspaces yet. Contact your administrator.
          </p>
          <Link
            href="/apps/stea"
            className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
          >
            Back to STEa
          </Link>
        </div>
      </main>
    );
  }

  // Check if user has access to Tou.me testing portal
  const isSuperAdmin = SUPER_ADMINS.includes(user?.email || '');
  const hasAccess = isSuperAdmin || ALLOWED_TENANT_NAMES.includes(currentTenant?.name || '');

  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-red-900">Access Restricted</h2>
          <p className="mb-1 text-red-700">
            The Tou.me Testing Portal is only available to the ArcturusDC workspace.
          </p>
          <p className="mb-6 text-sm text-red-600">
            Your current workspace: <strong>{currentTenant?.name}</strong>
          </p>
          <Link
            href="/apps/stea/hans"
            className="inline-block rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Return to Hans Dashboard
          </Link>
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
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-extrabold text-red-600">🧪 Tou.me Testing Portal</div>
              <div className="text-muted text-sm">Internal testing for team and user group</div>
            </div>
            <TenantSwitcher className="ml-auto" />
          </div>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-medium">{test.id}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${priorityColors[test.priority]}`}>
                        {test.priority}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">{test.time}</span>
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">{test.name}</h3>
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

                  <div className="flex gap-2 sm:ml-4 flex-shrink-0">
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
