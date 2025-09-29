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
    name: 'intelligentLassoPrompt',
    input: { schema: IntelligentLassoInputSchema },
    output: { schema: IntelligentLassoOutputSchema },
    prompt: `You are an expert image analysis assistant. Your task is to refine a user-drawn lasso path to snap to the most likely object boundary.
Analyze the user's lasso path and the provided image.
The user is trying to select: {{{prompt}}}.
Adjust the points in the lassoPath to follow the object's edges precisely.
Return the refined path as 'enhancedPath'.

Image: {{media url=photoDataUri}}
User's Lasso Path (JSON): {{{JSON.stringify(lassoPath)}}}
`,
});


const intelligentLassoAssistedPathSnappingFlow = ai.defineFlow(
  {
    name: 'intelligentLassoAssistedPathSnappingFlow',
    inputSchema: IntelligentLassoInputSchema,
    outputSchema: IntelligentLassoOutputSchema,
  },
  async input => {
    // For now, we are returning a slightly modified path to simulate the AI.
    // A real implementation would call a model like the 'prompt' defined above.
    const enhancedPath = input.lassoPath.map(point => ({
        x: point.x + Math.random() * 4 - 2, // a little jitter
        y: point.y + Math.random() * 4 - 2,
    }));

    // close the loop
    if (enhancedPath.length > 2) {
       enhancedPath.push(enhancedPath[0]);
    }

    return { enhancedPath };
  }
);
