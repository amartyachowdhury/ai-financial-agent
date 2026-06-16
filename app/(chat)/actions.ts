'use server';

import { type CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import {
  assertChatOwnership,
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
  modelApiKey,
}: {
  message: CoreUserMessage;
  modelApiKey: string;
}) {
  const { text: title } = await generateText({
    model: customModel('gpt-4.1-mini-2025-04-14', modelApiKey),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 30 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const [message] = await getMessageById({ id });

  if (!message) {
    throw new Error('Message not found');
  }

  await assertChatOwnership({ chatId: message.chatId, userId: session.user.id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await assertChatOwnership({ chatId, userId: session.user.id });
  await updateChatVisiblityById({ chatId, visibility });
}
