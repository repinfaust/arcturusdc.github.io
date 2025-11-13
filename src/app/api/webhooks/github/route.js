import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createHmac } from 'crypto';
import axios from 'axios';

/**
 * GitHub Webhook Handler for OpenAPI Spec Updates
 *
 * Triggered when:
 * - Push events to repository
 * - Pull requests merged
 *
 * Actions:
 * - Fetch updated OpenAPI spec from repository
 * - Compare SHA256 hash to detect changes
 * - Re-import and re-parse spec if changed
 * - Log webhook event
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Extract repository info
    const repo = payload.repository?.full_name;
    const ref = payload.ref;
    const commits = payload.commits || [];

    if (!repo) {
      return NextResponse.json(
        { error: 'Missing repository information' },
        { status: 400 }
      );
    }

    console.log(`GitHub webhook received: ${event} for ${repo}`);

    // Find matching API specs that watch this repository
    const specsSnapshot = await adminDb
      .collection('stea_api_specs')
      .where('sourceRepo', '==', repo)
      .get();

    if (specsSnapshot.empty) {
      console.log(`No specs found watching repository: ${repo}`);
      return NextResponse.json({
        success: true,
        message: 'No specs watching this repository',
      });
    }

    const results = [];

    for (const specDoc of specsSnapshot.docs) {
      const spec = specDoc.data();
      const specId = specDoc.id;

      // Verify webhook signature if secret is configured
      if (spec.webhookSecret && signature) {
        const expectedSignature = 'sha256=' + createHmac('sha256', spec.webhookSecret)
          .update(body)
          .digest('hex');

        if (signature !== expectedSignature) {
          console.error(`Invalid webhook signature for spec ${specId}`);
          results.push({ specId, status: 'error', message: 'Invalid signature' });
          continue;
        }
      }

      // Check if the branch matches
      if (spec.sourceBranch && ref) {
        const branchFromRef = ref.replace('refs/heads/', '');
        if (branchFromRef !== spec.sourceBranch) {
          console.log(`Branch mismatch for spec ${specId}: ${branchFromRef} !== ${spec.sourceBranch}`);
          results.push({ specId, status: 'skipped', message: 'Branch mismatch' });
          continue;
        }
      }

      // Check if the spec file was modified
      const specPath = spec.sourcePath;
      let specModified = false;

      if (specPath && commits.length > 0) {
        for (const commit of commits) {
          const modifiedFiles = [
            ...(commit.added || []),
            ...(commit.modified || []),
          ];
          if (modifiedFiles.some(file => file === specPath)) {
            specModified = true;
            break;
          }
        }

        if (!specModified) {
          console.log(`Spec file not modified in commits for ${specId}`);
          results.push({ specId, status: 'skipped', message: 'Spec file not modified' });
          continue;
        }
      }

      // Log webhook event
      await adminDb.collection('stea_api_webhooks').add({
        specId,
        tenantId: spec.tenantId,
        source: 'github',
        event,
        payload: {
          repo,
          ref,
          commits: commits.length,
        },
        processStatus: 'processing',
        processError: null,
        specChanged: false,
        oldSha256: spec.sha256 || null,
        newSha256: null,
        receivedAt: new Date(),
      });

      // Fetch updated spec from GitHub
      try {
        // Build GitHub raw URL
        const branch = spec.sourceBranch || 'main';
        const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${specPath}`;

        console.log(`Fetching spec from: ${rawUrl}`);
        const response = await axios.get(rawUrl);
        const specContent = typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

        // Calculate new hash
        const newSha256 = createHmac('sha256', specContent).digest('hex');

        // Check if spec actually changed
        if (newSha256 === spec.sha256) {
          console.log(`Spec unchanged for ${specId} (hash match)`);
          results.push({ specId, status: 'unchanged', message: 'No changes detected' });
          continue;
        }

        // Trigger re-import (simplified - in production, queue this)
        // For now, just update the spec status to trigger manual re-import
        await adminDb.collection('stea_api_specs').doc(specId).update({
          parseStatus: 'pending',
          sha256: newSha256,
          updatedAt: new Date(),
        });

        results.push({ specId, status: 'updated', message: 'Spec updated, re-parse needed' });

      } catch (err) {
        console.error(`Error fetching spec for ${specId}:`, err);
        results.push({ specId, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      repository: repo,
      specsProcessed: results.length,
      results,
    });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'GitHub Webhook Handler',
    status: 'active',
    endpoint: '/api/webhooks/github',
  });
}
