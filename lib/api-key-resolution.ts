export function resolveOpenAIApiKey(
  clientKey?: string | null,
): string | undefined {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  if (process.env.NEXT_PUBLIC_ALLOW_CLIENT_API_KEYS === 'true' && clientKey) {
    return clientKey;
  }

  return undefined;
}

export function resolveFinancialDatasetsApiKey(
  clientKey?: string | null,
): string | undefined {
  if (process.env.FINANCIAL_DATASETS_API_KEY) {
    return process.env.FINANCIAL_DATASETS_API_KEY;
  }

  if (process.env.NEXT_PUBLIC_ALLOW_CLIENT_API_KEYS === 'true' && clientKey) {
    return clientKey;
  }

  return undefined;
}

export function shouldSendClientApiKeys(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_CLIENT_API_KEYS === 'true';
}
