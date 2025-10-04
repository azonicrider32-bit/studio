'use server';

/**
 * @fileOverview A Genkit flow for securely uploading assets to Firebase Storage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import { UploadAssetInputSchema, type UploadAssetInput, type UploadAssetOutput, UploadAssetOutputSchema } from '@/lib/types';


// Ensure Firebase Admin is initialized only once.
if (!getApps().length) {
  // Call initializeApp without arguments. 
  // It will automatically use the service account credentials from the environment.
  initializeApp();
}

export async function uploadAsset(input: UploadAssetInput): Promise<UploadAssetOutput> {
  return uploadAssetFlow(input);
}

const uploadAssetFlow = ai.defineFlow(
  {
    name: 'uploadAssetFlow',
    inputSchema: UploadAssetInputSchema,
    outputSchema: UploadAssetOutputSchema,
  },
  async ({ userId, fileName, fileDataUri }) => {
    try {
      const bucket = getStorage().bucket();

      // Extract content type and base64 data from data URI
      const match = fileDataUri.match(/^data:(.+);base64,(.*)$/);
      if (!match) {
        throw new Error('Invalid data URI format.');
      }
      const contentType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const assetId = `asset_${Date.now()}_${Math.random()}`;
      const gcsPath = `assets/${userId}/${assetId}-${fileName}`;
      const file = bucket.file(gcsPath);

      // Upload the file buffer
      await file.save(buffer, {
        metadata: {
          contentType: contentType,
        },
      });

      // Make the file public to get a download URL
      await file.makePublic();
      
      // Get the public URL
      const downloadURL = file.publicUrl();

      return {
        downloadURL: downloadURL,
        gcsPath: gcsPath,
      };
    } catch (error: any) {
      console.error('Error during asset upload flow:', error);
      return {
        error: `Asset upload failed: ${error.message || 'Unknown server error'}`,
      };
    }
  }
);
