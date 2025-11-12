import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getTemplateById, templateToTipTapJSON } from '@/lib/templates';

/**
 * API endpoint to create a Ruby document from a source artifact (Epic/Feature/Card)
 * POST /api/ruby/create-from-source
 *
 * Body:
 * {
 *   sourceType: 'epic' | 'feature' | 'card',
 *   sourceId: string,
 *   templateId: 'prs' | 'buildSpec' | 'testPlan',
 *   tenantId: string,
 *   idToken: string (Firebase auth token)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { sourceType, sourceId, templateId, tenantId, idToken } = body;

    // Validate required fields
    if (!sourceType || !sourceId || !templateId || !tenantId || !idToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify Firebase auth token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Auth verification failed:', error);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;

    // Get source artifact from Firestore
    const sourceCollectionMap = {
      epic: 'stea_epics',
      feature: 'stea_features',
      card: 'stea_cards',
    };

    const sourceCollection = sourceCollectionMap[sourceType];
    if (!sourceCollection) {
      return NextResponse.json(
        { error: 'Invalid source type' },
        { status: 400 }
      );
    }

    const sourceRef = adminDb.collection(sourceCollection).doc(sourceId);
    const sourceSnap = await sourceRef.get();

    if (!sourceSnap.exists) {
      return NextResponse.json(
        { error: 'Source artifact not found' },
        { status: 404 }
      );
    }

    const sourceData = sourceSnap.data();

    // Get template
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    // Generate document title
    const sourceTypeLabel = sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
    const docTitle = `${template.name} - ${sourceData.title || sourceData.name || 'Untitled'}`;

    // Generate TipTap content from template
    const content = templateToTipTapJSON(template);

    // Create Ruby document
    const docRef = await adminDb.collection('stea_docs').add({
      tenantId,
      title: docTitle,
      type: template.docType || 'documentation',
      templateId: template.id,
      content,
      spaceId: null,
      parentDocId: null,
      linkedEntities: [],
      tags: [],
      createdBy: userEmail,
      createdAt: new Date(),
      updatedBy: userEmail,
      updatedAt: new Date(),
      version: 1,
      isPublic: false,
      collaborators: [userEmail],
    });

    // Create bi-directional DocLink
    await adminDb.collection('stea_doc_links').add({
      fromType: 'document',
      fromId: docRef.id,
      toType: sourceType,
      toId: sourceId,
      relation: 'documents',
      tenantId,
      createdBy: userEmail,
      createdAt: new Date(),
    });

    // Return the created document info
    return NextResponse.json({
      success: true,
      docId: docRef.id,
      docTitle,
      docUrl: `/apps/stea/ruby?doc=${docRef.id}`,
    });

  } catch (error) {
    console.error('Error creating Ruby document:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
