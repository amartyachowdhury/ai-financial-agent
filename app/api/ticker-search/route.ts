import { auth } from '@/app/(auth)/auth';
import { resolveFinancialDatasetsApiKey } from '@/lib/server/api-keys';
import { searchTickers } from '@/lib/server/ticker-search';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';

  if (query.length < 1) {
    return Response.json({ tickers: [] });
  }

  const apiKey = resolveFinancialDatasetsApiKey(undefined);

  if (!apiKey) {
    return Response.json(
      { error: 'Financial Datasets API key is required' },
      { status: 400 },
    );
  }

  try {
    const tickers = await searchTickers(query, apiKey);
    return Response.json({ tickers });
  } catch {
    return Response.json(
      { error: 'Failed to search tickers' },
      { status: 502 },
    );
  }
}
