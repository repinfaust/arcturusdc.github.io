import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/orbit/auth';
import { signEvent, hashEvent } from '@/lib/orbit/signatures';
import { generateEventId } from '@/lib/orbit/eventTypes';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

// Sanitize Firestore data to prevent circular structure errors
function sanitizeFirestoreData(data) {
  if (!data) return data;

  // Convert to plain object and handle timestamps
  const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert Firestore timestamps to ISO strings
    if (value && typeof value === 'object') {
      if (value._seconds !== undefined && value._nanoseconds !== undefined) {
        return new Date(value._seconds * 1000).toISOString();
      }
      if (value.toDate && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
      }
      if (value.toMillis && typeof value.toMillis === 'function') {
        return new Date(value.toMillis()).toISOString();
      }
    }
    return value;
  }));

  return sanitized;
}

// Calculate completeness score
function calculateCompletenessScore(lineage, logs) {
  let score = 0;
  let maxScore = 0;

  // Check for required components (20 points each)
  const requiredComponents = [
    { check: () => lineage.nodes?.length > 0, name: 'Lineage nodes' },
    { check: () => lineage.edges?.length > 0, name: 'Lineage edges' },
    { check: () => logs.some(l => l.type === 'api' || l.type === 'cloudtrail'), name: 'API/CloudTrail logs' },
    { check: () => logs.some(l => l.type === 'model_inference' || l.type === 'model_training'), name: 'Model logs' },
    { check: () => lineage.nodes?.some(n => n.type === 'decision'), name: 'Decision point' },
  ];

  requiredComponents.forEach(component => {
    maxScore += 20;
    if (component.check()) {
      score += 20;
    }
  });

  return Math.round((score / maxScore) * 100);
}

// Check for policy deviations
function checkPolicyDeviations(lineage, logs) {
  const deviations = [];

  // Check for missing consent basis
  const hasConsentBasis = logs.some(log =>
    log.entries?.some(entry =>
      entry.consent || entry.consentBasis || entry.consentGranted
    )
  );
  if (!hasConsentBasis) {
    deviations.push({
      type: 'Missing Consent Basis',
      description: 'No consent basis found in logs. AI Act requires documented consent for data processing.',
      severity: 'high',
    });
  }

  // Check for incomplete lineage
  if (!lineage.nodes || lineage.nodes.length < 3) {
    deviations.push({
      type: 'Incomplete Lineage',
      description: 'Lineage chain is too short. AI Act requires full traceability from input to decision.',
      severity: 'medium',
    });
  }

  // Check for missing model version
  const hasModelVersion = lineage.nodes?.some(n =>
    n.type === 'model' && n.version
  );
  if (!hasModelVersion) {
    deviations.push({
      type: 'Missing Model Version',
      description: 'Model version not specified. AI Act requires model versioning for traceability.',
      severity: 'medium',
    });
  }

  // Check for missing timestamps
  const hasTimestamps = lineage.nodes?.every(n => n.timestamp);
  if (!hasTimestamps) {
    deviations.push({
      type: 'Missing Timestamps',
      description: 'Some lineage nodes are missing timestamps. Full temporal traceability is required.',
      severity: 'low',
    });
  }

  return deviations;
}

export async function POST(request) {
  try {
    const session = await verifySession(request);
    if (!session.authenticated) {
      return NextResponse.json(
        { error: session.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lineage } = body;

    if (!lineage) {
      return NextResponse.json(
        { error: 'Lineage data is required' },
        { status: 400 }
      );
    }

    // Get logs for context
    const { db } = getFirebaseAdmin();
    const logsRef = db.collection('orbit_ai_act_logs');
    const logsSnapshot = await logsRef
      .where('uploadedBy', '==', session.user.uid)
      .get();
    const logs = logsSnapshot.docs.map(doc => sanitizeFirestoreData(doc.data()));

    // Calculate completeness score
    const completenessScore = calculateCompletenessScore(lineage, logs);

    // Check for policy deviations
    const policyDeviations = checkPolicyDeviations(lineage, logs);

    // Extract inputs and outputs from lineage
    const inputs = lineage.nodes
      ?.filter(n => n.type === 'user' || n.type === 'data')
      .map(n => ({
        type: n.type,
        label: n.label,
        version: n.version,
        timestamp: n.timestamp,
      })) || [];

    const outputs = lineage.nodes
      ?.filter(n => n.type === 'decision')
      .map(n => ({
        type: n.type,
        label: n.label,
        timestamp: n.timestamp,
      })) || [];

    // Extract model version
    const modelNode = lineage.nodes?.find(n => n.type === 'model');
    const modelVersion = modelNode?.version || 'unknown';

    // Extract consent basis from logs
    const consentBasis = (() => {
      for (const log of logs) {
        for (const entry of log.entries || []) {
          if (entry.consentBasis) return entry.consentBasis;
          if (entry.consent) return entry.consent;
          if (entry.consentGranted) return 'User granted consent';
        }
      }
      return 'Not specified in logs';
    })();

    // Build oversight chain
    const oversightChain = lineage.edges?.map(edge => 
      `${edge.from} → ${edge.to} (${edge.type})`
    ) || [];

    // Generate attestations
    const attestations = [
      {
        type: 'Lineage Reconstruction',
        timestamp: lineage.reconstructedAt || new Date().toISOString(),
        description: 'Data lineage reconstructed from ingested logs',
      },
      {
        type: 'Log Completeness',
        timestamp: new Date().toISOString(),
        description: `Verified ${logs.length} log file(s) ingested`,
      },
      {
        type: 'Documentation Bundle Generation',
        timestamp: new Date().toISOString(),
        description: 'Technical documentation bundle generated for AI Act compliance',
      },
    ];

    // Create documentation bundle
    const bundle = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        purpose: 'AI Act Technical Documentation',
        generatedBy: session.user.uid,
        regulatoryVersions: {
          regulationVersion: 'EU AI Act 2024/1689',
          templateVersion: '1.2.0',
          interpretationVersion: '2024.11',
          orbitVersion: '1.0.0',
        },
      },
      modelVersion,
      inputs,
      outputs,
      consentBasis,
      oversightChain,
      logCompleteness: {
        totalLogs: logs.length,
        logTypes: [...new Set(logs.map(l => l.type))],
        totalEntries: logs.reduce((sum, log) => sum + (log.entryCount || 0), 0),
      },
      attestations,
      lineage: {
        nodes: lineage.nodes,
        edges: lineage.edges,
      },
    };

    // Cryptographically seal the bundle
    const sealEvent = {
      eventId: generateEventId(),
      eventType: 'DOCUMENTATION_BUNDLE_SEALED',
      userId: session.user.uid,
      orgId: 'system',
      bundleHash: null, // Will be computed
      signingKeyId: 'system-key-1',
    };

    // Compute bundle hash
    const bundleHash = crypto.createHash('sha256')
      .update(JSON.stringify(bundle))
      .digest('hex');

    sealEvent.bundleHash = bundleHash;
    sealEvent.signature = signEvent(sealEvent, process.env.ORBIT_SYSTEM_SECRET || 'demo_system_secret_' + 'x'.repeat(32));

    // Get previous event for hash chain
    try {
      const { getLatestEvent } = await import('@/lib/orbit/db-admin');
      const previousEvent = await getLatestEvent(session.user.uid, 'system');
      if (previousEvent && previousEvent.eventHash) {
        sealEvent.previousEventHash = previousEvent.eventHash;
        sealEvent.blockIndex = (previousEvent.blockIndex || 0) + 1;
      } else {
        sealEvent.blockIndex = 1;
      }
      const computedHash = hashEvent(sealEvent);
      if (computedHash) {
        sealEvent.eventHash = computedHash;
      }
    } catch (error) {
      console.error('Error setting up hash chain:', error);
      sealEvent.blockIndex = 1;
    }

    // Add cryptographic seal to bundle
    bundle.cryptographicSeal = {
      signature: sealEvent.signature,
      hash: bundleHash,
      eventHash: sealEvent.eventHash,
      timestamp: new Date().toISOString(),
      signingKeyId: sealEvent.signingKeyId,
    };

    // Store seal event in ledger
    const { FieldValue } = getFirebaseAdmin();
    const eventsRef = db.collection('orbit_ledger_events');
    await eventsRef.add({
      ...sealEvent,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      bundle,
      completenessScore,
      policyDeviations,
    });
  } catch (error) {
    console.error('Error generating bundle:', error);
    return NextResponse.json(
      { error: 'Failed to generate bundle', details: error.message },
      { status: 500 }
    );
  }
}

