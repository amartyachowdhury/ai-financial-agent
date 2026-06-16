import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { votePatchSchema } from '@/lib/api/validation';
import {
  assertChatOwnership,
  ChatOwnershipError,
  getVotesByChatId,
  voteMessage,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await assertChatOwnership({ chatId, userId: session.user.id });
  } catch (error) {
    if (error instanceof ChatOwnershipError) {
      return new Response('Unauthorized', { status: 401 });
    }
    throw error;
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  const json = await request.json();
  const parsed = votePatchSchema.safeParse(json);

  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 });
  }

  const { chatId, messageId, type } = parsed.data;

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await assertChatOwnership({ chatId, userId: session.user.id });
  } catch (error) {
    if (error instanceof ChatOwnershipError) {
      return new Response('Unauthorized', { status: 401 });
    }
    throw error;
  }

  await voteMessage({
    chatId,
    messageId,
    type,
  });

  return new Response('Message voted', { status: 200 });
}
