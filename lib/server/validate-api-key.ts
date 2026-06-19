import 'server-only';

import { OpenAI } from 'openai';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export async function validateOpenAIKey(
  apiKey: string,
): Promise<ValidationResult> {
  try {
    const openai = new OpenAI({ apiKey });
    const list = await openai.models.list();

    if (list.data.length > 0) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Invalid OpenAI API key',
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid OpenAI API key. Please check your key and try again.',
    };
  }
}

export async function validateFinancialDatasetsKey(
  apiKey: string,
): Promise<ValidationResult> {
  try {
    const response = await fetch(
      'https://api.financialdatasets.ai/prices/snapshot?ticker=AAPL',
      {
        headers: { 'X-API-Key': apiKey },
      },
    );

    if (response.ok) {
      return { isValid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        isValid: false,
        error: 'Invalid Financial Datasets API key',
      };
    }

    return {
      isValid: false,
      error: `Financial Datasets API returned status ${response.status}`,
    };
  } catch {
    return {
      isValid: false,
      error:
        'Invalid Financial Datasets API key. Please check your key and try again.',
    };
  }
}
