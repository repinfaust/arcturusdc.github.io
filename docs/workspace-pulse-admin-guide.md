# Workspace Pulse Dashboard - Admin Guide (Non-Technical)

This guide explains how to configure your Workspace Pulse dashboard **without any coding or technical knowledge**.

---

## Quick Start

### Step 1: Access the Admin Panel

1. Go to your STEa admin page: `/apps/stea/admin`
2. Scroll down to the **"Manage Workspace Apps"** section

### Step 2: Add Your Apps

1. In the **"Add New App"** field, type your app name exactly as it appears in your projects
   - Example: `SyncFit`, `Toume`, `Mandrake`
2. Click the **"Add"** button
3. Repeat for each app you want to track

### Step 3: Save Configuration

1. Click the green **"Save Configuration"** button
2. Wait for the success message: ✅ "Successfully saved X app(s)"
3. Done! Your dashboard will update within 15 minutes

---

## Understanding the Dashboard

### Section 1: App Progress & Health

**What you'll see:**
- **Dropdown filter** at the top right: "Filter by app:"
  - Select **"All Apps (Summary)"** to see combined metrics
  - Select a specific app to see only that app's data

**Three tiles:**
1. **Build Progress** 📊
   - How complete your app is
   - Number of epics and features
   - Open bugs
   - Last activity time

2. **Testing Snapshot** 🧪
   - Pass/fail rates
   - Coverage percentage
   - Tests awaiting retest

3. **Backlog Health** 📋
   - Cards ready for development
   - Cards in progress
   - Blocked items
   - Average cycle time

### Section 2: Workspace Insights

**No filtering** - these show workspace-wide metrics:

1. **Discovery Signals** 🔍
   - New notes created
   - JTBD drafts not promoted
   - Discovery coverage

2. **Documentation** 📚
   - New docs created
   - Updated this week
   - Percentage linked to cards

---

## Common Questions

### Q: What are "apps"?

**A:** Apps are the different products or projects in your workspace. For example:
- SyncFit (fitness app)
- Toume (testing platform)
- Mandrake (another project)

### Q: How do I know what to name my apps?

**A:** Use the **exact name** that appears when you create epics, features, or cards in Filo. The names are case-sensitive.

**Examples:**
- ✅ `SyncFit` (correct)
- ❌ `syncfit` (wrong - lowercase)
- ❌ `Sync Fit` (wrong - extra space)

### Q: When will I see data in the dashboard?

**A:** After saving your apps configuration:
1. Wait **15 minutes** for the next automatic aggregation
2. Or ask an admin to manually trigger aggregation
3. Then refresh the STEa home page (`/apps/stea`)

### Q: Can I remove apps later?

**A:** Yes! Just:
1. Go back to the admin panel
2. Click **"Remove"** next to the app name
3. Click **"Save Configuration"**

### Q: What if I don't see the "Manage Workspace Apps" section?

**A:** You need **super admin** permissions. Contact:
- repinfaust@gmail.com
- daryn.shaxted@gmail.com

---

## Step-by-Step Example

Let's say you have three apps: **SyncFit**, **Toume**, and **Mandrake**.

### Before Configuration:
- Dashboard shows mock/demo data
- No app dropdown visible

### After Configuration:

**1. Add Apps:**
```
Current Apps (3):
📱 SyncFit      [Remove]
📱 Toume        [Remove]
📱 Mandrake     [Remove]
```

**2. Save Configuration**
```
✅ Successfully saved 3 app(s). Dashboard will update on next aggregation.
```

**3. View Dashboard (after 15 mins):**
```
App Progress & Health          [Filter by app: All Apps (Summary) ▼]

Build Progress    Testing Snapshot    Backlog Health
   82%                 95%               3.2 days
  All Apps          pass rate            avg cycle
```

**4. Filter by Specific App:**
```
App Progress & Health          [Filter by app: SyncFit ▼]

Build Progress    Testing Snapshot    Backlog Health
   62%                 77%               2.9 days
  SyncFit           pass rate            avg cycle
```

---

## Troubleshooting

### Problem: Dashboard still shows demo data

**Solutions:**
1. Check if you saved the configuration (green success message)
2. Wait 15 minutes for aggregation
3. Hard refresh your browser: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
4. Check if app names match exactly (case-sensitive)

### Problem: App doesn't appear in dropdown

**Solutions:**
1. Make sure the app name is saved in the admin panel
2. Check that data exists for that app in Filo (epics, features, cards)
3. Wait for next aggregation cycle (every 15 minutes)

### Problem: Can't access admin panel

**Solutions:**
1. Make sure you're logged in with a super admin account
2. Navigate directly to: `/apps/stea/admin`
3. Contact a super admin if you need access

---

## Best Practices

### Do:
- ✅ Use consistent app naming across your workspace
- ✅ Keep the app list updated as you add/remove projects
- ✅ Use the "All Apps" view for executive summaries
- ✅ Filter by specific app when focusing on a single project

### Don't:
- ❌ Add test or fake app names
- ❌ Use different capitalization than your actual project data
- ❌ Expect instant updates (wait 15 minutes)
- ❌ Remove apps that still have active work

---

## What Happens Behind the Scenes

When you save your apps configuration:

1. **Immediately:** Apps list saved to Firestore database
2. **Every 15 minutes:** Cloud Function runs automatically
3. **Function actions:**
   - Reads your apps list
   - Queries Filo for epics, features, cards per app
   - Queries Hans for test results
   - Queries Harls for discovery notes
   - Queries Ruby for documentation
   - Calculates all metrics
   - Writes results to dashboard
4. **Your browser:** Real-time listener updates dashboard automatically

**You don't need to do anything after saving!** The system handles everything automatically.

---

## Need Help?

If you're stuck or something isn't working:

1. Check this guide first
2. Ask in your team's Slack/Discord
3. Contact the dev team or super admins:
   - repinfaust@gmail.com
   - daryn.shaxted@gmail.com

---

## Summary

**To configure your Workspace Pulse dashboard:**

1. Go to `/apps/stea/admin`
2. Find "Manage Workspace Apps" section
3. Type app name → Click "Add" → Repeat
4. Click "Save Configuration"
5. Wait 15 minutes
6. View dashboard at `/apps/stea`

**That's it!** No coding, no Firestore knowledge, no command line needed.

Your dashboard will show real-time metrics with easy filtering by app.
