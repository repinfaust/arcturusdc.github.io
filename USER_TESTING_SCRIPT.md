# tou.me User Testing Script
**Version:** 1.0
**Last Updated:** 2025-10-22
**Purpose:** Manual user testing before production release

---

## Testing Overview

This document contains structured test cases for manual user testing. Each test includes:
- **Preconditions**: Device/network state required
- **Steps**: Specific actions to perform
- **Expected Results**: What should happen
- **Success/Failure Criteria**: Clear pass/fail definitions
- **Feedback Questions**: What to ask testers

### Testing Environment
- **Devices**: iOS (iPhone) and Android (Pixel/Samsung)
- **Network**: WiFi (primary), 4G (select tests), Offline (TC-014)
- **Test Accounts**: Use fresh accounts for critical flows

---

## 🔴 CRITICAL TEST CASES
*Must pass before release*

---

### TC-001a: First-Time User Onboarding

**Priority:** 🔴 Critical
**Estimated Time:** 2-3 minutes
**Preconditions:**
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
- "Done" dismisses tour and shows appropriate next screen

**Success Criteria:**
- ✅ Tour appears automatically for new user
- ✅ All 6 tour steps complete without errors
- ✅ Modal doesn't obscure content being described
- ✅ Navigation matches tour instructions
- ✅ User lands on circle creation/join screen

**Failure Criteria:**
- ❌ Tour doesn't appear
- ❌ Crash during tour
- ❌ Modal covers >50% of screen
- ❌ Wrong screens shown during tour
- ❌ Stuck on any step

**Tester Feedback Questions:**
1. **Clarity (1-5):** Did you understand what each tour step was showing you?
2. **Visibility (1-5):** Could you see the screen features being described?
3. **Issues:** What was confusing or unclear?
4. **Pacing:** Was the tour too fast, too slow, or just right?
5. **Value:** Did the tour help you understand the app?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-001b: Core Setup Flow

**Priority:** 🔴 Critical
**Estimated Time:** 3-5 minutes
**Preconditions:**
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
- No crashes or data loss

**Success Criteria:**
- ✅ Circle created in <10 seconds
- ✅ User remains in their created circle
- ✅ Child profile saved and visible
- ✅ Event created and displayed correctly
- ✅ All data persists after navigation

**Failure Criteria:**
- ❌ Circle creation times out
- ❌ User switched to different circle
- ❌ Data loss on navigation
- ❌ Crash during any step

**Tester Feedback Questions:**
1. **Flow (1-5):** How natural did this setup process feel?
2. **Clarity (1-5):** Were the steps obvious?
3. **Obstacles:** Where did you hesitate or get confused?
4. **Missing:** What information did you expect but not find?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-002: Circle Creation and Member Invitation

**Priority:** 🔴 Critical
**Estimated Time:** 5-7 minutes
**Preconditions:**
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
- Real-time update when member joins

**Success Criteria:**
- ✅ Invite link works on first attempt
- ✅ User B joins circle successfully
- ✅ Both users see updated member list
- ✅ Appropriate permissions assigned
- ✅ No orphaned invites or errors

**Failure Criteria:**
- ❌ Invite link doesn't work
- ❌ App doesn't open from link
- ❌ Acceptance fails or hangs
- ❌ Member doesn't appear in list
- ❌ Incorrect permissions

**Tester Feedback Questions:**
1. **Ease (1-5):** How easy was it to invite someone?
2. **Clarity (1-5):** Was the invitation process clear?
3. **Issues:** Any confusion or errors during acceptance?
4. **Expectations:** Did the invitation work as you expected?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-003: Event Creation with Privacy Controls

**Priority:** 🔴 Critical
**Estimated Time:** 4-6 minutes
**Preconditions:**
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

**User A:**
16. Create second event: "Hidden Test Event"
17. Set privacy to "Hidden"
18. Save event

**User B:**
19. Check if "Hidden Test Event" appears
20. Note the difference in visibility vs Private

**Expected Results:**
- Privacy options clearly labeled
- "Private" events invisible to other users
- "Visible" events shown to all circle members
- "Hidden" events shown but with limited details
- Privacy indicators visible on events
- Changes sync in real-time

**Success Criteria:**
- ✅ Privacy settings work as described
- ✅ User B cannot see Private events
- ✅ Privacy changes sync within 10 seconds
- ✅ Clear visual indicators for each privacy level
- ✅ No data leaks between privacy levels

**Failure Criteria:**
- ❌ Private events visible to other users
- ❌ Privacy changes don't sync
- ❌ Unclear privacy indicators
- ❌ App crashes when setting privacy

**Tester Feedback Questions:**
1. **Understanding (1-5):** Did you understand each privacy level?
2. **Control (1-5):** Did you feel in control of who sees what?
3. **Clarity:** Was the difference between Private/Hidden/Visible clear?
4. **Concerns:** Any privacy concerns or confusion?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-006: Gift Reservation System

**Priority:** 🔴 Critical
**Estimated Time:** 4-5 minutes
**Preconditions:**
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
- Clear visual indicators for reservation status

**Success Criteria:**
- ✅ Only one user can reserve at a time
- ✅ Reservation status syncs within 10 seconds
- ✅ Clear indication of who reserved
- ✅ Unreserving works correctly
- ✅ No double-reservation bugs

**Failure Criteria:**
- ❌ Multiple users can reserve same gift
- ❌ Reservation status doesn't sync
- ❌ Can't unreserve gift
- ❌ Unclear who reserved the gift

**Tester Feedback Questions:**
1. **Clarity (1-5):** Was the reservation status clear?
2. **Control (1-5):** Did reserving/unreserving work as expected?
3. **Issues:** Any confusion about who reserved what?
4. **Trust:** Do you trust the system prevents double-buying?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-008: App Store Reviewer Access

**Priority:** 🔴 Critical
**Estimated Time:** 5-7 minutes
**Preconditions:**
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
- Clean return to normal app state

**Success Criteria:**
- ✅ Reviewer mode activates on 7 logo taps
- ✅ Reviewer badge visible and clear
- ✅ Demo data pre-populated
- ✅ All features testable:
  - Create circle
  - Add member
  - Create event
  - Add gift
  - Navigate all screens
- ✅ Exit returns to normal state
- ✅ No crashes in reviewer mode

**Failure Criteria:**
- ❌ Can't activate reviewer mode
- ❌ No visual indicator
- ❌ Features don't work in reviewer mode
- ❌ Can't exit reviewer mode
- ❌ Crash in reviewer mode

**Tester Feedback Questions:**
1. **Discovery (1-5):** Was it obvious you entered a special mode?
2. **Functionality (1-5):** Could you test all major features?
3. **Exit:** Was it clear how to exit reviewer mode?
4. **Feedback:** What would make this better for app reviewers?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-012: Data Deletion Compliance

**Priority:** 🔴 Critical (Legal Requirement)
**Estimated Time:** 3-5 minutes
**Preconditions:**
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
- Cannot sign back in with deleted account, OR
- Sign-in succeeds but all user data is gone
- User removed from all circles
- No orphaned data remains

**Success Criteria:**
- ✅ Clear deletion warning displayed
- ✅ Requires explicit confirmation
- ✅ Deletion completes successfully
- ✅ Account/data no longer accessible
- ✅ User removed from shared circles
- ✅ No orphaned references remain

**Failure Criteria:**
- ❌ Deletion fails silently
- ❌ Data still accessible after deletion
- ❌ User still appears in circles
- ❌ Can re-login with same data intact

**Tester Feedback Questions:**
1. **Clarity (1-5):** Was the deletion warning clear about consequences?
2. **Safety (1-5):** Did you feel protected from accidental deletion?
3. **Trust (1-5):** Do you trust your data was actually deleted?
4. **Concerns:** Any concerns about the deletion process?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-021: Tour Replay from Settings

**Priority:** 🔴 Critical (Recently Implemented)
**Estimated Time:** 2-3 minutes
**Preconditions:**
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
- No data loss or circle switching

**Success Criteria:**
- ✅ Tour modal appears on demand
- ✅ User stays in current circle (no switch to "Demo Family")
- ✅ All tour steps navigate correctly
- ✅ Modal doesn't obscure screen content
- ✅ Tour completes and dismisses cleanly
- ✅ No crashes or navigation errors

**Failure Criteria:**
- ❌ Tour doesn't appear
- ❌ User switches to different circle
- ❌ Navigation goes to wrong screens
- ❌ Crash during tour
- ❌ Stuck after tour completion
- ❌ Data loss or corruption

**Tester Feedback Questions:**
1. **Expectation (1-5):** Did the tour work as you expected?
2. **Concern (1-5):** Were you worried it would mess up your data?
3. **Value:** Would you replay the tour to remember features?
4. **Issues:** Any unexpected behavior?

**Notes Section:**
```
Current circle before tour: _____________
Current circle after tour: _____________
Any circle switching: Yes / No

Tester observations:
-
-
-
```

---

### TC-022: Circle Switching Stability

**Priority:** 🔴 Critical (Recently Stabilized)
**Estimated Time:** 4-6 minutes
**Preconditions:**
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
- Smooth tab animations

**Success Criteria:**
- ✅ Switching works reliably across 5+ switches
- ✅ Correct data loads for each circle
- ✅ Tab state persists per circle
- ✅ Last circle/tab restored on relaunch
- ✅ No crashes or data corruption
- ✅ Loading states visible during switches

**Failure Criteria:**
- ❌ App crashes during switching
- ❌ Wrong data displayed after switch
- ❌ Tabs don't persist per circle
- ❌ Loses last active circle on relaunch
- ❌ Mixing data between circles

**Tester Feedback Questions:**
1. **Speed (1-5):** Was switching between circles fast enough?
2. **Trust (1-5):** Did you trust the right data loaded?
3. **Expectations (1-5):** Did tab/circle memory work as expected?
4. **Issues:** Any confusion or incorrect data after switching?

**Notes Section:**
```
Number of circles tested: ___
Switching speed (fast/medium/slow): ___
Any crashes: Yes / No
Tab state preserved: Yes / No

Tester observations:
-
-
-
```

---

### TC-023: Invite Link Handling

**Priority:** 🔴 Critical
**Estimated Time:** 5-7 minutes
**Preconditions:**
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
- No orphaned invites

**Success Criteria:**
- ✅ Deep link opens app correctly
- ✅ Invite details clear and accurate
- ✅ Join process completes smoothly
- ✅ Real-time member list update
- ✅ Already-member case handled
- ✅ No duplicate memberships

**Failure Criteria:**
- ❌ Link opens browser instead of app
- ❌ Invite acceptance fails
- ❌ Circle doesn't appear in list
- ❌ Member not added to circle
- ❌ Crashes during join process

**Tester Feedback Questions:**
1. **Smoothness (1-5):** How smooth was the invite-to-join flow?
2. **Clarity (1-5):** Was it clear what you were joining?
3. **Issues:** Any confusion or errors?
4. **Expectations:** Did it work as you expected?

**Notes Section:**
```
Deep link worked: Yes / No
Invite accepted: Yes / No
Time to complete: ___ seconds

Tester observations:
-
-
-
```

---

## 🟠 HIGH PRIORITY TEST CASES
*Should pass before release*

---

### TC-004: Google Calendar Connection (Enhanced)

**Priority:** 🟠 High
**Estimated Time:** 5-8 minutes
**Preconditions:**
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
- Disconnection option available

**Success Criteria:**
- ✅ Successfully connects to Google Calendar
- ✅ Events display with clear type indicators
- ✅ Can add overlay metadata
- ✅ Sync works bi-directionally
- ✅ No confusion between calendar types
- ✅ Can disconnect and reconnect

**Failure Criteria:**
- ❌ OAuth fails
- ❌ Events don't sync
- ❌ Can't distinguish event types
- ❌ Editing Google events directly allowed
- ❌ Crash during sync

**Tester Feedback Questions:**
1. **Clarity (1-5):** Could you tell which events were from Google vs tou.me?
2. **Confusion (1-5):** How confusing was the calendar integration? (1=very, 5=not at all)
3. **Value (1-5):** How useful is this integration?
4. **Issues:** What was unclear about the calendar types?

**Notes Section:**
```
Multiple calendars available: Yes / No
Calendar selection shown: Yes / No
Sync time: ___ seconds
Clear event distinction: Yes / No

Tester observations:
-
-
-
```

---

### TC-005: Handover Creation and Completion

**Priority:** 🟠 High
**Estimated Time:** 5-7 minutes
**Preconditions:**
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
- Historical record maintained

**Success Criteria:**
- ✅ Handover created with all details
- ✅ Recipient notified
- ✅ Checklist syncs in real-time
- ✅ Inventory locations update on completion
- ✅ Both users see consistent state
- ✅ Completed handovers archived properly

**Failure Criteria:**
- ❌ Handover fails to create
- ❌ Inventory doesn't attach
- ❌ Checklist doesn't sync
- ❌ Locations don't update
- ❌ Data inconsistency between users

**Tester Feedback Questions:**
1. **Usefulness (1-5):** How useful is this handover feature?
2. **Clarity (1-5):** Was the process clear?
3. **Trust (1-5):** Did you trust the location updates were accurate?
4. **Issues:** What could make handovers more useful?

**Notes Section:**
```
Tester observations:
-
-
-
```

---

### TC-007: Real-Time Multi-User Updates

**Priority:** 🟠 High
**Estimated Time:** 4-6 minutes
**Preconditions:**
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
- No conflicts or data loss

**Success Criteria:**
- ✅ All updates sync within 10 seconds
- ✅ No manual refresh required
- ✅ No data conflicts
- ✅ Consistent state across devices
- ✅ Works across all data types

**Failure Criteria:**
- ❌ Updates take >30 seconds
- ❌ Requires manual refresh
- ❌ Data conflicts or loss
- ❌ Inconsistent state between users

**Tester Feedback Questions:**
1. **Speed (1-5):** Was real-time sync fast enough?
2. **Trust (1-5):** Did you trust you were seeing accurate data?
3. **Issues:** Any delays or sync problems?
4. **Expectations:** How fast did you expect updates to appear?

**Notes Section:**
```
Add item sync time: ___ seconds
Edit sync time: ___ seconds
Reservation sync time: ___ seconds
Event sync time: ___ seconds

Average sync time: ___ seconds
Manual refresh needed: Yes / No

Tester observations:
-
-
-
```

---

### TC-024: Dark Mode Theming

**Priority:** 🟠 High (Recently Added)
**Estimated Time:** 5-8 minutes
**Preconditions:**
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
6. Navigate through same screens in Dark mode:
   - Home
   - Inventory
   - Schedule
   - Circle Settings
   - User Settings
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
- Theme preference persists across sessions

**Success Criteria:**
- ✅ All text readable in both modes
- ✅ No contrast issues found
- ✅ Smooth theme transitions
- ✅ Theme persists across app restarts
- ✅ All screens properly themed
- ✅ Modals/dialogs properly themed

**Failure Criteria:**
- ❌ Any unreadable text
- ❌ White-on-white or black-on-black issues
- ❌ Buttons invisible or hard to see
- ❌ Theme doesn't persist
- ❌ Jarring transition animations

**Tester Feedback Questions:**
1. **Readability (1-5):** How readable was text in both modes?
2. **Preference:** Which mode do you prefer and why?
3. **Issues:** Any screens with poor contrast?
4. **Expectations:** Did the dark mode match your expectations?

**Notes Section:**
```
Screens with readability issues:
Light mode:
Dark mode:

Contrast problems found: Yes / No
Details:

Tester observations:
-
-
-
```

---

### TC-025: Tour Modal UX Validation

**Priority:** 🟠 High (Recently Fixed)
**Estimated Time:** 3-5 minutes
**Preconditions:**
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
- **Modal Size:** Should be ~40% of screen height, bottom-aligned
- **Backdrop:** Should be light enough to see behind (40% opacity)
- **Readability:** Modal content easily readable
- **Visibility:** Screen features behind modal clearly visible
- **Animations:** Smooth slide-up/down, no janky movements
- **Controls:** Previous/Next/Skip/Done all work correctly

**Expected Results:**
- Modal appears at bottom, not center
- Modal takes up ~40% or less of screen height
- Very light backdrop (semi-transparent)
- Can clearly see and understand screen behind modal
- Modal content readable and clear
- Smooth animations
- All navigation controls work
- Progress dots update correctly

**Success Criteria:**
- ✅ Modal height ≤40% of screen
- ✅ Backdrop light enough to see behind
- ✅ Can identify features being described
- ✅ Modal not obtrusive or annoying
- ✅ All controls work smoothly
- ✅ Animations are smooth

**Failure Criteria:**
- ❌ Modal covers >50% of screen
- ❌ Can't see content behind modal
- ❌ Modal blocks the feature being described
- ❌ Navigation buttons don't work
- ❌ Janky animations

**Tester Feedback Questions:**
1. **Visibility (1-5):** Could you see the features being described?
2. **Obtrusiveness (1-5):** How obtrusive was the modal? (1=very, 5=not at all)
3. **Usefulness (1-5):** Did the tour help you understand the app?
4. **Issues:** What would improve the tour experience?
5. **Comparison:** How does this compare to other app tours you've seen?

**Notes Section:**
```
Estimated modal height: ___% of screen
Backdrop opacity (light/medium/heavy): ___
Could see behind modal: Yes / No
Features visible and identifiable: Yes / No
Animation quality (smooth/choppy): ___

Tester observations:
-
-
-
```

---

### TC-026: Welcome Screen Transition

**Priority:** 🟠 High (Recent Timing Fix)
**Estimated Time:** 2-3 minutes
**Preconditions:**
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
- Welcome screen doesn't repeat unnecessarily

**Success Criteria:**
- ✅ Welcome screen appears for eligible users
- ✅ Transition completes within 3 seconds
- ✅ No freezing or hanging
- ✅ Appropriate next screen shown
- ✅ Welcome doesn't repeat after first view
- ✅ Loading state visible during delay

**Failure Criteria:**
- ❌ Transition takes >5 seconds
- ❌ App freezes/hangs
- ❌ Welcome screen repeats every launch
- ❌ Wrong screen after welcome
- ❌ No loading indicator during delay

**Tester Feedback Questions:**
1. **Wait Time (1-5):** How did the transition timing feel? (1=too slow, 5=perfect)
2. **Expectations:** What did you expect after tapping Continue?
3. **Issues:** Any confusion or delays?

**Notes Section:**
```
Transition time: ___ seconds
Loading indicator visible: Yes / No
Hung or froze: Yes / No

Tester observations:
-
-
-
```

---

### TC-027: Household Query Performance

**Priority:** 🟠 High
**Estimated Time:** 6-10 minutes
**Preconditions:**
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
- No noticeable lag during navigation

**Success Criteria:**
- ✅ All load times within acceptable ranges
- ✅ Smooth scrolling
- ✅ No crashes with loaded data
- ✅ Consistent performance across operations
- ✅ No memory warnings

**Failure Criteria:**
- ❌ Load times >2x expected
- ❌ Visible stuttering or lag
- ❌ Crashes with normal data load
- ❌ Degraded performance over time

**Tester Feedback Questions:**
1. **Speed (1-5):** How fast did the app feel overall?
2. **Smoothness (1-5):** How smooth were animations and scrolling?
3. **Frustration:** Any moments of frustration waiting?
4. **Expectations:** Was performance better or worse than expected?

**Notes Section:**
```
App launch: ___ seconds
Inventory tab: ___ seconds
Schedule tab: ___ seconds
Circle switch: ___ seconds
Event details: ___ seconds

Lag observed: Yes / No
Where: ___

Stuttering observed: Yes / No
Where: ___

Tester observations:
-
-
-
```

---

### TC-028: Function Timeout Handling

**Priority:** 🟠 High
**Estimated Time:** 4-6 minutes
**Preconditions:**
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
- User not stuck on loading screen forever

**Success Criteria:**
- ✅ No crashes during timeout
- ✅ User feedback provided (loading, timeout msg)
- ✅ Eventually syncs when network improves
- ✅ User can retry or cancel
- ✅ Offline errors are clear and helpful

**Failure Criteria:**
- ❌ App crashes on timeout
- ❌ Stuck in loading state forever
- ❌ No feedback to user
- ❌ Data loss on timeout
- ❌ No way to retry

**Tester Feedback Questions:**
1. **Clarity (1-5):** Were errors/timeouts explained clearly?
2. **Control (1-5):** Did you feel in control during delays?
3. **Frustration (1-5):** How frustrating was the timeout? (1=very, 5=not at all)
4. **Recovery:** Could you recover from the timeout easily?

**Notes Section:**
```
Timeout occurred: Yes / No
Time until timeout: ___ seconds
Error message shown: Yes / No
Message: ___

Eventually synced: Yes / No
Recovery options clear: Yes / No

Tester observations:
-
-
-
```

---

## 🟡 MEDIUM PRIORITY TEST CASES
*Nice to validate before release*

---

### TC-009: Inventory Location Tracking

**Priority:** 🟡 Medium
**Estimated Time:** 5-7 minutes
**Preconditions:**
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
- Both users see consistent location

**Success Criteria:**
- ✅ Location updates accurately
- ✅ History maintained
- ✅ Consistent across users

**Failure Criteria:**
- ❌ Location doesn't update
- ❌ Incorrect location shown
- ❌ No history tracking

**Notes Section:**
```
Tester observations:
-
-
```

---

### TC-010: Calendar Conflict Detection

**Priority:** 🟡 Medium
**Estimated Time:** 4-6 minutes
**Preconditions:**
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
- Easy to identify conflicts in calendar view

**Success Criteria:**
- ✅ Conflicts detected
- ✅ Clear indication shown
- ✅ Easy to resolve

**Failure Criteria:**
- ❌ Conflicts not detected
- ❌ No visual indication
- ❌ Confusion about overlaps

**Notes Section:**
```
Tester observations:
-
-
```

---

### TC-011: Permission Enforcement

**Priority:** 🟡 Medium
**Estimated Time:** 4-6 minutes
**Preconditions:**
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
- No confusion about permissions

**Success Criteria:**
- ✅ Permissions enforced correctly
- ✅ Clear feedback on blocked actions
- ✅ No privilege escalation bugs

**Failure Criteria:**
- ❌ Permissions not enforced
- ❌ Trusted Adults can delete circles
- ❌ Unclear error messages

**Notes Section:**
```
Tester observations:
-
-
```

---

### TC-013: Large Circle Performance

**Priority:** 🟡 Medium
**Estimated Time:** 10-15 minutes
**Preconditions:**
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
- No crashes with large datasets

**Success Criteria:**
- ✅ App remains responsive
- ✅ Load times acceptable
- ✅ No crashes

**Failure Criteria:**
- ❌ Severe lag
- ❌ Crashes with data
- ❌ >10 second load times

**Notes Section:**
```
Load time: ___ seconds
Scrolling (smooth/choppy): ___
Search time: ___ seconds

Tester observations:
-
-
```

---

### TC-014: Offline/Online Synchronization

**Priority:** 🟡 Medium
**Estimated Time:** 5-7 minutes
**Preconditions:**
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
- Conflicts handled gracefully

**Success Criteria:**
- ✅ Offline state indicated
- ✅ Data syncs when online
- ✅ No data loss

**Failure Criteria:**
- ❌ Data loss offline
- ❌ Doesn't sync online
- ❌ Crashes when reconnecting

**Notes Section:**
```
Offline indicator present: Yes / No
Data synced: Yes / No
Sync time: ___ seconds

Tester observations:
-
-
```

---

### TC-015: File Upload Security

**Priority:** 🟡 Medium
**Estimated Time:** 5-7 minutes
**Preconditions:**
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
- Invalid uploads blocked gracefully

**Success Criteria:**
- ✅ Size limits enforced
- ✅ Type validation works
- ✅ Clear error messages
- ✅ Valid uploads succeed

**Failure Criteria:**
- ❌ Accepts invalid files
- ❌ No size limits
- ❌ Crash on bad file

**Notes Section:**
```
Max file size: ___ MB
Allowed types: ___
Error messages clear: Yes / No

Tester observations:
-
-
```

---

### TC-016: App Crash Prevention

**Priority:** 🟡 Medium
**Estimated Time:** 5-8 minutes
**Preconditions:**
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
- App recovers from interruptions

**Success Criteria:**
- ✅ Zero crashes
- ✅ All errors handled gracefully
- ✅ App recovers from interruptions

**Failure Criteria:**
- ❌ Any crashes
- ❌ Frozen/unresponsive
- ❌ Bad data saved

**Notes Section:**
```
Crashes encountered: ___
Frozen screens: ___
Unhandled errors: ___

Tester observations:
-
-
```

---

### TC-017: Onboarding Completion Rate

**Priority:** 🟡 Medium
**Estimated Time:** 5-10 minutes
**Preconditions:**
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
- Completed within 10 minutes

**Success Criteria:**
- ✅ Can complete without external help
- ✅ Clear at each step
- ✅ Completes in reasonable time

**Failure Criteria:**
- ❌ Gets stuck or confused
- ❌ Gives up during onboarding
- ❌ Requires external help

**Tester Feedback Questions:**
1. **Overall (1-5):** How smooth was onboarding?
2. **Confusion Points:** Where were you most confused?
3. **Improvements:** What would have helped?
4. **Completion:** Did you feel accomplished after?

**Notes Section:**
```
Confusing steps:
1.
2.
3.

Time to complete: ___ minutes
Gave up at any point: Yes / No

Tester observations:
-
-
```

---

### TC-019: Accessibility Basics

**Priority:** 🟡 Medium
**Estimated Time:** 8-10 minutes
**Preconditions:**
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
- Touch targets adequate size

**Success Criteria:**
- ✅ Screen reader works on main screens
- ✅ Text scales appropriately
- ✅ Adequate contrast
- ✅ Touch targets sufficient size

**Failure Criteria:**
- ❌ Screen reader doesn't work
- ❌ Text cutoff at large sizes
- ❌ Poor contrast
- ❌ Touch targets too small

**Notes Section:**
```
Screen reader usable: Yes / No
Issues found: ___

Font scaling works: Yes / No
Text cutoff: Yes / No

Contrast issues: Yes / No
Where: ___

Tester observations:
-
-
```

---

### TC-020: Cross-Platform Consistency

**Priority:** 🟡 Medium
**Estimated Time:** 15-20 minutes
**Preconditions:**
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
- Platform-specific features acceptable

**Success Criteria:**
- ✅ All core features on both platforms
- ✅ Data syncs reliably
- ✅ Comparable user experience

**Failure Criteria:**
- ❌ Major features missing on one platform
- ❌ Significantly worse performance
- ❌ Data doesn't sync

**Notes Section:**
```
iOS-only features: ___
Android-only features: ___

Performance comparison (iOS/Android better/same): ___

Visual differences noted: ___

Tester observations:
-
-
```

---

### TC-029: Toast Notifications

**Priority:** 🟡 Medium
**Estimated Time:** 3-5 minutes
**Preconditions:**
- User signed in

**Test Steps:**
1. Create and save gift
2. Observe success toast
3. Note toast position, duration
4. Try to interact with screen during toast
5. Delete item
6. Observe delete confirmation toast
7. Trigger error (e.g., network off)
8. Observe error toast
9. Create multiple items quickly
10. Observe toast stacking/queuing
11. Note if toasts block critical UI

**Expected Results:**
- Toasts appear for key actions
- Clear messages
- Auto-dismiss (3-5 seconds)
- Don't block critical UI
- Multiple toasts queue properly
- Easy to dismiss if needed

**Success Criteria:**
- ✅ Toasts appear for key actions
- ✅ Clear and readable
- ✅ Don't block UI
- ✅ Auto-dismiss

**Failure Criteria:**
- ❌ No feedback on actions
- ❌ Toasts block buttons
- ❌ Unclear messages
- ❌ Don't dismiss

**Notes Section:**
```
Toast position: ___
Duration: ___ seconds
Block UI: Yes / No

Tester observations:
-
-
```

---

### TC-030: Error Boundary Behavior

**Priority:** 🟡 Medium
**Estimated Time:** 3-5 minutes
**Preconditions:**
- User signed in
- Ability to force error (developer assistance)

**Test Steps:**
1. (With dev help) Force component error
2. Observe error boundary catches it
3. Note error screen appearance
4. Check if error details shown
5. Look for recovery options
6. Try to recover or restart
7. Verify app doesn't fully crash

**Expected Results:**
- Error boundary catches errors
- Graceful error screen shown
- Option to recover or reload
- User data preserved
- Error logged for developers

**Success Criteria:**
- ✅ Error caught by boundary
- ✅ Graceful error screen
- ✅ Recovery option available
- ✅ No full app crash

**Failure Criteria:**
- ❌ Full app crash
- ❌ White screen of death
- ❌ No recovery option
- ❌ Data loss

**Notes Section:**
```
Error caught: Yes / No
Error screen clear: Yes / No
Recovery worked: Yes / No

Tester observations:
-
-
```

---

### TC-031: Consent Modal Flow

**Priority:** 🟡 Medium (Legal Requirement)
**Estimated Time:** 3-5 minutes
**Preconditions:**
- Fresh install OR cleared app data
- User ready to sign in

**Test Steps:**
1. Launch app (fresh install)
2. Begin sign-in process
3. Observe if consent modal appears
4. Read consent text
5. Note clarity of options (Accept/Decline)
6. Tap "Decline" for analytics
7. Verify preference saved
8. Complete sign-in
9. Navigate to Settings
10. Find privacy/consent settings
11. Verify can change preference
12. Change consent to "Accept"
13. Sign out and sign in again
14. Verify consent not re-requested
15. (With dev help) Clear consent data
16. Verify consent modal re-appears

**Expected Results:**
- Consent modal appears for new users
- Clear explanation of data usage
- Accept/Decline options clear
- Preference saved and respected
- Can change preference in Settings
- Modal doesn't re-appear unnecessarily
- Analytics respect user choice

**Success Criteria:**
- ✅ Consent modal appears for new users
- ✅ Options clear and respected
- ✅ Preference saved
- ✅ Can change in Settings
- ✅ Analytics respect choice

**Failure Criteria:**
- ❌ No consent modal
- ❌ Unclear options
- ❌ Preference not saved
- ❌ Analytics sent despite decline

**Notes Section:**
```
Consent modal appeared: Yes / No
Text clarity (1-5): ___
Options clear (1-5): ___
Preference respected: Yes / No

Tester observations:
-
-
```

---

### TC-032: Navigation Stack Integrity

**Priority:** 🟡 Medium
**Estimated Time:** 5-7 minutes
**Preconditions:**
- User signed in with circle

**Test Steps:**

**Deep Navigation:**
1. Home → Inventory → Add Gift → Save
2. Navigate: Schedule → Create Event → Save
3. Navigate: Circle Settings → Member Details → Edit
4. Use back button repeatedly
5. Verify logical back flow

**Force Navigation:**
6. From deep screen, tap Home tab
7. Verify stack cleared
8. Use back button
9. Verify doesn't go to previous deep screen

**Screen Replacement:**
10. From Home, create event
11. Complete event creation
12. Use back button
13. Verify proper screen (not creation form)

**Circle Switching:**
14. From deep screen, switch circle
15. Verify navigation reset
16. Use back button
17. Verify doesn't return to other circle

**Expected Results:**
- Logical back navigation
- Tab switches clear stack appropriately
- No stuck screens
- Circle switching resets navigation
- Back button never exits app unexpectedly

**Success Criteria:**
- ✅ Back button works logically
- ✅ No stuck screens
- ✅ Stack clears when appropriate
- ✅ Circle switch resets properly

**Failure Criteria:**
- ❌ Back button broken
- ❌ Stuck on screens
- ❌ Unexpected exits
- ❌ Cross-circle navigation corruption

**Notes Section:**
```
Back button issues: Yes / No
Where: ___

Stack corruption: Yes / No
Details: ___

Tester observations:
-
-
```

---

## 📊 GENERAL FEEDBACK SECTION

After completing all tests, please provide qualitative feedback:

### Overall Impressions
**What did you like most about the app?**
```


```

**What frustrated you the most?**
```


```

**What features felt missing?**
```


```

**How does it compare to similar apps you've used?**
```


```

### Specific Areas

**Visual Design (1-5):**
**Usability (1-5):**
**Performance (1-5):**
**Reliability (1-5):**
**Feature Completeness (1-5):**

**Would you recommend this app to parents/co-parents?**
☐ Definitely
☐ Probably
☐ Unsure
☐ Probably Not
☐ Definitely Not

**Why or why not?**
```


```

### Bug Reports
List any bugs not captured in specific test cases:

**Bug #1:**
```
Description:
Steps to reproduce:
Expected:
Actual:
Severity (Critical/High/Medium/Low):
```

**Bug #2:**
```
Description:
Steps to reproduce:
Expected:
Actual:
Severity (Critical/High/Medium/Low):
```

*(Add more as needed)*

---

## ✅ RELEASE READINESS CHECKLIST

Review this checklist after all testing is complete:

### Critical Tests (Must Pass)
- ☐ TC-001a: First-time onboarding passes
- ☐ TC-001b: Core setup flow passes
- ☐ TC-002: Invitation system works
- ☐ TC-003: Privacy controls enforced
- ☐ TC-006: Gift reservation system works
- ☐ TC-008: Reviewer access functional
- ☐ TC-012: Data deletion compliant
- ☐ TC-021: Tour replay works correctly
- ☐ TC-022: Circle switching stable
- ☐ TC-023: Invite links work

### High Priority Tests (Should Pass)
- ☐ TC-004: Google Calendar integration works
- ☐ TC-005: Handovers functional
- ☐ TC-007: Real-time sync works
- ☐ TC-024: Dark mode readable
- ☐ TC-025: Tour modal UX acceptable
- ☐ TC-026: Welcome transition smooth
- ☐ TC-027: Performance acceptable
- ☐ TC-028: Timeout handling graceful

### Quality Metrics
- ☐ Overall pass rate ≥ 90%
- ☐ No critical bugs outstanding
- ☐ No major UX blockers
- ☐ All legal requirements met (consent, deletion)

### Platform Validation
- ☐ Tour feature validated by 3+ testers
- ☐ Circle switching stable across 5+ switches per tester
- ☐ Dark mode readable on all tested screens
- ☐ No navigation stack corruption in any test
- ☐ Performance acceptable with realistic data loads

### Final Sign-Off
- ☐ All critical tests passing
- ☐ High priority tests passing or issues documented
- ☐ Known issues logged and prioritized
- ☐ Release notes prepared
- ☐ App Store reviewer access verified

**Tester Name:** ___________________
**Date:** ___________________
**Overall Recommendation:** ☐ Ready for Release  ☐ Needs Work  ☐ Not Ready

**Notes:**
```




```

---

## 📝 TESTING TIPS

### For Testers:
1. **Be thorough but realistic** - Test like a real user, not trying to break things
2. **Note first impressions** - Your initial confusion is valuable feedback
3. **Think out loud** - If possible, record your thoughts while testing
4. **Don't rush** - Take time to explore and understand each feature
5. **Be honest** - Negative feedback is valuable, don't hold back
6. **Use real scenarios** - Imagine you're actually planning your child's events

### For Test Coordinators:
1. **Provide clean devices** - Fresh installs for onboarding tests
2. **Prepare test accounts** - Have Google accounts ready
3. **Set up test network** - Ability to throttle or disable network
4. **Record sessions** - Screen recordings help identify issues
5. **Debrief testers** - Quick chat after testing captures additional insights
6. **Prioritize issues** - Not all bugs need fixing before release

---

**End of Testing Script**
