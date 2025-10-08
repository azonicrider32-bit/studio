
'use server';

/**
 * @fileOverview A Genkit flow for generating a detailed, multi-step image generation plan from a simple user prompt.
 * This flow is now multimodal and can analyze a provided image for additional context.
 *
 * - generateImagePlan - A function that takes a short user prompt and an optional image and returns a detailed generation plan.
 * - GenerateImagePlanInputSchema - The input type for the function.
 * - GenerateImagePlanOutputSchema - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateImagePlanInputSchema = z.object({
  prompt: z.string().describe("The user's short, initial prompt (e.g., 'motoko kusanagi')."),
  imageDataUri: z.string().optional().describe("An optional source image to analyze for context, as a data URI."),
  aspectRatio: z.string().optional().default('1:1').describe("The desired aspect ratio for the final image."),
});
export type GenerateImagePlanInput = z.infer<typeof GenerateImagePlanInputSchema>;

export const GenerateImagePlanOutputSchema = z.object({
  plan: z.string().describe('A detailed, multi-step generation plan in Markdown format.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type GenerateImagePlanOutput = z.infer<typeof GenerateImagePlanOutputSchema>;

export async function generateImagePlan(input: GenerateImagePlanInput): Promise<GenerateImagePlanOutput> {
  return generateImagePlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImagePlanPrompt',
  input: { schema: GenerateImagePlanInputSchema },
  output: { schema: GenerateImagePlanOutputSchema },
  prompt: `You are an expert creative director and prompt engineer for an advanced AI image generation model.
Your task is to take a user's simple prompt and expand it into a detailed, professional, 3-step generation plan.

{{#if imageDataUri}}
**First, perform a detailed analysis of the provided source image.** Identify the main subject, style, composition, lighting, and color palette.
Use this analysis to inform the generation plan, ensuring the new elements blend seamlessly or purposefully contrast with the existing content.

**Source Image for Analysis:**
{{media url=imageDataUri}}
{{/if}}

The user's prompt is: "{{prompt}}"
The desired aspect ratio is: {{aspectRatio}}

**Your response MUST be a single Markdown string and follow this exact structure:**

## Step-by-Step Generation Plan: {{prompt}}

**Prompt:** {{prompt}}
**Aspect Ratio:** {{aspectRatio}}
{{#if imageDataUri}}
**Image Analysis Summary:** [Provide a one-sentence summary of your image analysis here.]
{{/if}}
---

### Step 1: Establish Core Design & Pose

**Purpose:** To lay down the fundamental character model, pose, and overall composition.

**Details:**
*   **Structure:** [Describe the main subject's pose, framing (e.g., full body, portrait), and placement in the frame. If an image was provided, describe how the new element integrates with the existing composition.]
*   **Core Features:** [Describe the most important, non-negotiable features of the subject. e.g., for a character, their iconic hair, face structure, or primary outfit.]
*   **Composition:** [Describe the overall layout and how the subject fits into the scene.]

**Blends (for initial generation):**
*   [List of 5-7 comma-separated keywords and phrases for the initial style, e.g., "Anime style, cyberpunk aesthetic, detailed character art..."]

---

### Step 2: Refine Details & Add Atmosphere

**Purpose:** To enhance the character's features, introduce environmental elements, and solidify the desired aesthetic.

**Details:**
*   **Refinement:** [Describe specific details to add, e.g., texture on clothing, reflections, secondary features.]
*   **Background:** [Describe the environment behind the subject. Should it be detailed or abstract? What elements should be present? If an image was provided, describe how the background should be modified or extended.]
*   **Lighting:** [Describe the lighting setup. e.g., "dramatic, directional lighting from off-camera," "soft, ambient light." Match the lighting from the source image if one was provided.]
*   **Color Palette:** [Describe the dominant colors for the subject and the background. Harmonize with the source image's palette if provided.]

**Blends:**
*   [List of 5-7 comma-separated keywords for refining details and atmosphere, e.g., "Intricate details, glowing accents on armor, neon cityscape background..."]

---

### Step 3: Final Polish & Atmospheric Enhancement

**Purpose:** To bring the image to a professional finish, adding subtle effects and ensuring visual cohesion.

**Details:**
*   **Effects:** [Describe subtle final touches, e.g., "atmospheric haze," "subtle dust particles," "lens flare."]
*   **Final Touches:** [Describe final checks, e.g., "ensure eyes are exceptionally detailed," "add fine texture to materials."]
*   **Overall Mood:** [Summarize the final intended mood of the image, e.g., "The final image should evoke a sense of professional competence and quiet intensity..."]

**Blends:**
*   [List of 5-7 comma-separated keywords for the final polish, e.g., "High dynamic range, cinematic quality, photorealistic rendering..."]

---
`,
});

const generateImagePlanFlow = ai.defineFlow(
  {
    name: 'generateImagePlanFlow',
    inputSchema: GenerateImagePlanInputSchema,
    outputSchema: GenerateImagePlanOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The AI model did not return a plan.');
      }
      return output;
    } catch (error: any) {
      console.error('Error during image plan generation:', error);
      return {
        plan: '',
        error: `Failed to generate image plan: ${error.message || 'Unknown server error'}`,
      };
    }
  }
);
