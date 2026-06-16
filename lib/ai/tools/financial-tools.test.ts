import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));

import { FinancialToolsManager } from '@/lib/ai/tools/financial-tools';

describe('FinancialToolsManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cached results for duplicate tool calls', async () => {
    const manager = new FinancialToolsManager({
      financialDatasetsApiKey: 'test-key',
      dataStream: { writeData: () => {} },
    });

    const tools = manager.getTools();
    let fetchCount = 0;

    global.fetch = vi.fn(async () => {
      fetchCount += 1;
      return new Response(JSON.stringify({ news: [{ title: 'Test' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const first = await tools.getNews.execute({ ticker: 'AAPL', limit: 5 });
    const second = await tools.getNews.execute({ ticker: 'AAPL', limit: 5 });

    expect(first).toEqual(second);
    expect(fetchCount).toBe(1);
  });
});
