'use server';

/**
 * @fileOverview This file defines a Genkit flow for comparing different AI segmentation models.
 *
 * - compareAiModels - A function that compares the results of different AI segmentation models.
 * - CompareAiModelsInput - The input type for the compareAiModels function.
 * - CompareAiModelsOutput - The return type for the compareAiModels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompareAiModelsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to segment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  modelIds: z.string().array().describe('An array of model IDs to compare.'),
});
export type CompareAiModelsInput = z.infer<typeof CompareAiModelsInputSchema>;

const CompareAiModelsOutputSchema = z.object({
  results: z
    .object({
      modelId: z.string(),
      modelName: z.string(),
      segmentationDataUri: z.string().optional(),
      inferenceTime: z.number().optional(),
      error: z.string().optional(),
    })
    .array()
    .describe('An array of segmentation results from different AI models.'),
});
export type CompareAiModelsOutput = z.infer<typeof CompareAiModelsOutputSchema>;

export async function compareAiModels(input: CompareAiModelsInput): Promise<CompareAiModelsOutput> {
  return compareAiModelsFlow(input);
}

const compareAiModelsFlow = ai.defineFlow(
  {
    name: 'compareAiModelsFlow',
    inputSchema: CompareAiModelsInputSchema,
    outputSchema: CompareAiModelsOutputSchema,
  },
  async input => {
    const {photoDataUri, modelIds} = input;

    const results = await Promise.all(
      modelIds.map(async modelId => {
        try {
          const startTime = Date.now();
          const {media} = await ai.generate({
            model: modelId as any,
            prompt: [
              {media: {url: photoDataUri}},
              {text: `Segment the image using model ${modelId}`},
            ],
          });
          const endTime = Date.now();

          return {
            modelId: modelId,
            modelName: modelId.split('/').pop()?.replace(/-/g, ' ') ?? modelId, 
            segmentationDataUri: media?.url,
            inferenceTime: (endTime - startTime) / 1000, 
            error: undefined,
          };
        } catch (error: any) {
          console.error(`Error segmenting with model ${modelId}:`, error);
          return {
            modelId: modelId,
            modelName: modelId.split('/').pop()?.replace(/-/g, ' ') ?? modelId,
            segmentationDataUri: undefined,
            inferenceTime: undefined,
            error: "Model not available or failed.",
          };
        }
      })
    );

    return {results};
  }
);
