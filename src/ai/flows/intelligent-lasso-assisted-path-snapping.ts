'use server';

/**
 * @fileOverview A Genkit flow for Intelligent Lasso tool that uses AI to predict object edges for accurate path snapping.
 *
 * - intelligentLassoAssistedPathSnapping - A function that enhances path snapping using AI edge prediction.
 * - IntelligentLassoInput - The input type for the intelligentLassoAssistedPathSnapping function.
 * - IntelligentLassoOutput - The return type for the intelligentLassoAssistedPathSnapping function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentLassoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be segmented, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  lassoPath: z.array(z.object({x: z.number(), y: z.number()})).describe('The path drawn by the user using the lasso tool.'),
  prompt: z.string().describe('A description of the object to segment.'),
});
export type IntelligentLassoInput = z.infer<typeof IntelligentLassoInputSchema>;

const IntelligentLassoOutputSchema = z.object({
  enhancedPath: z
    .array(z.object({x: z.number(), y: z.number()}))
    .describe('The enhanced lasso path, snapped to AI-predicted object edges.'),
});
export type IntelligentLassoOutput = z.infer<typeof IntelligentLassoOutputSchema>;

export async function intelligentLassoAssistedPathSnapping(
  input: IntelligentLassoInput
): Promise<IntelligentLassoOutput> {
  return intelligentLassoAssistedPathSnappingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentLassoAssistedPathSnappingPrompt',
  input: {schema: IntelligentLassoInputSchema},
  output: {schema: IntelligentLassoOutputSchema},
  prompt: `You are an AI that enhances lasso paths by predicting object edges.

  Given a photo and a lasso path drawn by the user, adjust the path to more accurately snap to the edges of the object described in the prompt. Return the enhanced path.

  Here is the photo:
  {{media url=photoDataUri}}

  Here is the user-drawn lasso path:
  {{lassoPath}}

  Here is the description of the object to segment:
  {{prompt}}
  `,
});

const intelligentLassoAssistedPathSnappingFlow = ai.defineFlow(
  {
    name: 'intelligentLassoAssistedPathSnappingFlow',
    inputSchema: IntelligentLassoInputSchema,
    outputSchema: IntelligentLassoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);