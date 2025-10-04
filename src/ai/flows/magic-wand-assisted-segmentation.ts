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
  contentType: z.string().optional().describe('A comma-separated list of objects to segment (e.g., "hair, face, shirt").'),
  modelId: z.string().optional().describe('The ID of the model to use for segmentation.'),
  initialSelectionMask: z.string().optional().describe('A data URI of a pre-selected mask to be refined by the AI.'),
});
export type MagicWandAssistedSegmentationInput = z.infer<typeof MagicWandAssistedSegmentationInputSchema>;

const MagicWandAssistedSegmentationOutputSchema = z.object({
  maskDataUri: z.string().optional().describe('The data URI of the generated color-coded segmentation map.'),
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
        
      let promptText = `You are an expert image segmentation assistant. Your task is to create a color-coded segmentation map.
Analyze the image and identify the following distinct objects: ${input.contentType || 'the main subject'}.
For each object you identify from that list, assign it a unique, solid color (e.g., red, blue, green, yellow, etc.) and create a mask.
The final output should be a single image where each segmented object is filled with its assigned solid color at 100% opacity. This will be used as a map for programmatic selection, so colors must be distinct and solid.`;

      if (input.initialSelectionMask) {
          prompts.push({ media: { url: input.initialSelectionMask, role: 'mask' }});
          promptText += `\n\nThe user has provided an initial selection mask. Use this mask as a strong hint for the primary object of interest and its texture. Segment this object and any other requested objects: ${input.contentType || 'the main subject'}.`;
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
        message: 'Segmentation map generated successfully.',
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
