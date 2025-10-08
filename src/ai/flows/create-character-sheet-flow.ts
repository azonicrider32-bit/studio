
'use server';

/**
 * @fileOverview A Genkit flow for generating a full character sheet from a selection in an image.
 *
 * This flow takes an image and a mask of a selected person, and uses AI to generate
 * a comprehensive set of character assets, including multiple views, expressions, and outfits.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for different views (front, side, etc.)
const CharacterViewsSchema = z.object({
  front: z.string().optional().describe("Data URI for the front-facing portrait."),
  threeQuarter: z.string().optional().describe("Data URI for the three-quarter view."),
  side: z.string().optional().describe("Data URI for the side profile view."),
  back: z.string().optional().describe("Data URI for the back view."),
});

// Schema for different facial expressions
const CharacterExpressionsSchema = z.object({
  neutral: z.string().optional().describe("Data URI for a neutral expression."),
  smiling: z.string().optional().describe("Data URI for a smiling expression."),
  serious: z.string().optional().describe("Data URI for a serious or angry expression."),
});

// Schema for different outfits
const CharacterOutfitsSchema = z.object({
  casual: z.string().optional().describe("Data URI for the character in a casual outfit."),
  formal: z.string().optional().describe("Data URI for the character in a formal outfit."),
  athletic: z.string().optional().describe("Data URI for the character in athletic wear."),
});


export const CreateCharacterSheetInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe("The source image containing the character, as a data URI."),
  maskDataUri: z
    .string()
    .describe("The mask isolating the character in the source image, as a data URI."),
});
export type CreateCharacterSheetInput = z.infer<typeof CreateCharacterSheetInputSchema>;

export const CreateCharacterSheetOutputSchema = z.object({
  characterSheet: z.object({
    name: z.string().describe("A plausible name for the character."),
    description: z.string().describe("A brief, one-sentence description of the character's appearance."),
    views: CharacterViewsSchema,
    expressions: CharacterExpressionsSchema,
    outfits: CharacterOutfitsSchema,
  }).optional(),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type CreateCharacterSheetOutput = z.infer<typeof CreateCharacterSheetOutputSchema>;


export async function createCharacterSheet(input: CreateCharacterSheetInput): Promise<CreateCharacterSheetOutput> {
  return createCharacterSheetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createCharacterSheetPrompt',
  input: { schema: CreateCharacterSheetInputSchema },
  output: { schema: CreateCharacterSheetOutputSchema },
  prompt: `You are a world-class character concept artist AI. Your task is to take a selected person from an image and generate a full character sheet for them.

  **Source Image:**
  {{media url=photoDataUri}}

  **Selection Mask (White area is the character):**
  {{media url=maskDataUri role="mask"}}

  **CRITICAL INSTRUCTIONS:**
  Based on the character isolated by the mask, you MUST generate the following assets. Ensure the character's identity, face, and key features remain consistent across all generated images.

  1.  **Character Details**:
      -   Generate a plausible name for the character.
      -   Write a one-sentence description of their appearance.

  2.  **Character Views (Generate 4 images):**
      -   'front': A clean, forward-facing studio portrait on a neutral gray background.
      -   'threeQuarter': A three-quarter view portrait.
      -   'side': A side profile view.
      -   'back': A view from the back.

  3.  **Facial Expressions (Generate 3 images):**
      -   'neutral': The character with a neutral expression.
      -   'smiling': The character with a happy smile.
      -   'serious': The character with a serious or determined expression.

  4.  **Outfits (Generate 3 images):**
      -   'casual': The character wearing a casual, everyday outfit (e.g., t-shirt and jeans).
      -   'formal': The character wearing a formal outfit (e.g., a suit or dress).
      -   'athletic': The character wearing athletic or sportswear.

  Return all of this information in a single JSON object matching the output schema.
  `,
});


const createCharacterSheetFlow = ai.defineFlow(
  {
    name: 'createCharacterSheetFlow',
    inputSchema: CreateCharacterSheetInputSchema,
    outputSchema: CreateCharacterSheetOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: `You are a world-class character concept artist AI. Your task is to take a selected person from an image and generate a full character sheet for them.

          **Source Image:**
          {{media url=${input.photoDataUri}}}

          **Selection Mask (White area is the character):**
          {{media url=${input.maskDataUri} role="mask"}}

          **CRITICAL INSTRUCTIONS:**
          Based on the character isolated by the mask, you MUST generate the following assets. Ensure the character's identity, face, and key features remain consistent across all generated images.

          1.  **Character Details**:
              -   Generate a plausible name for the character.
              -   Write a one-sentence description of their appearance.

          2.  **Character Views (Generate 4 images):**
              -   'front': A clean, forward-facing studio portrait on a neutral gray background.
              -   'threeQuarter': A three-quarter view portrait.
              -   'side': A side profile view.
              -   'back': A view from the back.

          3.  **Facial Expressions (Generate 3 images):**
              -   'neutral': The character with a neutral expression.
              -   'smiling': The character with a happy smile.
              -   'serious': The character with a serious or determined expression.

          4.  **Outfits (Generate 3 images):**
              -   'casual': The character wearing a casual, everyday outfit (e.g., t-shirt and jeans).
              -   'formal': The character wearing a formal outfit (e.g., a suit or dress).
              -   'athletic': The character wearing athletic or sportswear.

          Return all of this information in a single JSON object matching the output schema.
        `,
        output: {
          schema: CreateCharacterSheetOutputSchema
        },
        config: {
          // Expecting 10 images total + JSON text
          responseModalities: ['TEXT', 'IMAGE', 'IMAGE', 'IMAGE', 'IMAGE', 'IMAGE', 'IMAGE', 'IMAGE', 'IMAGE', 'IMAGE', 'IMAGE'],
        },
      });

      if (!output || !output.characterSheet) {
        throw new Error('AI model did not return a valid character sheet.');
      }

      return output;

    } catch (error: any) {
      console.error('Error during character sheet generation:', error);
      return {
        error: `Character sheet generation failed: ${error.message || 'Unknown server error'}`,
      };
    }
  }
);
