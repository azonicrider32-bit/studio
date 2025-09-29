 'use server';
/**
 * @fileOverview This file defines a Genkit flow to suggest relevant segmentation presets based on image analysis.
 *
 * It exports:
 * - `suggestSegmentationPresets` - An async function that takes an image data URI and returns a list of suggested segmentation presets.
 * - `SuggestSegmentationPresetsInput` - The input type for `suggestSegmentationPresets`.
 * - `SuggestSegmentationPresetsOutput` - The output type for `suggestSegmentationPresets`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSegmentationPresetsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of the image to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestSegmentationPresetsInput = z.infer<typeof SuggestSegmentationPresetsInputSchema>;

const SuggestedPresetSchema = z.object({
  presetName: z.string().describe('The name of the suggested preset.'),
  category: z.string().describe('The category of the suggested preset (e.g., skin, clouds, water).'),
  reason: z.string().describe('The reason why this preset is suggested for the given image.'),
});

const SuggestSegmentationPresetsOutputSchema = z.array(SuggestedPresetSchema);
export type SuggestSegmentationPresetsOutput = z.infer<typeof SuggestSegmentationPresetsOutputSchema>;

export async function suggestSegmentationPresets(input: SuggestSegmentationPresetsInput): Promise<SuggestSegmentationPresetsOutput> {
  return suggestSegmentationPresetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSegmentationPresetsPrompt',
  input: {schema: SuggestSegmentationPresetsInputSchema},
  output: {schema: SuggestSegmentationPresetsOutputSchema},
  prompt: `You are an expert image analysis tool. Given an image, you will suggest relevant segmentation presets based on the detected content.

Analyze the following image and suggest up to 3 relevant segmentation presets. For each preset, provide the preset name, category, and a brief reason for the suggestion.

Image: {{media url=imageDataUri}}
`,
});

const suggestSegmentationPresetsFlow = ai.defineFlow(
  {
    name: 'suggestSegmentationPresetsFlow',
    inputSchema: SuggestSegmentationPresetsInputSchema,
    outputSchema: SuggestSegmentationPresetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
