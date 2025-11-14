import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { randomBytes } from 'crypto';
import admin from 'firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Create a signed share link for a Ruby document
 * POST /api/ruby/share-link
 * Body: { docId, expiresInDays, requireAuth, watermark }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { docId, expiresInDays = 30, requireAuth = false, watermark = false } = body;

    if (!docId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Verify document exists
    const docRef = adminDb.collection('stea_docs').doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const docData = docSnap.data();

    // Generate share token
    const shareToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create share link document
    const shareLinkRef = adminDb.collection('stea_share_links').doc(shareToken);
    await shareLinkRef.set({
      docId,
      tenantId: docData.tenantId,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      requireAuth,
      watermark,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      accessCount: 0,
      lastAccessedAt: null,
    });

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arcturusdc.com';
    const shareUrl = `${origin}/apps/stea/ruby/share/${shareToken}`;

    return NextResponse.json({
      shareToken,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get share link details
 * GET /api/ruby/share-link?token=...
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    const shareLinkRef = adminDb.collection('stea_share_links').doc(token);
    const shareLinkSnap = await shareLinkRef.get();

    if (!shareLinkSnap.exists) {
      return NextResponse.json(
        { error: 'Invalid share link' },
        { status: 404 }
      );
    }

    const shareLink = shareLinkSnap.data();

    // Check if expired
    if (shareLink.expiresAt?.toDate() < new Date()) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      );
    }

    // Get document
    const docRef = adminDb.collection('stea_docs').doc(shareLink.docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const docData = docSnap.data();

    // Update access count
    await shareLinkRef.update({
      accessCount: admin.firestore.FieldValue.increment(1),
      lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      docId: shareLink.docId,
      title: docData.title,
      content: docData.content,
      requireAuth: shareLink.requireAuth,
      watermark: shareLink.watermark,
      expiresAt: shareLink.expiresAt?.toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching share link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share link', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Delete/revoke share link
 * DELETE /api/ruby/share-link?token=...
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    const shareLinkRef = adminDb.collection('stea_share_links').doc(token);
    await shareLinkRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting share link:', error);
    return NextResponse.json(
      { error: 'Failed to delete share link', details: error.message },
      { status: 500 }
    );
  }
}

