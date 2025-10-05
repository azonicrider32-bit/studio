import { config } from 'dotenv';
config();

import '@/ai/flows/compare-ai-models.ts';
import '@/ai/flows/suggest-segmentation-presets.ts';
import '@/ai/flows/intelligent-lasso-assisted-path-snapping.ts';
import '@/ai/flows/magic-wand-assisted-segmentation.ts';
import '@/ai/flows/inpaint-with-prompt.ts';
import '@/ai/flows/add-object-flow.ts';
import '@/ai/flows/upload-asset-flow.ts';
import '@/ai/flows/text-to-speech-flow.ts';
