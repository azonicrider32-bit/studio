'use server';

/**
 * @fileOverview A Genkit flow for adding an object to an image with a transparent background.
 *
 * - addObjectToImage - A function that takes a source image and a prompt to generate a new object on a transparent layer.
 * - AddObjectToImageInput - The input type for the addObjectToImage function.
 * - AddObjectToImageOutput - The return type for the addObjectToImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AddObjectToImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The source image to add the object to, as a data URI."
    ),
  prompt: z.string().describe('The prompt describing the object to add and where to place it.'),
});
export type AddObjectToImageInput = z.infer<typeof AddObjectToImageInputSchema>;


export const AddObjectToImageOutputSchema = z.object({
  generatedObjectDataUri: z.string().optional().describe('The data URI of the generated object on a transparent background.'),
  error: z.string().optional().describe('An error message if the operation failed.'),
});
export type AddObjectToImageOutput = z.infer<typeof AddObjectToImageOutputSchema>;


export async function addObjectToImage(input: AddObjectToImageInput): Promise<AddObjectToImageOutput> {
  return addObjectToImageFlow(input);
}

const addObjectPrompt = ai.definePrompt({
    name: 'addObjectToImagePrompt',
    input: { schema: AddObjectToImageInputSchema },
    output: { schema: AddObjectToImageOutputSchema },
    prompt: `You are an expert image editing AI. Your task is to generate a new object based on a user's prompt and place it realistically into a source image.
    
    CRITICAL REQUIREMENT: You must return two things:
    1. A new version of the full image with the object seamlessly blended in.
    2. A segmentation mask that perfectly isolates ONLY the newly added object.

    The user wants to: "{{prompt}}".

    Analyze the source image and the prompt to determine the correct position, scale, lighting, and perspective for the new object.
    
    Source Image:
    {{media url=photoDataUri}}
    
    First, generate the full new image. Then, from that new image, generate the segmentation mask for the object you just added. The mask should be black and white, where white represents the new object.
    `,
});


const addObjectToImageFlow = ai.defineFlow(
  {
    name: 'addObjectToImageFlow',
    inputSchema: AddObjectToImageInputSchema,
    outputSchema: AddObjectToImageOutputSchema,
  },
  async (input) => {
    try {
      const { response } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { text: `You are an expert image editing AI. Your task is to generate a new object based on a user's prompt and place it realistically into a source image. The user wants to: "${input.prompt}". First, generate the full new image with the object seamlessly blended in. Then, based on the image you just generated, create a black and white segmentation mask that perfectly isolates ONLY the newly added object.` },
          { media: { url: input.photoDataUri } },
        ],
        config: {
          responseModalities: ['IMAGE', 'IMAGE'], // Expecting two images: new full image and the mask
        },
      });
      
      const mediaParts = response.parts.filter(p => p.media);
      if (mediaParts.length < 2) {
        throw new Error('The AI model did not return both an image and a mask.');
      }

      const newFullImageUri = mediaParts[0].media!.url;
      const objectMaskUri = mediaParts[1].media!.url;

      // Client-side logic will be needed to use this mask to "cut out" the object from the new image.
      // For now, we'll just return the masked object URI to prove the concept.
      // A more advanced version would do the compositing on the server.

      return {
        // This is a placeholder. The actual compositing will happen client-side or in a more advanced flow.
        generatedObjectDataUri: objectMaskUri,
      };

    } catch (error: any) {
      console.error('Error during add object flow:', error);
      return {
        error: `Adding object failed: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
