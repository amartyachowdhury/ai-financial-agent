import { afterEach, describe, expect, it, vi } from 'vitest';

import { isTaskBreakdownEnabled } from '@/lib/ai/task-breakdown';

describe('isTaskBreakdownEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is disabled unless ENABLE_TASK_BREAKDOWN=true', () => {
    vi.stubEnv('ENABLE_TASK_BREAKDOWN', 'false');
    expect(isTaskBreakdownEnabled()).toBe(false);
  });

  it('is enabled when ENABLE_TASK_BREAKDOWN=true', () => {
    vi.stubEnv('ENABLE_TASK_BREAKDOWN', 'true');
    expect(isTaskBreakdownEnabled()).toBe(true);
  });
});
