/**
 * Cloud Storage utilities for Ruby document assets
 */

import { storage, db } from './firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { collection, addDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Upload a file to Cloud Storage and track it in Firestore
 * @param {File} file - The file to upload
 * @param {string} docId - The document ID this asset belongs to
 * @param {string} tenantId - The tenant ID
 * @param {string} userEmail - The user uploading the file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} - Asset metadata with URL
 */
export async function uploadAsset(file, docId, tenantId, userEmail, onProgress) {
  if (!file || !docId || !tenantId || !userEmail) {
    throw new Error('Missing required parameters for upload');
  }

  // Validate file size (max 10MB for now)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Validate file type (only images and common docs for now)
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `ruby-assets/${tenantId}/${docId}/${timestamp}_${sanitizedFileName}`;

  // Create storage reference
  const storageRef = ref(storage, storagePath);

  // Upload file with progress tracking
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      docId,
      tenantId,
      uploadedBy: userEmail,
      originalName: file.name,
    },
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Track progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error(`Upload failed: ${error.message}`));
      },
      async () => {
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Generate thumbnail URL for images
          let thumbnailURL = null;
          if (file.type.startsWith('image/')) {
            // For now, use the same URL - in production, you'd generate thumbnails
            // via Cloud Functions or a separate service
            thumbnailURL = downloadURL;
          }

          // Calculate file hash (simple hash for now)
          const fileHash = await calculateSimpleHash(file);

          // Create asset metadata in Firestore
          const assetData = {
            docId,
            tenantId,
            name: file.name,
            originalName: file.name,
            mime: file.type,
            size: file.size,
            storagePath,
            url: downloadURL,
            thumbnailUrl: thumbnailURL,
            sha256: fileHash,
            virusScan: 'pending', // Would be updated by a Cloud Function
            uploadedBy: userEmail,
            createdAt: serverTimestamp(),
          };

          const assetsRef = collection(db, 'stea_doc_assets');
          const assetDoc = await addDoc(assetsRef, assetData);

          resolve({
            id: assetDoc.id,
            ...assetData,
            url: downloadURL,
            thumbnailUrl: thumbnailURL,
          });
        } catch (error) {
          console.error('Post-upload error:', error);
          reject(new Error(`Failed to save asset metadata: ${error.message}`));
        }
      }
    );
  });
}

/**
 * Delete an asset from both Storage and Firestore
 * @param {string} assetId - The Firestore document ID of the asset
 * @param {string} storagePath - The storage path of the file
 */
export async function deleteAsset(assetId, storagePath) {
  if (!assetId || !storagePath) {
    throw new Error('Missing asset ID or storage path');
  }

  try {
    // Delete from Storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    const assetDoc = doc(db, 'stea_doc_assets', assetId);
    await deleteDoc(assetDoc);

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete asset: ${error.message}`);
  }
}

/**
 * Calculate a simple hash for file deduplication
 * (In production, use a proper crypto hash)
 */
async function calculateSimpleHash(file) {
  try {
    // For now, return a simple hash based on file metadata
    // In production, you'd use crypto.subtle.digest with SHA-256
    const str = `${file.name}-${file.size}-${file.lastModified}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  } catch (error) {
    console.error('Hash calculation error:', error);
    return 'unknown';
  }
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(mimeType) {
  if (!mimeType) return '📄';

  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.startsWith('text/')) return '📝';
  if (mimeType === 'application/json') return '📋';

  return '📄';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
