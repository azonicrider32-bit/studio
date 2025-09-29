'use server';
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
  x: z.number().describe('The x coordinate of the starting point for segmentation.'),
  y: z.number().describe('The y coordinate of the starting point for segmentation.'),
  contentType: z.string().optional().describe('Content type hint (e.g., skin, sky) to guide AI.'),
});
export type MagicWandAssistedSegmentationInput = z.infer<typeof MagicWandAssistedSegmentationInputSchema>;

const MagicWandAssistedSegmentationOutputSchema = z.object({
  maskDataUri: z.string().describe('The data URI of the generated segmentation mask.'),
  isSuccessful: z.boolean().describe('Indicates whether the segmentation was successful.'),
  message: z.string().describe('Descriptive message providing additional context.'),
});
export type MagicWandAssistedSegmentationOutput = z.infer<typeof MagicWandAssistedSegmentationOutputSchema>;

export async function magicWandAssistedSegmentation(input: MagicWandAssistedSegmentationInput): Promise<MagicWandAssistedSegmentationOutput> {
  return magicWandAssistedSegmentationFlow(input);
}

const magicWandAssistedSegmentationPrompt = ai.definePrompt({
  name: 'magicWandAssistedSegmentationPrompt',
  input: {schema: MagicWandAssistedSegmentationInputSchema},
  output: {schema: MagicWandAssistedSegmentationOutputSchema},
  prompt: `You are an AI assistant that enhances the Magic Wand tool in an image editing application. 
Given an image and a starting point (x, y), your task is to generate a segmentation mask that intelligently identifies and selects a region based on its content.

You will receive the image as a data URI, along with coordinates of a starting point. 
If provided a content type hint, use it to assist in creating the selection. 

Consider factors like color similarity, texture, and context to expand the selection appropriately.

Input image: {{media url=photoDataUri}}
Starting point coordinates: ({{x}}, {{y}})
Content type hint: {{contentType}}

Output the segmentation mask as a data URI, indicating the selected region, and set the isSuccessful to true if the segmentation was successful or false otherwise. Also, provide a message describing the outcome.
`,
});

const magicWandAssistedSegmentationFlow = ai.defineFlow(
  {
    name: 'magicWandAssistedSegmentationFlow',
    inputSchema: MagicWandAssistedSegmentationInputSchema,
    outputSchema: MagicWandAssistedSegmentationOutputSchema,
  },
  async input => {
    try {
      const {output} = await magicWandAssistedSegmentationPrompt(input);
      return output!;
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
