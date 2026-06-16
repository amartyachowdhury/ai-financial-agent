import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authMock,
  assertChatOwnershipMock,
  getVotesByChatIdMock,
  voteMessageMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  assertChatOwnershipMock: vi.fn(),
  getVotesByChatIdMock: vi.fn(),
  voteMessageMock: vi.fn(),
}));

vi.mock('@/app/(auth)/auth', () => ({
  auth: authMock,
}));

vi.mock('@/lib/db/queries', () => ({
  assertChatOwnership: assertChatOwnershipMock,
  ChatOwnershipError: class ChatOwnershipError extends Error {},
  getVotesByChatId: getVotesByChatIdMock,
  voteMessage: voteMessageMock,
}));

import { GET, PATCH } from './route';

const validChatId = '550e8400-e29b-41d4-a716-446655440000';
const validMessageId = '6ba7b810-9dad-11d1-80b4-00c04fd4308c';

describe('/api/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    assertChatOwnershipMock.mockResolvedValue(undefined);
    getVotesByChatIdMock.mockResolvedValue([]);
    voteMessageMock.mockResolvedValue(undefined);
  });

  it('GET returns 400 when chatId is missing', async () => {
    const response = await GET(new Request('http://localhost/api/vote'));

    expect(response.status).toBe(400);
  });

  it('GET returns 401 without a session', async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(
      new Request(`http://localhost/api/vote?chatId=${validChatId}`),
    );

    expect(response.status).toBe(401);
  });

  it('GET returns votes for owned chats', async () => {
    getVotesByChatIdMock.mockResolvedValue([
      { chatId: validChatId, messageId: validMessageId, isUpvoted: true },
    ]);

    const response = await GET(
      new Request(`http://localhost/api/vote?chatId=${validChatId}`),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { chatId: validChatId, messageId: validMessageId, isUpvoted: true },
    ]);
  });

  it('PATCH returns 400 for invalid payloads', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/vote', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: validChatId }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it('PATCH records a vote for owned chats', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/vote', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: validChatId,
          messageId: validMessageId,
          type: 'up',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(voteMessageMock).toHaveBeenCalledWith({
      chatId: validChatId,
      messageId: validMessageId,
      type: 'up',
    });
  });
});
