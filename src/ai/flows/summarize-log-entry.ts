'use server';

/**
 * @fileOverview A Genkit flow for generating a natural language summary of a performance log entry.
 *
 * - summarizeLogEntry - A function that takes a structured performance log and returns a human-readable description.
 * - SummarizeLogEntryInputSchema - The input type for the function.
 * - SummarizeLogEntryOutputSchema - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SummarizeLogEntryInputSchema = z.object({
  tool: z.string().describe("The tool being used (e.g., 'magic-wand', 'lasso')."),
  operation: z.string().describe("The specific operation being measured (e.g., 'selection', 'path-finding')."),
  duration: z.number().describe('The duration of the operation in milliseconds.'),
  context: z.object({
      image: z.string().optional().describe('URL or identifier of the image being processed.'),
      layerCount: z.number().optional().describe('Number of layers at the time of the event.')
  }).optional().describe("Additional context about the event."),
});
export type SummarizeLogEntryInput = z.infer<typeof SummarizeLogEntryInputSchema>;

export const SummarizeLogEntryOutputSchema = z.object({
  description: z.string().describe('A natural language summary of the performance event.'),
});
export type SummarizeLogEntryOutput = z.infer<typeof SummarizeLogEntryOutputSchema>;

export async function summarizeLogEntry(input: SummarizeLogEntryInput): Promise<SummarizeLogEntryOutput> {
  return summarizeLogEntryFlow(input);
}

const prompt = ai.definePrompt({
    name: 'summarizeLogEntryPrompt',
    input: { schema: SummarizeLogEntryInputSchema },
    output: { schema: SummarizeLogEntryOutputSchema },
    prompt: `You are an expert performance analyst for a complex image editing application. Your task is to provide a concise, human-readable summary of a structured performance log entry.

    Given the following performance data for a single event:
    - Tool: {{{tool}}}
    - Operation: {{{operation}}}
    - Duration: {{{duration}}}ms
    - Context: {{{JSONstringify context}}}

    Generate a one-sentence summary.
    
    - If the duration is less than 100ms, describe it as "fast" or "nominal".
    - If the duration is between 100ms and 500ms, describe it as "moderate" and note that it could be a bottleneck under heavy load.
    - If the duration is over 500ms, describe it as "slow" and identify it as a significant performance bottleneck.
    - Mention the tool and operation in your description.
    
    Example:
    Input: { tool: 'magic-wand', operation: 'selection-preview', duration: 250 }
    Output: { description: "The Magic Wand's selection preview took a moderate 250ms, which could impact real-time responsiveness." }
    `,
});

const summarizeLogEntryFlow = ai.defineFlow(
  {
    name: 'summarizeLogEntryFlow',
    inputSchema: SummarizeLogEntryInputSchema,
    outputSchema: SummarizeLogEntryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
