import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Figma Webhook Handler for Component Updates
 *
 * Triggered when:
 * - FILE_UPDATE - File contents changed
 * - FILE_VERSION_UPDATE - New version created
 * - LIBRARY_PUBLISH - Component library published
 *
 * Actions:
 * - Verify webhook passcode
 * - Mark file for re-sync
 * - Log webhook event
 *
 * Note: Actual re-sync is triggered via MCP (stea.syncFigmaComponents)
 * or via background job
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      event_type,
      file_key,
      file_name,
      passcode,
      timestamp,
      webhook_id,
    } = body;

    console.log(`Figma webhook received: ${event_type} for file ${file_key}`);

    if (!file_key || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields (file_key, event_type)' },
        { status: 400 }
      );
    }

    // Find matching Figma file
    const fileDoc = await adminDb
      .collection('stea_figma_files')
      .doc(file_key)
      .get();

    if (!fileDoc.exists) {
      console.log(`No Figma file found for key: ${file_key}`);
      return NextResponse.json({
        success: true,
        message: 'File not being tracked',
      });
    }

    const file = fileDoc.data();

    // Verify passcode if configured
    // Note: Figma webhooks use a passcode verification system
    // The passcode should be stored when setting up the webhook
    if (file.webhookPasscode && passcode) {
      if (passcode !== file.webhookPasscode) {
        console.error(`Invalid webhook passcode for file ${file_key}`);
        return NextResponse.json(
          { error: 'Invalid passcode' },
          { status: 403 }
        );
      }
    }

    // Log webhook event
    const webhookDoc = await adminDb.collection('stea_figma_webhooks').add({
      fileId: file_key,
      tenantId: file.tenantId,
      event: event_type,
      passcode: passcode ? '***' : null, // Don't store actual passcode
      payload: {
        file_key,
        file_name,
        webhook_id,
        timestamp,
      },
      processStatus: 'pending',
      processError: null,
      componentsAdded: 0,
      componentsUpdated: 0,
      componentsDeleted: 0,
      receivedAt: new Date(),
    });

    // Mark file for re-sync
    // Update syncStatus to trigger re-sync on next check
    await adminDb.collection('stea_figma_files').doc(file_key).update({
      syncStatus: 'pending',
      nextSyncAt: new Date(), // Immediate sync needed
      updatedAt: new Date(),
    });

    console.log(`Figma file ${file_key} marked for re-sync`);

    // In a production system, you might trigger a background job here
    // to actually perform the re-sync immediately
    // For now, the file will be re-synced next time stea.syncFigmaComponents is called

    return NextResponse.json({
      success: true,
      fileKey: file_key,
      eventType: event_type,
      message: 'File marked for re-sync',
      webhookId: webhookDoc.id,
    });

  } catch (error) {
    console.error('Figma webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'Figma Webhook Handler',
    status: 'active',
    endpoint: '/api/webhooks/figma',
    supportedEvents: [
      'FILE_UPDATE',
      'FILE_VERSION_UPDATE',
      'LIBRARY_PUBLISH',
    ],
  });
}
