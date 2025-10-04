'use server';

/**
 * @fileOverview A Genkit flow for securely uploading assets to Firebase Storage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// Ensure Firebase Admin is initialized only once.
if (!getApps().length) {
  initializeApp({
    storageBucket: firebaseConfig.storageBucket,
  });
}

export const UploadAssetInputSchema = z.object({
  userId: z.string().describe('The ID of the user uploading the asset.'),
  fileName: z.string().describe('The name of the file to be uploaded.'),
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI. Must include a MIME type and use Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type UploadAssetInput = z.infer<typeof UploadAssetInputSchema>;

export const UploadAssetOutputSchema = z.object({
  downloadURL: z.string().optional().describe('The public URL to access the uploaded file.'),
  gcsPath: z.string().optional().describe('The path to the file in Google Cloud Storage.'),
  error: z.string().optional().describe('An error message if the upload failed.'),
});
export type UploadAssetOutput = z.infer<typeof UploadAssetOutputSchema>;

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
