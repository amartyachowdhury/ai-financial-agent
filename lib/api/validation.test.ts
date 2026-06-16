import { describe, expect, it } from 'vitest';
import { models } from '@/lib/ai/models';
import {
  chatRequestSchema,
  uploadFileSchema,
  votePatchSchema,
} from '@/lib/api/validation';

const validChatId = '550e8400-e29b-41d4-a716-446655440000';
const validMessageId = '6ba7b810-9dad-11d1-80b4-00c04fd4308c';

describe('chatRequestSchema', () => {
  it('accepts a valid chat request', () => {
    const result = chatRequestSchema.safeParse({
      id: validChatId,
      modelId: models[0].id,
      messages: [
        {
          role: 'user',
          content: 'What is the latest price of AAPL?',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('accepts messages with attachments and tool invocations', () => {
    const result = chatRequestSchema.safeParse({
      id: validChatId,
      modelId: models[0].id,
      messages: [
        {
          role: 'user',
          content: 'Analyze this chart',
          experimental_attachments: [
            {
              url: 'https://example.com/chart.png',
              name: 'chart.png',
              contentType: 'image/png',
            },
          ],
        },
        {
          role: 'assistant',
          content: 'Here is the analysis.',
          toolInvocations: [
            {
              state: 'result',
              toolCallId: 'call-1',
              toolName: 'getStockPrices',
              result: { prices: [] },
            },
          ],
          annotations: [{ messageIdFromServer: validMessageId }],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid model ids', () => {
    const result = chatRequestSchema.safeParse({
      id: validChatId,
      modelId: 'invalid-model',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects malformed attachment urls', () => {
    const result = chatRequestSchema.safeParse({
      id: validChatId,
      modelId: models[0].id,
      messages: [
        {
          role: 'user',
          content: 'Hello',
          experimental_attachments: [{ url: 'not-a-url' }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe('votePatchSchema', () => {
  it('accepts a valid vote payload', () => {
    const result = votePatchSchema.safeParse({
      chatId: validChatId,
      messageId: validMessageId,
      type: 'up',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid vote types', () => {
    const result = votePatchSchema.safeParse({
      chatId: validChatId,
      messageId: validMessageId,
      type: 'sideways',
    });

    expect(result.success).toBe(false);
  });
});

describe('uploadFileSchema', () => {
  it('accepts a valid png upload', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'chart.png', {
      type: 'image/png',
    });

    expect(uploadFileSchema.safeParse(file).success).toBe(true);
  });

  it('rejects unsupported file types', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'notes.txt', {
      type: 'text/plain',
    });

    expect(uploadFileSchema.safeParse(file).success).toBe(false);
  });
});
