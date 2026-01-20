import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/orbit/auth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const COLLECTIONS = {
  AI_ACT_LOGS: 'orbit_ai_act_logs',
  AI_ACT_LINEAGE: 'orbit_ai_act_lineage',
};

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

// Reconstruct lineage from ingested logs
function reconstructLineageFromLogs(logs) {
  const nodes = [];
  const edges = [];
  
  // Example lineage: User → KYC check → Profile snapshot v3 → Risk model v2 → Decision: APPROVED
  // This is a simplified reconstruction - in production, this would be more sophisticated
  
  // Find user-related events
  const userEvents = logs.filter(log => 
    log.entries?.some(entry => 
      entry.userId || entry.user_id || entry.user || entry.eventName?.includes('User')
    )
  );
  
  // Find KYC events
  const kycEvents = logs.filter(log =>
    log.entries?.some(entry =>
      entry.eventName?.includes('KYC') || 
      entry.type === 'kyc' ||
      entry.action?.includes('kyc')
    )
  );
  
  // Find profile/snapshot events
  const profileEvents = logs.filter(log =>
    log.entries?.some(entry =>
      entry.type === 'profile' ||
      entry.eventName?.includes('Profile') ||
      entry.snapshot
    )
  );
  
  // Find model inference events
  const modelEvents = logs.filter(log =>
    log.type === 'model_inference' ||
    log.entries?.some(entry =>
      entry.model || entry.modelVersion || entry.inference
    )
  );
  
  // Find decision events
  const decisionEvents = logs.filter(log =>
    log.entries?.some(entry =>
      entry.decision || entry.status === 'APPROVED' || entry.status === 'REJECTED'
    )
  );

  // Build nodes
  if (userEvents.length > 0) {
    nodes.push({
      id: 'user',
      label: 'User',
      type: 'user',
      timestamp: userEvents[0].uploadedAt,
    });
  }

  if (kycEvents.length > 0) {
    nodes.push({
      id: 'kyc',
      label: 'KYC Check',
      type: 'process',
      timestamp: kycEvents[0].uploadedAt,
    });
    edges.push({
      from: 'user',
      to: 'kyc',
      type: 'triggers',
      timestamp: kycEvents[0].uploadedAt,
      evidence: `Found in ${kycEvents[0].filename}`,
    });
  }

  if (profileEvents.length > 0) {
    const version = profileEvents[0].entries?.[0]?.version || '3';
    nodes.push({
      id: 'profile',
      label: 'Profile Snapshot',
      type: 'data',
      version: `v${version}`,
      timestamp: profileEvents[0].uploadedAt,
    });
    if (kycEvents.length > 0) {
      edges.push({
        from: 'kyc',
        to: 'profile',
        type: 'creates',
        timestamp: profileEvents[0].uploadedAt,
        evidence: `Found in ${profileEvents[0].filename}`,
      });
    }
  }

  if (modelEvents.length > 0) {
    const modelVersion = modelEvents[0].entries?.[0]?.modelVersion || 
                        modelEvents[0].entries?.[0]?.version || 
                        '2';
    nodes.push({
      id: 'model',
      label: 'Risk Model',
      type: 'model',
      version: `v${modelVersion}`,
      timestamp: modelEvents[0].uploadedAt,
    });
    if (profileEvents.length > 0) {
      edges.push({
        from: 'profile',
        to: 'model',
        type: 'feeds',
        timestamp: modelEvents[0].uploadedAt,
        evidence: `Found in ${modelEvents[0].filename}`,
      });
    }
  }

  if (decisionEvents.length > 0) {
    const decision = decisionEvents[0].entries?.[0]?.decision || 
                    decisionEvents[0].entries?.[0]?.status || 
                    'APPROVED';
    nodes.push({
      id: 'decision',
      label: `Decision: ${decision}`,
      type: 'decision',
      timestamp: decisionEvents[0].uploadedAt,
    });
    if (modelEvents.length > 0) {
      edges.push({
        from: 'model',
        to: 'decision',
        type: 'produces',
        timestamp: decisionEvents[0].uploadedAt,
        evidence: `Found in ${decisionEvents[0].filename}`,
      });
    }
  }

  // If no specific events found, create a generic lineage
  if (nodes.length === 0 && logs.length > 0) {
    nodes.push({
      id: 'start',
      label: 'Log Ingestion',
      type: 'process',
      timestamp: logs[0].uploadedAt,
    });
    
    logs.forEach((log, idx) => {
      if (idx > 0) {
        nodes.push({
          id: `log_${idx}`,
          label: log.filename,
          type: 'data',
          timestamp: log.uploadedAt,
        });
        edges.push({
          from: idx === 1 ? 'start' : `log_${idx - 1}`,
          to: `log_${idx}`,
          type: 'follows',
          timestamp: log.uploadedAt,
        });
      }
    });
  }

  return {
    nodes,
    edges,
    reconstructedAt: new Date().toISOString(),
    sourceLogs: logs.map(log => ({
      id: log.id,
      filename: log.filename,
      type: log.type,
    })),
  };
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

    const { db, FieldValue } = getFirebaseAdmin();
    const logsRef = db.collection(COLLECTIONS.AI_ACT_LOGS);
    
    // Get all ingested logs for this user
    let logs;
    try {
      const logsSnapshot = await logsRef
        .where('uploadedBy', '==', session.user.uid)
        .orderBy('uploadedAt', 'desc')
        .get();

      logs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...sanitizeFirestoreData(doc.data()),
      }));
    } catch (error) {
      // If orderBy fails (no index), fetch without ordering and sort in memory
      console.warn('OrderBy failed, sorting in memory:', error.message);
      const logsSnapshot = await logsRef
        .where('uploadedBy', '==', session.user.uid)
        .get();

      logs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...sanitizeFirestoreData(doc.data()),
      }));
      
      // Sort by uploadedAt descending in memory
      logs.sort((a, b) => {
        const aTime = a.uploadedAt?.toMillis?.() || a.uploadedAt?._seconds * 1000 || new Date(a.uploadedAt || 0).getTime() || 0;
        const bTime = b.uploadedAt?.toMillis?.() || b.uploadedAt?._seconds * 1000 || new Date(b.uploadedAt || 0).getTime() || 0;
        return bTime - aTime;
      });
    }

    if (logs.length === 0) {
      // Return a more helpful response - allow reconstruction with placeholder data
      // This enables the demo to work even without uploaded logs
      const placeholderLineage = {
        nodes: [
          { id: 'user', label: 'User', type: 'user', version: null, timestamp: new Date().toISOString() },
          { id: 'kyc', label: 'KYC Check', type: 'process', version: null, timestamp: new Date().toISOString() },
          { id: 'profile', label: 'Profile Snapshot', type: 'data', version: 'v3', timestamp: new Date().toISOString() },
          { id: 'model', label: 'Risk Model', type: 'model', version: 'v2', timestamp: new Date().toISOString() },
          { id: 'decision', label: 'Decision: APPROVED', type: 'decision', version: null, timestamp: new Date().toISOString() },
        ],
        edges: [
          { from: 'user', to: 'kyc', type: 'triggers' },
          { from: 'kyc', to: 'profile', type: 'creates' },
          { from: 'profile', to: 'model', type: 'feeds' },
          { from: 'model', to: 'decision', type: 'produces' },
        ],
        reconstructedAt: new Date().toISOString(),
        sourceLogs: [],
        note: 'No logs found. Using placeholder lineage for demonstration.',
      };

      // Store placeholder lineage
      const lineageRef = db.collection(COLLECTIONS.AI_ACT_LINEAGE);
      await lineageRef.add({
        userId: session.user.uid,
        lineage: placeholderLineage,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        lineage: placeholderLineage,
        warning: 'No logs found. Using placeholder lineage for demonstration.',
      });
    }

    // Reconstruct lineage
    const lineage = reconstructLineageFromLogs(logs);

    // Store lineage
    const lineageRef = db.collection(COLLECTIONS.AI_ACT_LINEAGE);
    await lineageRef.add({
      userId: session.user.uid,
      lineage,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      lineage,
    });
  } catch (error) {
    console.error('Error reconstructing lineage:', error);
    return NextResponse.json(
      { error: 'Failed to reconstruct lineage', details: error.message },
      { status: 500 }
    );
  }
}

