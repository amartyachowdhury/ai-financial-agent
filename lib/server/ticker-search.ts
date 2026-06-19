import 'server-only';

import { unstable_cache } from 'next/cache';

import { fetchFinancialDataNoCache } from '@/lib/ai/tools/financial-api';

export interface TickerEntry {
  ticker: string;
  name?: string;
}

async function fetchAllTickers(apiKey: string): Promise<TickerEntry[]> {
  const data = (await fetchFinancialDataNoCache(
    '/financials/tickers/',
    apiKey,
  )) as { tickers?: Array<string | TickerEntry> };

  const raw = data.tickers ?? [];

  return raw.map((entry) =>
    typeof entry === 'string' ? { ticker: entry } : entry,
  );
}

const getCachedTickers = unstable_cache(
  (apiKey: string) => fetchAllTickers(apiKey),
  ['financial-tickers-list'],
  { revalidate: 3600 },
);

export async function searchTickers(
  query: string,
  apiKey: string,
  limit = 10,
): Promise<TickerEntry[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const allTickers = await getCachedTickers(apiKey);

  const matches = allTickers.filter((entry) => {
    const tickerMatch = entry.ticker.toLowerCase().startsWith(normalizedQuery);
    const nameMatch = entry.name?.toLowerCase().includes(normalizedQuery);
    return tickerMatch || nameMatch;
  });

  return matches.slice(0, limit);
}
