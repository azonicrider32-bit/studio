
'use server';

/**
 * @fileOverview A Genkit flow for executing dynamic, user-created AI tools.
 *
 * This flow takes a prompt template and a set of parameters, compiles them,
 * and executes the request against the Gemini AI model. It supports an optional
 * overlay image for visual guidance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const CustomToolInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe("The source image, as a data URI."),
  maskDataUri: z
    .string()
    .optional()
    .describe("An optional mask image (for inpainting), as a data URI."),
  overlayDataUri: z
    .string()
    .optional()
    .describe("An optional overlay image providing visual guidance, as a data URI."),
  prompt: z
    .string()
    .describe("The final compiled text prompt for the AI."),
});
export type CustomToolInput = z.infer<typeof CustomToolInputSchema>;

export const CustomToolOutputSchema = z.object({
  generatedImageDataUri: z.string().optional().describe('The data URI of the generated image.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type CustomToolOutput = z.infer<typeof CustomToolOutputSchema>;

export async function executeCustomTool(input: CustomToolInput): Promise<CustomToolOutput> {
  return customToolFlow(input);
}

const customToolFlow = ai.defineFlow(
  {
    name: 'customToolFlow',
    inputSchema: CustomToolInputSchema,
    outputSchema: CustomToolOutputSchema,
  },
  async ({ photoDataUri, maskDataUri, overlayDataUri, prompt }) => {
    try {
      const promptParts: any[] = [{ text: prompt }, { media: { url: photoDataUri } }];

      if (maskDataUri) {
        promptParts.push({ media: { url: maskDataUri, role: 'mask' } });
      }
      
      if (overlayDataUri) {
          promptParts.push({ media: { url: overlayDataUri }});
      }

      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: promptParts,
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('The AI model did not return an image.');
      }

      return {
        generatedImageDataUri: media.url,
      };

    } catch (error: any) {
      console.error('Error during custom tool flow:', error);
      return {
        error: `Custom tool execution failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
