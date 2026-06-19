import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));

import {
  fetchFinancialDataNoCache,
  FinancialApiError,
} from '@/lib/ai/tools/financial-api';

describe('financial-api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed JSON on success', async () => {
    global.fetch = vi.fn(async () =>
      Response.json({ snapshot: { price: 100 } }),
    ) as typeof fetch;

    const result = await fetchFinancialDataNoCache(
      '/prices/snapshot?ticker=AAPL',
      'test-key',
    );

    expect(result).toEqual({ snapshot: { price: 100 } });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.financialdatasets.ai/prices/snapshot?ticker=AAPL',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
      }),
    );
  });

  it('throws FinancialApiError with status on HTTP errors', async () => {
    global.fetch = vi.fn(async () =>
      new Response('Unauthorized', { status: 401 }),
    ) as typeof fetch;

    await expect(
      fetchFinancialDataNoCache('/prices/snapshot?ticker=AAPL', 'bad-key'),
    ).rejects.toMatchObject({
      name: 'FinancialApiError',
      status: 401,
    });
  });

  it('includes response body in FinancialApiError message', async () => {
    global.fetch = vi.fn(async () =>
      new Response('Invalid ticker', { status: 404 }),
    ) as typeof fetch;

    try {
      await fetchFinancialDataNoCache('/prices/snapshot?ticker=INVALID', 'key');
      expect.fail('Expected FinancialApiError');
    } catch (error) {
      expect(error).toBeInstanceOf(FinancialApiError);
      expect((error as FinancialApiError).message).toContain('404');
      expect((error as FinancialApiError).message).toContain('Invalid ticker');
    }
  });
});
