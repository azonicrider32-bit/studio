"use server";
/**
 * @fileOverview A Genkit flow for assisting Magic Wand tool with AI.
 *
 * - magicWandAssistedSegmentation - A function that enhances the Magic Wand tool using AI to identify and select regions based on content.
 * - MagicWandAssistedSegmentationInput - The input type for the magicWandAssistedSegmentation function.
 * - MagicWandAssistedSegmentationOutput - The return type for the magicWandAssistedSegmentation function.
 */

import {
ai
} from '@/ai/genkit';
import {z} from 'genkit';

const MagicWandAssistedSegmentationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be segmented, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  contentType: z.string().optional().describe('Content type hint (e.g., skin, sky) to guide AI.'),
  modelId: z.string().optional().describe('The ID of the model to use for segmentation.'),
  initialSelectionMask: z.string().optional().describe('A data URI of a pre-selected mask to be refined by the AI.'),
});
export type MagicWandAssistedSegmentationInput = z.infer<typeof MagicWandAssistedSegmentationInputSchema>;

const MagicWandAssistedSegmentationOutputSchema = z.object({
  maskDataUri: z.string().optional().describe('The data URI of the generated segmentation mask.'),
  isSuccessful: z.boolean().describe('Indicates whether the segmentation was successful.'),
  message: z.string().describe('Descriptive message providing additional context.'),
});
export type MagicWandAssistedSegmentationOutput = z.infer<typeof MagicWandAssistedSegmentationOutputSchema>;

export async function magicWandAssistedSegmentation(input: MagicWandAssistedSegmentationInput): Promise<MagicWandAssistedSegmentationOutput> {
  return magicWandAssistedSegmentationFlow(input);
}


const magicWandAssistedSegmentationFlow = ai.defineFlow(
  {
    name: 'magicWandAssistedSegmentationFlow',
    inputSchema: MagicWandAssistedSegmentationInputSchema,
    outputSchema: MagicWandAssistedSegmentationOutputSchema,
  },
  async input => {
    try {
      
      const prompts: any[] = [{
          media: { url: input.photoDataUri },
        }];

      let promptText = `Find all areas in the image that have a similar texture and pattern as the region indicated by the selection mask.`;
      
      if (input.initialSelectionMask) {
          prompts.push({ media: { url: input.initialSelectionMask, role: 'mask' }});
          if (input.contentType) {
             promptText = `Segment the ${input.contentType} in the image, using the provided mask as a strong hint for the desired texture and pattern.`;
          }
      } else {
         promptText = `Segment the main ${input.contentType || 'object'} in the image.`;
      }
      prompts.push({ text: promptText });


      const { media } = await ai.generate({
        model: (input.modelId as any) || 'googleai/gemini-2.5-flash-image-preview',
        prompt: prompts,
        config: {
          responseModalities: ['IMAGE'],
        }
      });

      if (!media?.url) {
        throw new Error('The AI model did not return a segmentation mask.');
      }
      
      return {
        maskDataUri: media.url,
        isSuccessful: true,
        message: 'Segmentation completed successfully.',
      };
    } catch (error: any) {
      console.error('Error during magic wand assisted segmentation:', error);
      return {
        maskDataUri: '',
        isSuccessful: false,
        message: `Segmentation failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
