# 📱 MANUAL TASKS FOR iOS APP LAUNCH - ADHDAcclaim

This document outlines all tasks you need to complete manually in Xcode and the Apple Developer Portal. Claude will handle all code implementation, but these require your Apple Developer account access.

---

## 🔴 CRITICAL: APPLE DEVELOPER PORTAL TASKS

### Task 1: Create App Record in App Store Connect
**Where:** https://appstoreconnect.apple.com

**Steps:**
1. Log in to App Store Connect
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform:** iOS
   - **Name:** ADHDAcclaim (or "ADHD Acclaim")
   - **Primary Language:** English (UK) or English (US)
   - **Bundle ID:** Create new → `com.adhdacclaim.app` (or your preferred)
   - **SKU:** `adhd-acclaim-ios` (unique identifier for your records)
   - **User Access:** Full Access
4. Click "Create"

**⚠️ SAVE AND PROVIDE TO CLAUDE:**
- ✅ **Bundle Identifier:** `_________________________`
- ✅ **Team ID:** `_________________________` (found in Membership section)
- ✅ **App Store Connect Team ID:** `_________________________`

---

### Task 2: Set Up In-App Purchase (14-Day Free Trial Subscription)
**Where:** App Store Connect → Your App → "In-App Purchases"

**Steps:**

#### 2.1: Create Subscription Group
1. Go to your app in App Store Connect
2. Click "In-App Purchases" tab
3. Click "+" → "Subscription Group"
4. Fill in:
   - **Reference Name:** Premium Access
   - **Group Name (English):** Premium Access
5. Click "Create"

#### 2.2: Create Subscription Product
1. Inside the "Premium Access" group, click "+" → "Auto-Renewable Subscription"
2. Fill in **Reference Information:**
   - **Reference Name:** ADHD Acclaim Premium Monthly
   - **Product ID:** `adhd_acclaim_premium_monthly` (⚠️ MUST MATCH EXACTLY - used in code)
3. Click "Create"

#### 2.3: Configure Subscription Details
1. **Duration:** 1 month
2. **Subscription Prices:**
   - Click "Add Pricing"
   - Select territories (UK, US, etc.)
   - Set price: £6.99 (UK) / $6.99 (US)
3. **Introductory Offer (FREE TRIAL):**
   - Click "Set Up Introductory Offer"
   - **Type:** Free Trial
   - **Duration:** 14 days
   - **Price:** Free
   - **Eligibility:** All users
   - Save
4. **Localization:**
   - Add English (UK) or English (US)
   - **Display Name:** "Premium Monthly"
   - **Description:** "Unlock unlimited wins, rewards, full calendar history, and advanced analytics. 14-day free trial included."
5. **Review Information:**
   - Add screenshot of subscription screen (can add later)
   - Review Notes: "This is a subscription for premium features in ADHD task management app."

#### 2.4: Submit for Review
1. Click "Submit" on the subscription product
2. Wait for approval (can submit while app is in development)

**⚠️ SAVE AND PROVIDE TO CLAUDE:**
- ✅ **Product ID:** `adhd_acclaim_premium_monthly` (should match exactly)
- ✅ **Subscription Group ID:** `_________________________`
- ✅ **Price:** £6.99/month (or your chosen price)
- ✅ **Trial Duration:** 14 days (confirm)

---

### Task 3: Create Sandbox Test Users
**Where:** App Store Connect → Users and Access → Sandbox Testers

**Steps:**
1. Go to Users and Access → Sandbox Testers
2. Click "+" to add tester
3. Fill in:
   - **Email:** Create fake email (e.g., `test.user1@example.com`)
   - **Password:** Strong password
   - **First Name:** Test
   - **Last Name:** User1
   - **Country:** United Kingdom (or your primary market)
4. Click "Create"
5. **Repeat** to create 2-3 test users

**Purpose:** These users can test subscription purchases without being charged.

**⚠️ SAVE FOR TESTING:**
- ✅ **Sandbox Email 1:** `_________________________`
- ✅ **Sandbox Password 1:** `_________________________`
- ✅ **Sandbox Email 2:** `_________________________`
- ✅ **Sandbox Password 2:** `_________________________`

---

### Task 4: Create Production Firebase Project
**Where:** https://console.firebase.google.com

**Steps:**

#### 4.1: Create New Project
1. Go to Firebase Console
2. Click "Add project"
3. **Project name:** `adhdacclaim-production` (or your preferred name)
4. Enable Google Analytics: **Optional** (recommended: Yes)
5. Create project

#### 4.2: Add iOS App to Firebase
1. Click "Add app" → iOS icon
2. Fill in:
   - **iOS bundle ID:** `com.adhdacclaim.app` (MUST MATCH App Store Connect)
   - **App nickname:** ADHDAcclaim iOS Production
   - **App Store ID:** Leave blank for now (will add after submission)
3. Click "Register app"

#### 4.3: Download Configuration File
1. Click "Download GoogleService-Info.plist"
2. **⚠️ SAVE THIS FILE** - You'll provide it to Claude

#### 4.4: Configure Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. **Location:** Choose closest region (e.g., `europe-west2` for UK)
4. **Security rules - Start in TEST MODE** (we'll change this):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. Click "Create"

#### 4.5: Enable Authentication
1. Go to "Authentication" → "Get started"
2. Click "Sign-in method" tab
3. Enable "Anonymous" authentication
4. Save

**⚠️ SAVE AND PROVIDE TO CLAUDE:**
- ✅ **GoogleService-Info.plist file** (download and provide)
- ✅ **Firebase Project ID:** `_________________________`
- ✅ **Firestore location:** `_________________________`

---

### Task 5: Create iOS Distribution Certificate & Provisioning Profile
**Where:** https://developer.apple.com/account

**Steps:**

#### 5.1: Create App Identifier
1. Go to Certificates, Identifiers & Profiles
2. Click "Identifiers" → "+"
3. Select "App IDs" → Continue
4. **Description:** ADHDAcclaim iOS
5. **Bundle ID:** Explicit → `com.adhdacclaim.app` (MUST MATCH)
6. **Capabilities:** Check:
   - ✅ In-App Purchase
   - ✅ Push Notifications (optional, for future)
7. Click "Continue" → "Register"

#### 5.2: Create Distribution Certificate (if you don't have one)
1. Click "Certificates" → "+"
2. Select "Apple Distribution" → Continue
3. Follow instructions to create CSR (Certificate Signing Request):
   - Open "Keychain Access" on Mac
   - Keychain Access menu → Certificate Assistant → Request Certificate from Certificate Authority
   - Fill in your email
   - Select "Saved to disk"
   - Save as `CertificateSigningRequest.certSigningRequest`
4. Upload CSR file
5. Download certificate (`.cer` file)
6. Double-click to install in Keychain

#### 5.3: Create Distribution Provisioning Profile
1. Click "Profiles" → "+"
2. Select "App Store" → Continue
3. **App ID:** Select `com.adhdacclaim.app`
4. **Certificate:** Select your distribution certificate
5. **Profile Name:** ADHDAcclaim App Store Distribution
6. Download profile (`.mobileprovision` file)

**⚠️ THESE ARE AUTO-MANAGED BY XCODE** if you enable "Automatically manage signing", but good to understand.

---

## 🔵 CRITICAL: XCODE TASKS

### Task 6: Configure Xcode Project Settings
**Where:** Open `/Volumes/wd/Downloads/ADHDAcclaim/ADHDAcclaim.xcodeproj` in Xcode

**Steps:**

#### 6.1: Update Bundle Identifier
1. Open project in Xcode
2. Select project in navigator (top-level "ADHDAcclaim")
3. Select "ADHDAcclaim" target
4. Go to "Signing & Capabilities" tab
5. **Bundle Identifier:** Change to `com.adhdacclaim.app` (or your chosen ID)

#### 6.2: Configure Code Signing
**Option A: Automatic Signing (Recommended for beginners)**
1. In "Signing & Capabilities" tab
2. Check ✅ "Automatically manage signing"
3. **Team:** Select your Apple Developer team from dropdown
4. Xcode will handle certificates and profiles

**Option B: Manual Signing (Advanced)**
1. Uncheck "Automatically manage signing"
2. **Provisioning Profile (Release):** Select "ADHDAcclaim App Store Distribution"
3. **Signing Certificate:** Select your distribution certificate

#### 6.3: Add In-App Purchase Capability
1. Still in "Signing & Capabilities" tab
2. Click "+ Capability"
3. Search for "In-App Purchase"
4. Double-click to add

#### 6.4: Replace GoogleService-Info.plist
1. In Xcode project navigator, locate `GoogleService-Info.plist`
2. **Delete old file** (right-click → Delete → Move to Trash)
3. Drag your NEW production `GoogleService-Info.plist` (from Firebase step) into Xcode
4. Ensure "Copy items if needed" is checked
5. Target: "ADHDAcclaim" is selected
6. Click "Finish"

#### 6.5: Update Version & Build Number
1. Select project → Target → "General" tab
2. **Version:** `1.0.0` (or your preferred starting version)
3. **Build:** `1` (increment for each TestFlight upload)

#### 6.6: Verify Info.plist Settings
1. Select `Info.plist` in project navigator
2. Ensure these keys exist (Xcode may auto-generate):
   - `CFBundleDisplayName` = ADHDAcclaim
   - `CFBundleName` = ADHDAcclaim
   - `CFBundleIdentifier` = $(PRODUCT_BUNDLE_IDENTIFIER)
   - `CFBundleShortVersionString` = 1.0.0
   - `NSUserTrackingUsageDescription` = "We don't track you. This permission is not used."
   - `Privacy - Tracking Usage Description` = Same as above

**⚠️ CONFIRM WHEN COMPLETE:**
- ✅ Bundle ID matches App Store Connect: `_________________________`
- ✅ Signing configured (team selected)
- ✅ In-App Purchase capability added
- ✅ New GoogleService-Info.plist added
- ✅ Version set to 1.0.0

---

## 🟡 AFTER CLAUDE IMPLEMENTS CODE CHANGES

### Task 7: Build & Test Locally
**When:** After Claude completes code implementation

**Steps:**
1. Open project in Xcode
2. Select a simulator (e.g., iPhone 15 Pro)
3. Click "Build" (⌘+B)
4. **If build errors occur:**
   - Send error messages to Claude
   - Claude will fix
5. Run app (⌘+R)
6. Test basic functionality:
   - Create a task
   - Complete a task
   - Add a reward
   - Check celebration animations
7. **Note:** Subscription testing requires physical device or TestFlight

---

### Task 8: Archive & Upload to TestFlight
**When:** After successful local build

**Steps:**

#### 8.1: Archive the App
1. In Xcode, select "Any iOS Device (arm64)" as destination (NOT a simulator)
2. Menu: Product → Archive
3. Wait for archive to complete (may take 5-10 minutes)
4. Xcode Organizer window will open automatically

#### 8.2: Distribute to App Store Connect
1. In Organizer, select your archive
2. Click "Distribute App"
3. Select "App Store Connect" → Next
4. Select "Upload" → Next
5. **Signing:** Select "Automatically manage signing" → Next
6. Review app info → Click "Upload"
7. Wait for upload to complete (5-15 minutes depending on connection)

#### 8.3: Configure TestFlight
1. Go to App Store Connect → Your App → TestFlight tab
2. Wait for "Processing" to complete (10-30 minutes)
3. Once "Ready to Test":
   - Click on build
   - Add "Test Information" (what to test)
   - Add your email as internal tester
   - Submit for beta review (if required)

#### 8.4: Install on Physical Device via TestFlight
1. Install "TestFlight" app from App Store on your iPhone
2. Log in with your Apple ID
3. You'll see ADHDAcclaim appear
4. Click "Install"
5. Open app on device

---

### Task 9: Test Subscription Flow on Physical Device
**When:** After TestFlight install

**Steps:**

#### 9.1: Sign Out of Real Apple ID (Important!)
1. On iPhone: Settings → [Your Name] → Media & Purchases
2. Tap "Sign Out" (this signs out of App Store/IAP only, not iCloud)

#### 9.2: Test Subscription Purchase
1. Open ADHDAcclaim app on TestFlight
2. Navigate to trigger paywall (try creating 4th win to hit limit)
3. Paywall should appear with "Start Free Trial" button
4. Tap "Start Free Trial"
5. **StoreKit prompt will appear**
6. If prompted to sign in, use your **SANDBOX TEST USER** credentials (from Task 3)
7. **Subscription sheet shows:**
   - "ADHDAcclaim wants to confirm your purchase"
   - Price: £6.99/month
   - **"You will not be charged for this purchase"** (sandbox mode indicator)
   - Free trial duration: 14 days
8. Confirm purchase
9. Verify app unlocks premium features

#### 9.3: Test Feature Gating
1. **Free user test:**
   - Create fresh account or reset
   - Try creating 4 wins → 4th should trigger paywall
   - Try creating 3 rewards → 3rd should trigger paywall
   - Check calendar only shows 7 days
2. **Premium user test:**
   - After purchasing (sandbox), verify unlimited access
   - Create 10+ wins (should work)
   - Create 5+ rewards (should work)
   - Calendar shows full history

#### 9.4: Test Restore Purchases
1. Delete app from device
2. Reinstall from TestFlight
3. Create new account or log in
4. Go to paywall → Tap "Restore Purchases"
5. Verify premium access restored

#### 9.5: Test Trial Expiration (Optional - Advanced)
1. In sandbox mode, you can speed up time:
   - 1 day = ~5 minutes in sandbox
   - 14 days = ~1 hour in sandbox
2. Wait for trial to "expire" in accelerated time
3. Verify app prompts for payment after trial

**⚠️ REPORT TO CLAUDE IF ANY ISSUES:**
- ✅ Paywall appears correctly: YES / NO
- ✅ Subscription purchase completes: YES / NO
- ✅ Premium features unlock: YES / NO
- ✅ Feature limits work for free users: YES / NO
- ✅ Restore purchases works: YES / NO
- ❌ Any errors or issues: `_________________________`

---

## 🟢 APP STORE SUBMISSION TASKS

### Task 10: Create App Screenshots
**When:** After app is working on TestFlight

**Required Sizes:**
- 6.7" display: 1290 x 2796 (iPhone 15 Pro Max, 14 Pro Max)
- 6.5" display: 1284 x 2778 (iPhone 14 Plus, 13 Pro Max, 12 Pro Max)
- 5.5" display: 1242 x 2208 (iPhone 8 Plus) - **Optional but recommended**

**Screenshots Needed (5-10 per size):**
1. **Home screen** with energy level slider and quick wins
2. **Task completion** with celebration animation
3. **Rewards screen** showing reward catalog
4. **Calendar view** with tasks planned
5. **Profile/settings** screen
6. **Optional:** Subscription/premium features screen

**Tools:**
- Xcode Simulator (Device → Screenshot)
- [App Store Screenshot Generator](https://www.appscreenshotmaker.com) (free)
- [Figma Mockups](https://www.figma.com) with device frames

**Where to Upload:**
- App Store Connect → Your App → iOS App → Screenshots
- Drag and drop images into each size category

---

### Task 11: Fill Out App Store Connect Metadata
**Where:** App Store Connect → Your App → iOS App

**Required Fields:**

#### 11.1: App Information
1. **Name:** ADHDAcclaim (or "ADHD Acclaim")
2. **Subtitle (30 char max):** `Task manager for ADHD minds`
3. **Privacy Policy URL:**
   - Option A: Create simple page on your website
   - Option B: Use in-app policy (provide URL to placeholder)
   - Example: `https://adhdacclaim.com/privacy` (create this page)
4. **Category:**
   - Primary: Productivity
   - Secondary: Health & Fitness (optional)
5. **License Agreement:** Standard Apple EULA (default)

#### 11.2: Pricing & Availability
1. **Price:** Free (with in-app purchase)
2. **Availability:** All territories (or select specific countries)

#### 11.3: App Privacy
1. Click "Edit" next to "App Privacy"
2. Answer questionnaire:
   - **Do you collect data?** YES
   - **Data types collected:**
     - User ID (for app functionality, not linked to identity)
     - Product Interaction (for analytics, not linked to identity)
   - **Is data used for tracking?** NO
   - **Is data linked to user identity?** NO
3. Save

#### 11.4: Version Information (for version 1.0.0)
1. **What's New in This Version:**
   ```
   Welcome to ADHDAcclaim! 🎉

   • Energy-aware task management for ADHD minds
   • Quick wins system with celebration animations
   • Gamified rewards to stay motivated
   • Mood and energy tracking
   • Minimal distractions, maximum focus
   • 14-day free trial included with Premium

   Premium features:
   • Unlimited wins and rewards
   • Full calendar history
   • Advanced analytics
   • Data export
   ```

2. **Description (4000 char max):**
   ```
   ADHDAcclaim is a task management app designed specifically for ADHD brains.

   ENERGY-AWARE SYSTEM
   Rate your energy level and get quick wins matched to your current capacity. Low energy? Start with easy wins like "Drink water" or "Take medication." High energy? Tackle bigger challenges.

   QUICK WINS & CELEBRATIONS
   Break down overwhelming tasks into bite-sized wins. Complete a task and get instant celebration with points, confetti, and positive reinforcement.

   GAMIFIED REWARDS
   Earn points for completing wins. Redeem points for custom rewards you set for yourself. Make productivity fun and rewarding.

   ADHD-FRIENDLY FEATURES
   • Minimal celebrations mode (reduce sensory overload)
   • Simple, distraction-free interface
   • No overwhelming lists
   • Focus on "today" to reduce anxiety
   • Mood and energy tracking

   PREMIUM FEATURES (14-day free trial)
   • Unlimited wins and rewards
   • Full calendar history
   • Advanced analytics
   • Premium templates
   • Data export

   MEDICAL DISCLAIMER
   This app is NOT a medical device and does not diagnose, treat, or cure ADHD. It's a productivity tool. Always consult healthcare professionals for medical advice.

   Privacy-first: Anonymous authentication, no personal data collection, no ads.
   ```

3. **Keywords (100 char max):**
   ```
   adhd,productivity,task manager,rewards,gamification,focus,motivation,habit,todo,planner
   ```

4. **Support URL:** Your website or support email
   - Example: `https://adhdacclaim.com/support`
   - Or: `mailto:support@adhdacclaim.com`

5. **Marketing URL (optional):** Your app website
   - Example: `https://adhdacclaim.com`

#### 11.5: Age Rating
1. Click "Edit" next to "Age Rating"
2. Answer questionnaire (should be 4+):
   - Cartoon/Fantasy Violence: None
   - Realistic Violence: None
   - Sexual Content: None
   - Profanity: None
   - Medical/Treatment Information: None (you have disclaimer)
3. **Rating will be:** 4+

#### 11.6: App Review Information
1. **Notes for Review:**
   ```
   Thank you for reviewing ADHDAcclaim!

   SUBSCRIPTION TESTING:
   - The app offers a 14-day free trial subscription (£6.99/month after trial)
   - Use sandbox test account to verify subscription flow
   - Free tier limits: 3 active wins, 2 rewards, 7 days calendar
   - Premium unlocks unlimited access

   REVIEWER MODE (for easier testing):
   - Tap the greeting text at top of home screen 7 times rapidly
   - This unlocks all premium features without subscription
   - You'll see a confirmation message

   MEDICAL DISCLAIMER:
   - Clearly displayed in app (Profile → Medical Disclaimer)
   - This is a productivity tool, not a medical device

   Let me know if you need any assistance testing!
   ```

2. **Sign-In Required:** NO (anonymous auth, no login required)
3. **Contact Information:** Your email and phone number

---

### Task 12: Submit for App Review
**When:** Everything above is complete

**Steps:**
1. Ensure all sections in App Store Connect show green checkmarks
2. Select your TestFlight build for "App Store Review"
3. Click "Add for Review"
4. Select "Manual Release" or "Automatic Release" (your preference)
5. Click "Submit for Review"
6. Wait for review (typically 1-3 days)

---

## 📋 QUICK REFERENCE CHECKLIST

### Before Claude Starts Coding:
- [ ] Task 1: Create App Store Connect record
- [ ] Task 2: Set up subscription product (14-day trial)
- [ ] Task 3: Create 2-3 sandbox test users
- [ ] Task 4: Create production Firebase project & download plist
- [ ] Task 5: Create certificates/profiles (or prepare for auto-signing)
- [ ] Provide Claude with: Bundle ID, Product ID, GoogleService-Info.plist

### After Claude Completes Code:
- [ ] Task 6: Configure Xcode (bundle ID, signing, GoogleService-Info.plist)
- [ ] Task 7: Build & test locally in simulator
- [ ] Task 8: Archive & upload to TestFlight
- [ ] Task 9: Test subscription flow on physical device with sandbox user
- [ ] Task 10: Create app screenshots (5-10 per required size)
- [ ] Task 11: Fill out all App Store Connect metadata
- [ ] Task 12: Submit for App Review

### Timeline Estimate:
- **Apple Portal Setup (Tasks 1-5):** 2-3 hours
- **After Code Implementation (Tasks 6-9):** 2-3 hours
- **Screenshots & Metadata (Tasks 10-11):** 2-3 hours
- **Total Manual Work:** 6-9 hours

---

## 🆘 TROUBLESHOOTING

### "No provisioning profiles found"
- Enable "Automatically manage signing" in Xcode
- Ensure you're signed in with Apple ID in Xcode → Preferences → Accounts

### "Failed to verify receipt"
- Normal in development - StoreKit 2 handles this automatically
- Only verify receipts on your backend in production (optional)

### "Sandbox purchases not working"
- Ensure you signed OUT of real Apple ID in Settings → Media & Purchases
- Use ONLY sandbox test user credentials
- Delete and reinstall app if purchases are stuck

### "Build upload failed"
- Check code signing settings
- Ensure all targets use same bundle ID
- Try archiving again (sometimes transient issues)

### "App Review Rejection"
- Common reasons: Missing privacy policy, subscription not clear, crashes
- Claude can help fix issues mentioned in rejection
- Respond to reviewer feedback and resubmit

---

## 📧 WHAT TO PROVIDE BACK TO CLAUDE

After completing Apple Developer Portal tasks, provide:

```
Bundle Identifier: com.adhdacclaim.app
Team ID: ABC123XYZ
Product ID: adhd_acclaim_premium_monthly
Subscription Price: £6.99/month
Trial Duration: 14 days
Firebase Project: [Attach GoogleService-Info.plist file]

Sandbox Test User:
Email: test.user@example.com
Password: Test1234!

Status:
✅ App record created
✅ Subscription created and approved
✅ Firebase project created
✅ Ready for code implementation
```

Once you provide this info, Claude will finalize any remaining configuration in code.

---

## 🚀 READY TO LAUNCH!

After all tasks complete and app is approved:
1. App Store Connect → Your App → "Release This Version"
2. App goes live within 24 hours
3. Celebrate! 🎉

Good luck with your launch this weekend! 🚀
