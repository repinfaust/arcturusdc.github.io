#!/usr/bin/env node

const admin = require('firebase-admin');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../stea-775cd-1adc69763f06.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Task data
const tasks = [
  {
    title: 'Collect Prerequisites and Assets',
    description: 'Have access to Apple Developer Program team. Collect marketing assets: app name "Tou.me", subtitle/tagline, full description, keywords, support URL, marketing URL, privacy policy URL, and iOS app icon in all required sizes. Confirm bundle identifier "toume.arcturusdc", version "1.0.0", build "1". List IAP product IDs: toume_monthly_subscription, toume_yearly_subscription.',
    size: 'S'
  },
  {
    title: 'Register Bundle ID in Apple Developer Portal',
    description: 'Sign in to developer.apple.com/account with admin role. Navigate to Certificates, IDs & Profiles → Identifiers. Click +, choose App IDs → App. Enter "Tou.me" as name, bundle ID "toume.arcturusdc". Enable capabilities: Push Notifications, In-App Purchase. Review and register.',
    size: 'M'
  },
  {
    title: 'Create Distribution Certificate',
    description: 'Under Certificates, IDs & Profiles, ensure a valid Apple Distribution certificate exists. Create one if needed and download the .p12 file.',
    size: 'S'
  },
  {
    title: 'Create App Store Provisioning Profile',
    description: 'Go to Profiles, click +, select App Store, choose the Tou.me App ID, pick the distribution certificate, name the profile "Toume App Store", and generate it. Download the provisioning profile.',
    size: 'M'
  },
  {
    title: 'Create App Record in App Store Connect',
    description: 'Sign in to appstoreconnect.apple.com with admin role. Open My Apps, click + → New App. Fill in: Platform iOS, Name "Tou.me", Primary language English (U.K.), Bundle ID toume.arcturusdc, SKU "toume-ios-uk", User access Full Access. Create the app record.',
    size: 'M'
  },
  {
    title: 'Complete App Information',
    description: 'In App Information, provide subtitle, category, content rights, and age rating responses. Add marketing URLs (support, marketing, privacy) and localized metadata as required.',
    size: 'M'
  },
  {
    title: 'Set Pricing and Availability',
    description: 'In Pricing and Availability, pick the price tier or free, set availability regions.',
    size: 'S'
  },
  {
    title: 'Complete App Privacy Questionnaire',
    description: 'In App Privacy → Manage → Data Collection, complete the questionnaire for each data type. Cover: Contact info, User content (journals/entries), Identifiers (Device ID, User ID), Usage data and diagnostics. For each data type, specify if linked to user and used for tracking. Confirm "We do not track you" stance. Save the summary.',
    size: 'L'
  },
  {
    title: 'Create Subscription Group',
    description: 'Go to Features → In-App Purchases. Click + → Auto-Renewable Subscription. Create a subscription group named "Toume Premium".',
    size: 'S'
  },
  {
    title: 'Add Monthly Subscription Product',
    description: 'Add product ID "toume_monthly_subscription", display name "Tou.me Premium Monthly", price tier £6.99, localized descriptions, free trial settings if applicable. Attach required review screenshot and fill Review Information.',
    size: 'M'
  },
  {
    title: 'Add Yearly Subscription Product',
    description: 'Add product ID "toume_yearly_subscription", display name "Tou.me Premium Yearly", price tier £69.99, localized descriptions, free trial settings if applicable. Attach required review screenshot and fill Review Information.',
    size: 'M'
  },
  {
    title: 'Submit IAP Products for Review',
    description: 'Submit both subscription products for review. They must be approved before release submission.',
    size: 'S'
  },
  {
    title: 'Complete App Encryption & Compliance',
    description: 'In App Information → Export Compliance, answer encryption questions. Select "Yes" to using encryption and "No" to exemptions. Confirm qualification for standard compliance (App uses ATS/HTTPS only). Provide contact info and ECCN values (usually 5D992.c for consumer apps).',
    size: 'M'
  },
  {
    title: 'Configure TestFlight Beta App Review Info',
    description: 'Once a build is uploaded, go to TestFlight. Complete Beta App Review Information: contact, notes, demo account if applicable. Answer Export Compliance and Content Rights prompts for the build.',
    size: 'M'
  },
  {
    title: 'Add TestFlight Internal Testers',
    description: 'Add internal testers (Team members inside App Store Connect) and enable them for the build.',
    size: 'S'
  },
  {
    title: 'Setup External Testing Group',
    description: 'For external testing, create a tester group, add email addresses, fill the Test Information summary, and submit for Beta App Review.',
    size: 'M'
  },
  {
    title: 'Upload App Screenshots and Metadata',
    description: 'Upload required screenshots (6.7" and 5.5"), App Preview if available, and the full metadata. Confirm build number matches (1) and version (1.0.0).',
    size: 'L'
  },
  {
    title: 'Review Pre-Submission Warnings',
    description: 'Review any warnings under App Review (missing compliance, IAP metadata, etc.) and resolve them.',
    size: 'S'
  },
  {
    title: 'Monitor Build Processing',
    description: 'After submission, monitor build processing. Once complete, can release to TestFlight or submit for App Review.',
    size: 'S'
  },
  {
    title: 'Set Production Release Strategy',
    description: 'When ready for production release, set the desired launch date or use manual release after approval.',
    size: 'S'
  }
];

async function createIosSetupTasks() {
  try {
    console.log('Creating iOS App Store Setup Epic...');

    // Create Epic
    const epicRef = await db.collection('stea_epics').add({
      title: 'iOS App Store Setup',
      name: 'iOS App Store Setup',
      description: 'Complete manual setup steps required in Apple portals before shipping the Tou.me iOS build to the App Store.',
      app: 'Tou.Me',
      priority: 'HIGH',
      statusColumn: 'Planning',
      sizeEstimate: 'XL',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'script:ios-setup',
      reporter: 'script',
      assignee: '',
      archived: false,
      attachments: [],
      type: 'epic'
    });

    console.log(`✓ Created Epic: ${epicRef.id}`);

    // Create Feature
    const featureRef = await db.collection('stea_features').add({
      title: 'Pre-release Manual Configuration',
      name: 'Pre-release Manual Configuration',
      description: 'Manual configuration steps in Apple Developer Portal and App Store Connect that must be completed before the first iOS build can be submitted.',
      app: 'Tou.Me',
      priority: 'HIGH',
      statusColumn: 'Planning',
      sizeEstimate: 'XL',
      epicId: epicRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'script:ios-setup',
      reporter: 'script',
      assignee: '',
      archived: false,
      attachments: [],
      type: 'feature'
    });

    console.log(`✓ Created Feature: ${featureRef.id}`);

    // Create Cards
    console.log('\nCreating cards...');
    let count = 0;

    for (const task of tasks) {
      await db.collection('stea_cards').add({
        title: task.title,
        description: task.description,
        app: 'Tou.Me',
        priority: 'MEDIUM',
        statusColumn: 'Planning',
        sizeEstimate: task.size,
        featureId: featureRef.id,
        epicId: epicRef.id,
        featureLabel: 'Pre-release Manual Configuration',
        epicLabel: 'iOS App Store Setup',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'script:ios-setup',
        reporter: 'script',
        assignee: '',
        archived: false,
        attachments: [],
        type: 'idea',
        userStory: '',
        acceptanceCriteria: [],
        userFlow: []
      });
      count++;
      console.log(`  ${count}/${tasks.length} - Created: ${task.title}`);
    }

    console.log(`\n✅ Successfully created:`);
    console.log(`   - 1 Epic: iOS App Store Setup`);
    console.log(`   - 1 Feature: Pre-release Manual Configuration`);
    console.log(`   - ${tasks.length} Cards`);
    console.log(`\n🔗 View at: https://arcturusdc.com/apps/stea/filo`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tasks:', error);
    process.exit(1);
  }
}

createIosSetupTasks();
