'use server';

/**
 * @fileOverview A Genkit flow for performing inpainting on an image using a mask and a prompt.
 *
 * - inpaintWithPrompt - A function that takes an image, a mask, and a prompt to generate a new image.
 * - InpaintWithPromptInput - The input type for the inpaintWithPrompt function.
 * - InpaintWithPromptOutput - The return type for the inpaintWithPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InpaintWithPromptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The source image, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  maskDataUri: z
    .string()
    .describe(
      "The mask image, as a data URI. Black areas are inpainted, white areas are preserved."
    ),
  prompt: z.string().describe('The prompt describing what to generate in the masked area.'),
});
export type InpaintWithPromptInput = z.infer<typeof InpaintWithPromptInputSchema>;


const InpaintWithPromptOutputSchema = z.object({
  generatedImageDataUri: z.string().optional().describe('The data URI of the generated image.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type InpaintWithPromptOutput = z.infer<typeof InpaintWithPromptOutputSchema>;


export async function inpaintWithPrompt(input: InpaintWithPromptInput): Promise<InpaintWithPromptOutput> {
  return inpaintWithPromptFlow(input);
}


const inpaintWithPromptFlow = ai.defineFlow(
  {
    name: 'inpaintWithPromptFlow',
    inputSchema: InpaintWithPromptInputSchema,
    outputSchema: InpaintWithPromptOutputSchema,
  },
  async ({ photoDataUri, maskDataUri, prompt }) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { text: `Inpaint the masked area of the image. The user wants to generate: ${prompt}` },
          { media: { url: photoDataUri } },
          { media: { url: maskDataUri, role: 'mask' } },
        ],
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
      console.error('Error during inpainting flow:', error);
      return {
        error: `Inpainting failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
