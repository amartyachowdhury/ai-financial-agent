import { z } from 'zod';

import { models } from '@/lib/ai/models';

const modelIds = models.map((model) => model.id) as [string, ...string[]];

export const chatRequestSchema = z.object({
  id: z.string().uuid(),
  modelId: z.enum(modelIds),
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(['user', 'assistant', 'system', 'data']),
      content: z.union([z.string(), z.array(z.any())]),
      createdAt: z.coerce.date().optional(),
      experimental_attachments: z.array(z.any()).optional(),
      toolInvocations: z.array(z.any()).optional(),
      annotations: z.array(z.any()).optional(),
    }),
  ),
  modelApiKey: z.string().optional(),
  financialDatasetsApiKey: z.string().optional(),
});

export const votePatchSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  type: z.enum(['up', 'down']),
});
