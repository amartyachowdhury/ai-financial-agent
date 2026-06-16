import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveFinancialDatasetsApiKey,
  resolveOpenAIApiKey,
} from '@/lib/api-key-resolution';

describe('resolveOpenAIApiKey', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers server env key over client key', () => {
    vi.stubEnv('OPENAI_API_KEY', 'server-key');
    expect(resolveOpenAIApiKey('client-key')).toBe('server-key');
  });

  it('uses client key only when BYOK is enabled and no env key', () => {
    vi.stubEnv('NEXT_PUBLIC_ALLOW_CLIENT_API_KEYS', 'true');
    expect(resolveOpenAIApiKey('client-key')).toBe('client-key');
  });

  it('returns undefined when no env key and BYOK disabled', () => {
    expect(resolveOpenAIApiKey('client-key')).toBeUndefined();
  });
});

describe('resolveFinancialDatasetsApiKey', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers server env key', () => {
    vi.stubEnv('FINANCIAL_DATASETS_API_KEY', 'fda-server');
    expect(resolveFinancialDatasetsApiKey('fda-client')).toBe('fda-server');
  });
});
