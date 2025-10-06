'use server';

/**
 * @fileOverview A Genkit flow for generating a natural language summary of various application events.
 *
 * - summarizeAppEvent - A function that takes a structured event log and returns a human-readable description.
 * - SummarizeAppEventInputSchema - The input type for the function.
 * - SummarizeAppEventOutputSchema - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SummarizeAppEventInputSchema = z.object({
  eventType: z.enum(['performance', 'ai_call', 'error']).describe("The category of the event."),
  tool: z.string().optional().describe("The tool being used (e.g., 'magic-wand', 'lasso')."),
  operation: z.string().optional().describe("The specific operation being measured (e.g., 'selection', 'inpaintWithPrompt')."),
  duration: z.number().optional().describe('The duration of the operation in milliseconds.'),
  error: z.string().optional().describe("The error message, if any."),
  context: z.record(z.any()).optional().describe("Additional context about the event."),
});
export type SummarizeAppEventInput = z.infer<typeof SummarizeAppEventInputSchema>;

export const SummarizeAppEventOutputSchema = z.object({
  description: z.string().describe('A natural language summary of the application event.'),
});
export type SummarizeAppEventOutput = z.infer<typeof SummarizeAppEventOutputSchema>;

export async function summarizeAppEvent(input: SummarizeAppEventInput): Promise<SummarizeAppEventOutput> {
  return summarizeAppEventFlow(input);
}

const prompt = ai.definePrompt({
    name: 'summarizeAppEventPrompt',
    input: { schema: SummarizeAppEventInputSchema },
    output: { schema: SummarizeAppEventOutputSchema },
    prompt: `You are an expert performance and error analyst for a complex image editing application. Your task is to provide a concise, human-readable summary of a structured event log.

    Analyze the following event data and generate a one-sentence summary.
    
    - Event Type: {{{eventType}}}
    - Tool: {{{tool}}}
    - Operation: {{{operation}}}
    - Duration: {{{duration}}}ms
    - Error: {{{error}}}
    - Context: {{{JSONstringify context}}}

    **Guidelines:**
    - If it's a 'performance' event, classify the duration: <100ms is "fast", 100-500ms is "moderate", >500ms is "slow" or a "bottleneck".
    - If it's an 'ai_call' event, mention the model or operation and its duration.
    - If it's an 'error' event, state the operation that failed and summarize the error message concisely.
    - Be professional and clear.
    
    **Example (performance):**
    Input: { eventType: 'performance', tool: 'magic-wand', operation: 'selection-preview', duration: 250 }
    Output: { description: "The Magic Wand's selection preview took a moderate 250ms, potentially impacting real-time responsiveness." }

    **Example (ai_call):**
    Input: { eventType: 'ai_call', tool: 'banana', operation: 'inpaintWithPrompt', duration: 1850 }
    Output: { description: "AI inpainting with the Banana tool completed successfully in 1.85 seconds." }
    
    **Example (error):**
    Input: { eventType: 'error', tool: 'blemish-remover', operation: 'inpaintWithPrompt', error: "Rate limit exceeded" }
    Output: { description: "Blemish remover failed due to an AI rate limit, indicating high server traffic." }

    Now, analyze the provided event data.
    `,
});

const summarizeAppEventFlow = ai.defineFlow(
  {
    name: 'summarizeAppEventFlow',
    inputSchema: SummarizeAppEventInputSchema,
    outputSchema: SummarizeAppEventOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
