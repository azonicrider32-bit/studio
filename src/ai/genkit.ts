
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { voiceCommandFlow } from './flows/voice-command-flow';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-pro',
});
