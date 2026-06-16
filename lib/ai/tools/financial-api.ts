import { unstable_cache } from 'next/cache';

const API_BASE = 'https://api.financialdatasets.ai';

export class FinancialApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'FinancialApiError';
  }
}

async function fetchFinancialDataUncached(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<unknown> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'X-API-Key': apiKey,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new FinancialApiError(
      `Financial API error (${response.status}): ${errorText}`,
      response.status,
    );
  }

  return response.json();
}

export function fetchFinancialData(
  cacheKey: string,
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<unknown> {
  return unstable_cache(
    () => fetchFinancialDataUncached(path, apiKey, init),
    [cacheKey, path, init?.method ?? 'GET', init?.body?.toString() ?? ''],
    { revalidate: 600 },
  )();
}

export async function fetchFinancialDataNoCache(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<unknown> {
  return fetchFinancialDataUncached(path, apiKey, init);
}
