'use server';

/**
 * @fileOverview A Genkit flow for performing complex visual edits on an image
 * using drawings and text instructions. The flow is designed to return a
 * structured object containing the final image, a segmentation mask of the
 * edited content, and metadata about the manipulated objects.
 *
 * - visualEditFlow - The main flow function.
 * - VisualEditInput - The input type for the flow.
 * - VisualEditOutput - The structured output type from the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Defines the structure for a single instruction layer (color + prompt)
const InstructionSchema = z.object({
  color: z.string().describe('The hex color of the sketch layer.'),
  prompt: z.string().describe('The user\'s text instruction for this layer.'),
});

// Defines the structure for an object identified by the AI
const IdentifiedObjectSchema = z.object({
    label: z.string().describe('A descriptive label for the object.'),
    color: z.string().describe('The instruction color associated with this object.'),
    box: z.array(z.number()).length(4).describe('The bounding box as [x_min, y_min, x_max, y_max].'),
});

// Input schema for the main flow
export const VisualEditInputSchema = z.object({
  sourceImageUri: z
    .string()
    .describe('The original image to be edited, as a data URI.'),
  sketchImageUri: z
    .string()
    .describe('An image containing all the user\'s drawings and text annotations, as a data URI.'),
  instructions: z.array(InstructionSchema).describe('An array of color-coded text instructions.'),
});
export type VisualEditInput = z.infer<typeof VisualEditInputSchema>;

// The new, structured output schema
export const VisualEditOutputSchema = z.object({
  finalImageUri: z
    .string()
    .describe('The data URI of the final, fully rendered image with all edits applied.'),
  segmentationMaskUri: z
    .string()
    .describe('A black-and-white data URI where white represents the newly added or modified areas.'),
  editedObjects: z
    .array(IdentifiedObjectSchema)
    .describe('An array of objects that were added or modified by the AI.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type VisualEditOutput = z.infer<typeof VisualEditOutputSchema>;

// The main exported function that clients will call
export async function performVisualEdit(input: VisualEditInput): Promise<VisualEditOutput> {
  return visualEditFlow(input);
}

// Prompt definition that enforces the new structured output
const visualEditPrompt = ai.definePrompt({
    name: 'visualEditPrompt',
    input: { schema: VisualEditInputSchema },
    output: { schema: VisualEditOutputSchema },
    prompt: `You are an expert visual editing AI assistant. Your task is to interpret a user's sketches and text instructions to modify an image.

    CRITICAL REQUIREMENTS:
    You MUST return a JSON object with three fields: 'finalImageUri', 'segmentationMaskUri', and 'editedObjects'.

    1.  **Analyze the Inputs**:
        *   **Source Image**: The base image to be edited.
        *   **Sketch Image**: Contains colored drawings and text annotations from the user.
        *   **Instructions**: A JSON array mapping sketch colors to specific text prompts.

    2.  **Perform the Edits**: Execute all instructions on the source image. This may involve adding objects, removing objects, changing colors, or modifying shapes.

    3.  **Generate Outputs**:
        *   **finalImageUri**: Create the final, edited version of the image as a data URI.
        *   **segmentationMaskUri**: Create a black-and-white segmentation mask. White pixels MUST represent the exact areas that were newly generated or modified. Black pixels represent unchanged areas. This mask is crucial for isolating the edits.
        *   **editedObjects**: Identify each object you added or significantly changed. For each one, provide its descriptive label, the associated instruction color, and its bounding box `[x_min, y_min, x_max, y_max]` in the final image.

    **Source Image:**
    {{media url=sourceImageUri}}

    **User's Sketches & Annotations:**
    {{media url=sketchImageUri}}

    **User's Instructions:**
    {{{JSONstringify instructions}}}

    Execute the edits based on the instructions and provide the output in the required JSON format.
    `,
});

// The Genkit flow that orchestrates the process
const visualEditFlow = ai.defineFlow(
  {
    name: 'visualEditFlow',
    inputSchema: VisualEditInputSchema,
    outputSchema: VisualEditOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: `You are an expert visual editing AI assistant. Your task is to interpret a user's sketches and text instructions to modify an image.

        CRITICAL REQUIREMENTS:
        You MUST return a JSON object with three fields: 'finalImageUri', 'segmentationMaskUri', and 'editedObjects'.
    
        1.  **Analyze the Inputs**:
            *   **Source Image**: The base image to be edited.
            *   **Sketch Image**: Contains colored drawings and text annotations from the user.
            *   **Instructions**: A JSON array mapping sketch colors to specific text prompts.
    
        2.  **Perform the Edits**: Execute all instructions on the source image. This may involve adding objects, removing objects, changing colors, or modifying shapes.
    
        3.  **Generate Outputs**:
            *   **finalImageUri**: Create the final, edited version of the image as a data URI.
            *   **segmentationMaskUri**: Create a black-and-white segmentation mask. White pixels MUST represent the exact areas that were newly generated or modified. Black pixels represent unchanged areas. This mask is crucial for isolating the edits.
            *   **editedObjects**: Identify each object you added or significantly changed. For each one, provide its descriptive label, the associated instruction color, and its bounding box \`[x_min, y_min, x_max, y_max]\` in the final image.
    
        **Source Image:**
        {{media url=${input.sourceImageUri}}}
    
        **User's Sketches & Annotations:**
        {{media url=${input.sketchImageUri}}}
    
        **User's Instructions:**
        ${JSON.stringify(input.instructions)}
    
        Execute the edits based on the instructions and provide the output in the required JSON format.
        `,
        output: {
          schema: VisualEditOutputSchema
        },
        config: {
          responseModalities: ['TEXT', 'IMAGE', 'IMAGE'],
        },
      });

      if (!output) {
        throw new Error('AI model did not return a valid structured output.');
      }
      
      return output;

    } catch (error: any) {
      console.error('Error during visual edit flow:', error);
      return {
        finalImageUri: '',
        segmentationMaskUri: '',
        editedObjects: [],
        error: `Visual edit failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
