import { createOpenAI } from '@ai-sdk/openai';

export const customModel = (apiIdentifier: string, openAIApiKey: string) => {
  const provider = createOpenAI({
    apiKey: openAIApiKey,
    compatibility: 'strict',
  });

  return provider.chat(apiIdentifier);
};
