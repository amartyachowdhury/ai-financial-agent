import { describe, expect, it } from 'vitest';

import {
  buildCoreUserContent,
  extractAttachmentsFromContent,
  extractTextFromUserContent,
} from '@/lib/ai/message-content';

describe('buildCoreUserContent', () => {
  it('returns plain text when there are no attachments', () => {
    expect(buildCoreUserContent({ text: 'Analyze AAPL' })).toBe('Analyze AAPL');
  });

  it('includes image parts when attachments are present', () => {
    const content = buildCoreUserContent({
      text: 'What trend is shown here?',
      attachments: [
        {
          url: 'https://example.com/chart.png',
          contentType: 'image/png',
        },
      ],
    });

    expect(content).toEqual([
      { type: 'text', text: 'What trend is shown here?' },
      {
        type: 'image',
        image: 'https://example.com/chart.png',
      },
    ]);
  });
});

describe('extractAttachmentsFromContent', () => {
  it('reads image parts back into attachment objects', () => {
    const attachments = extractAttachmentsFromContent([
      { type: 'text', text: 'Hello' },
      { type: 'image', image: 'https://example.com/chart.png' },
    ]);

    expect(attachments).toEqual([
      {
        url: 'https://example.com/chart.png',
        name: 'attachment-1',
        contentType: 'image/jpeg',
      },
    ]);
    expect(extractTextFromUserContent('Hello')).toBe('Hello');
  });
});
