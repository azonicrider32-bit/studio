
'use server';

/**
 * @fileOverview A Genkit flow for generating a facial analysis overlay on an image.
 *
 * This flow takes an image and a description of a template, and asks the AI
 * to identify facial landmarks and draw the specified template over the face.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateFacialOverlayInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe("The source portrait image, as a data URI."),
  overlayTemplatePrompt: z
    .string()
    .describe("A text prompt describing the visual template to draw over the face."),
});
export type GenerateFacialOverlayInput = z.infer<typeof GenerateFacialOverlayInputSchema>;

export const GenerateFacialOverlayOutputSchema = z.object({
  overlayImageUri: z.string().optional().describe('The data URI of the image with the overlay drawn on it.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type GenerateFacialOverlayOutput = z.infer<typeof GenerateFacialOverlayOutputSchema>;

export async function generateFacialOverlay(input: GenerateFacialOverlayInput): Promise<GenerateFacialOverlayOutput> {
  return generateFacialOverlayFlow(input);
}

const generateFacialOverlayFlow = ai.defineFlow(
  {
    name: 'generateFacialOverlayFlow',
    inputSchema: GenerateFacialOverlayInputSchema,
    outputSchema: GenerateFacialOverlayOutputSchema,
  },
  async ({ photoDataUri, overlayTemplatePrompt }) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { 
            text: `You are an expert facial analysis AI. Analyze the face in the provided image. Identify key facial landmarks (eyes, nose, mouth, forehead, jawline). Then, draw a precise visual template on top of the image based on these landmarks, as described in the following prompt: "${overlayTemplatePrompt}". Use a specific, highly visible color for the lines (e.g., bright green, RGBA(0, 255, 0, 0.8)) so they are clearly visible. Return the original image with ONLY this overlay drawn on top.` 
          },
          { media: { url: photoDataUri } },
        ],
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('The AI model did not return an overlay image.');
      }

      return {
        overlayImageUri: media.url,
      };

    } catch (error: any) {
      console.error('Error during facial overlay generation flow:', error);
      return {
        error: `Overlay generation failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
