import { describe, expect, it } from 'vitest';

import { buildUploadPath } from '@/lib/server/upload-path';

describe('buildUploadPath', () => {
  it('creates a safe uploads path from content type', () => {
    const path = buildUploadPath('image/png');

    expect(path).toMatch(/^uploads\/[A-Za-z0-9_-]+\.png$/);
    expect(path).not.toContain('..');
  });
});
