import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/orbit/auth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { signEvent, hashEvent } from '@/lib/orbit/signatures';
import { generateEventId } from '@/lib/orbit/eventTypes';

const COLLECTIONS = {
  AI_ACT_LOGS: 'orbit_ai_act_logs',
  LEDGER_EVENTS: 'orbit_ledger_events',
};

// Parse different log formats
function parseLogFile(filename, content) {
  const type = detectLogType(filename, content);
  
  try {
    if (type === 'cloudtrail') {
      return parseCloudTrailLog(content);
    } else if (type === 'api') {
      return parseApiLog(content);
    } else if (type === 'model_inference') {
      return parseModelInferenceLog(content);
    } else if (type === 'model_training') {
      return parseModelTrainingLog(content);
    } else if (type === 'idp') {
      return parseIdpLog(content);
    } else {
      // Generic JSON log
      return parseGenericLog(content);
    }
  } catch (error) {
    console.error(`Error parsing log file ${filename}:`, error);
    return {
      type: 'unknown',
      entries: [],
      raw: content.substring(0, 1000), // Store first 1000 chars
    };
  }
}

function detectLogType(filename, content) {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  if (lowerFilename.includes('cloudtrail') || lowerContent.includes('cloudtrail')) {
    return 'cloudtrail';
  }
  if (lowerFilename.includes('api') || lowerContent.includes('api_request')) {
    return 'api';
  }
  if (lowerFilename.includes('inference') || lowerContent.includes('model_inference')) {
    return 'model_inference';
  }
  if (lowerFilename.includes('training') || lowerContent.includes('model_training')) {
    return 'model_training';
  }
  if (lowerFilename.includes('idp') || lowerContent.includes('identity_provider')) {
    return 'idp';
  }
  return 'generic';
}

function parseCloudTrailLog(content) {
  const data = JSON.parse(content);
  const records = Array.isArray(data.Records) ? data.Records : (data.records || []);
  return {
    type: 'cloudtrail',
    entries: records.map(record => ({
      eventTime: record.eventTime,
      eventName: record.eventName,
      userIdentity: record.userIdentity,
      sourceIPAddress: record.sourceIPAddress,
      resources: record.resources,
    })),
  };
}

function parseApiLog(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const entries = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return { raw: line };
    }
  });
  return {
    type: 'api',
    entries,
  };
}

function parseModelInferenceLog(content) {
  const data = JSON.parse(content);
  return {
    type: 'model_inference',
    entries: Array.isArray(data) ? data : [data],
  };
}

function parseModelTrainingLog(content) {
  const data = JSON.parse(content);
  return {
    type: 'model_training',
    entries: [data], // Usually single config
  };
}

function parseIdpLog(content) {
  const data = JSON.parse(content);
  return {
    type: 'idp',
    entries: Array.isArray(data) ? data : [data],
  };
}

function parseGenericLog(content) {
  try {
    const data = JSON.parse(content);
    return {
      type: 'generic',
      entries: Array.isArray(data) ? data : [data],
    };
  } catch {
    return {
      type: 'generic',
      entries: [{ raw: content }],
    };
  }
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

    const formData = await request.formData();
    const files = formData.getAll('logs');

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const { db, FieldValue } = getFirebaseAdmin();
    const logsRef = db.collection(COLLECTIONS.AI_ACT_LOGS);
    const ingestedLogs = [];

    for (const file of files) {
      const filename = file.name;
      const content = await file.text();
      
      const parsed = parseLogFile(filename, content);
      
      // Store in Firestore
      const logDoc = {
        filename,
        type: parsed.type,
        entries: parsed.entries,
        entryCount: parsed.entries.length,
        uploadedAt: FieldValue.serverTimestamp(),
        uploadedBy: session.user.uid,
      };

      const docRef = await logsRef.add(logDoc);
      
      // Create ledger event for log ingestion
      const event = {
        eventId: generateEventId(),
        eventType: 'LOG_INGESTED',
        userId: session.user.uid,
        orgId: 'system',
        logId: docRef.id,
        logType: parsed.type,
        entryCount: parsed.entries.length,
        signingKeyId: 'system-key-1',
      };

      event.signature = signEvent(event, process.env.ORBIT_SYSTEM_SECRET || 'demo_system_secret_' + 'x'.repeat(32));
      
      // Get previous event for hash chain
      try {
        const { getLatestEvent } = await import('@/lib/orbit/db-admin');
        const previousEvent = await getLatestEvent(session.user.uid, 'system');
        if (previousEvent && previousEvent.eventHash) {
          event.previousEventHash = previousEvent.eventHash;
          event.blockIndex = (previousEvent.blockIndex || 0) + 1;
        } else {
          event.blockIndex = 1;
        }
        const computedHash = hashEvent(event);
        if (computedHash) {
          event.eventHash = computedHash;
        }
      } catch (error) {
        console.error('Error setting up hash chain:', error);
        event.blockIndex = 1;
      }

      const eventsRef = db.collection(COLLECTIONS.LEDGER_EVENTS);
      await eventsRef.add({
        ...event,
        timestamp: FieldValue.serverTimestamp(),
      });

      ingestedLogs.push({
        id: docRef.id,
        filename,
        type: parsed.type,
        entries: parsed.entries.length,
        uploadedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      logs: ingestedLogs,
    });
  } catch (error) {
    console.error('Error ingesting logs:', error);
    return NextResponse.json(
      { error: 'Failed to ingest logs', details: error.message },
      { status: 500 }
    );
  }
}

