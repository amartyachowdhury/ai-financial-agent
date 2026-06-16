import { z } from 'zod';

import { models } from '@/lib/ai/models';

const modelIds = models.map((model) => model.id) as [string, ...string[]];

const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  contentType: z.string().optional(),
});

export type MessageAttachment = z.infer<typeof attachmentSchema>;

const messageContentPartSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

const toolInvocationSchema = z
  .object({
    state: z.enum(['partial-call', 'call', 'result']),
    toolCallId: z.string(),
    toolName: z.string(),
  })
  .passthrough();

const messageAnnotationSchema = z
  .object({
    messageIdFromServer: z.string().optional(),
  })
  .passthrough();

export const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system', 'data']),
  content: z.union([z.string(), z.array(messageContentPartSchema)]),
  createdAt: z.coerce.date().optional(),
  experimental_attachments: z.array(attachmentSchema).optional(),
  toolInvocations: z.array(toolInvocationSchema).optional(),
  annotations: z.array(messageAnnotationSchema).optional(),
});

export const chatRequestSchema = z.object({
  id: z.string().uuid(),
  modelId: z.enum(modelIds),
  messages: z.array(chatMessageSchema),
  modelApiKey: z.string().optional(),
  financialDatasetsApiKey: z.string().optional(),
});

export const votePatchSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  type: z.enum(['up', 'down']),
});

export const uploadFileSchema = z
  .instanceof(Blob)
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: 'File size should be less than 5MB',
  })
  .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
    message: 'File type should be JPEG or PNG',
  });
