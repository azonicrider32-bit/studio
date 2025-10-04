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
  cost_function: z.enum(["sobel", "gradient", "laplacian"]).default("sobel").describe("The cost function to use for edge detection.")
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
Analyze the user's lasso path and the provided image, using the '{{cost_function}}' cost function for edge detection.
The user is trying to select: {{{prompt}}}.
The user has provided a rough polygon with these vertices: {{{JSONstringify lassoPath}}}.
Your task is to analyze the image content within and near this polygon and return a refined, more accurate list of vertices that tightly follows the boundary of the specified object. The new path should have a similar number of points but be snapped to the object's edges.
Return the refined path as 'enhancedPath'.

Image: {{media url=photoDataUri}}
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
