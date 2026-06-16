import { beforeEach, describe, expect, it, vi } from 'vitest';
import { models } from '@/lib/ai/models';

const {
  authMock,
  checkRateLimitMock,
  resolveOpenAIApiKeyMock,
  resolveFinancialDatasetsApiKeyMock,
  getChatByIdMock,
  saveMessagesMock,
  createDataStreamResponseMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  resolveOpenAIApiKeyMock: vi.fn(),
  resolveFinancialDatasetsApiKeyMock: vi.fn(),
  getChatByIdMock: vi.fn(),
  saveChatMock: vi.fn(),
  saveMessagesMock: vi.fn(),
  createDataStreamResponseMock: vi.fn(),
}));

vi.mock('@/app/(auth)/auth', () => ({
  auth: authMock,
}));

vi.mock('@/lib/server/rate-limit', () => ({
  checkRateLimit: checkRateLimitMock,
}));

vi.mock('@/lib/server/api-keys', () => ({
  resolveOpenAIApiKey: resolveOpenAIApiKeyMock,
  resolveFinancialDatasetsApiKey: resolveFinancialDatasetsApiKeyMock,
}));

vi.mock('@/lib/db/queries', () => ({
  getChatById: getChatByIdMock,
  saveChat: vi.fn(),
  saveMessages: saveMessagesMock,
}));

vi.mock('../../actions', () => ({
  generateTitleFromUserMessage: vi.fn(),
}));

vi.mock('ai', () => ({
  convertToCoreMessages: (messages: unknown[]) => messages,
  createDataStreamResponse: createDataStreamResponseMock,
  generateObject: vi.fn(),
  streamText: vi.fn(),
}));

import { POST } from './route';

const validChatId = '550e8400-e29b-41d4-a716-446655440000';

function buildRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    id: validChatId,
    modelId: models[0].id,
    messages: [{ role: 'user', content: 'What is AAPL trading at?' }],
  };
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetAt: Date.now() + 60_000,
    });
    resolveOpenAIApiKeyMock.mockReturnValue('test-openai-key');
    resolveFinancialDatasetsApiKeyMock.mockReturnValue('test-fda-key');
    getChatByIdMock.mockResolvedValue(null);
    saveMessagesMock.mockResolvedValue(undefined);
    createDataStreamResponseMock.mockReturnValue(
      new Response('stream', { status: 200 }),
    );
  });

  it('returns 400 for invalid request bodies', async () => {
    const response = await POST(buildRequest({ id: 'not-a-uuid' }));

    expect(response.status).toBe(400);
  });

  it('returns 401 when there is no session', async () => {
    authMock.mockResolvedValue(null);

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    checkRateLimitMock.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(429);
  });

    it('returns 400 when API keys are missing', async () => {
      authMock.mockResolvedValue({ user: { id: 'user-1' } });
      resolveOpenAIApiKeyMock.mockReturnValue(undefined);

      const response = await POST(buildRequest(validBody()));

      expect(response.status).toBe(400);
      expect(await response.text()).toContain('Model API key');
    });

  it('returns 401 when the chat belongs to another user', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getChatByIdMock.mockResolvedValue({
      id: validChatId,
      userId: 'user-2',
    });

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(401);
  });

  it('starts a streaming response for valid authenticated requests', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await POST(buildRequest(validBody()));

    expect(response.status).toBe(200);
    expect(createDataStreamResponseMock).toHaveBeenCalledOnce();
    expect(saveMessagesMock).toHaveBeenCalled();
  });
});
