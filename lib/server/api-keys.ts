import 'server-only';

export function resolveOpenAIApiKey(clientKey?: string | null): string | undefined {
  return clientKey || process.env.OPENAI_API_KEY || undefined;
}

export function resolveFinancialDatasetsApiKey(
  clientKey?: string | null,
): string | undefined {
  return clientKey || process.env.FINANCIAL_DATASETS_API_KEY || undefined;
}
