import { describe, expect, it } from 'vitest';
import { sanitizeResponseMessages } from '@/lib/utils';

describe('sanitizeResponseMessages', () => {
  it('removes assistant tool calls without matching tool results', () => {
    const messages = [
      {
        role: 'assistant' as const,
        content: [
          { type: 'tool-call' as const, toolCallId: '1', toolName: 'getNews', args: {} },
          { type: 'text' as const, text: 'Here is the news.' },
        ],
      },
    ];

    const sanitized = sanitizeResponseMessages(messages);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0].content).toEqual([
      { type: 'text', text: 'Here is the news.' },
    ]);
  });

  it('keeps tool calls that have matching tool results', () => {
    const messages = [
      {
        role: 'assistant' as const,
        content: [
          { type: 'tool-call' as const, toolCallId: '1', toolName: 'getNews', args: {} },
        ],
      },
      {
        role: 'tool' as const,
        content: [
          { type: 'tool-result' as const, toolCallId: '1', toolName: 'getNews', result: {} },
        ],
      },
    ];

    const sanitized = sanitizeResponseMessages(messages);
    expect(sanitized).toHaveLength(2);
  });
});
