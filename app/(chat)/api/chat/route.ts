import {
  type Message,
  convertToCoreMessages,
  createDataStreamResponse,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  appendTaskBreakdownToUserMessage,
  generateTaskBreakdown,
  isTaskBreakdownEnabled,
} from '@/lib/ai/task-breakdown';
import { chatRequestSchema } from '@/lib/api/validation';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import {
  resolveFinancialDatasetsApiKey,
  resolveOpenAIApiKey,
} from '@/lib/server/api-keys';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { FinancialToolsManager } from '@/lib/ai/tools/financial-tools';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = chatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const {
      id,
      messages,
      modelId,
      financialDatasetsApiKey,
      modelApiKey,
    } = parsed.data;

    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const rateLimit = await checkRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return new Response('Rate limit exceeded. Please try again later.', {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      });
    }

    const model = models.find((entry) => entry.id === modelId);

    if (!model) {
      return new Response('Model not found', { status: 404 });
    }

    const resolvedModelApiKey = resolveOpenAIApiKey(modelApiKey);
    const resolvedFinancialApiKey =
      resolveFinancialDatasetsApiKey(financialDatasetsApiKey);

    if (!resolvedModelApiKey) {
      return new Response('Model API key is required', { status: 400 });
    }

    if (!resolvedFinancialApiKey) {
      return new Response('Financial Datasets API key is required', {
        status: 400,
      });
    }

    const coreMessages = convertToCoreMessages(messages as Array<Message>);
    const userMessage = getMostRecentUserMessage(coreMessages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const originalUserContent =
      typeof userMessage.content === 'string'
        ? userMessage.content
        : JSON.stringify(userMessage.content);

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
        modelApiKey: resolvedModelApiKey,
      });
      await saveChat({ id, userId: session.user.id, title });
    } else if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessageId = generateUUID();

    await saveMessages({
      messages: [
        { ...userMessage, id: userMessageId, createdAt: new Date(), chatId: id },
      ],
    });

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const financialToolsManager = new FinancialToolsManager({
          financialDatasetsApiKey: resolvedFinancialApiKey,
          dataStream,
        });

        dataStream.writeData({
          type: 'user-message-id',
          content: userMessageId,
        });

        dataStream.writeData({
          type: 'query-loading',
          content: {
            isLoading: true,
            taskNames: [],
          },
        });

        let taskNames: string[] = [];

        if (isTaskBreakdownEnabled()) {
          taskNames = await generateTaskBreakdown({
            query: originalUserContent,
            modelApiKey: resolvedModelApiKey,
          });

          dataStream.writeData({
            type: 'query-loading',
            content: {
              isLoading: true,
              taskNames,
            },
          });
        } else {
          dataStream.writeData({
            type: 'query-loading',
            content: {
              isLoading: true,
              taskNames: ['Researching your question'],
            },
          });
        }

        let receivedFirstChunk = false;

        const coreMessagesWithTaskNames = [...coreMessages];
        const lastMessage =
          coreMessagesWithTaskNames[coreMessagesWithTaskNames.length - 1];

        if (
          isTaskBreakdownEnabled() &&
          coreMessagesWithTaskNames.length > 0 &&
          lastMessage?.role === 'user' &&
          taskNames.length > 0
        ) {
          coreMessagesWithTaskNames[coreMessagesWithTaskNames.length - 1] = {
            role: 'user',
            content: appendTaskBreakdownToUserMessage({
              originalUserContent,
              taskNames,
            }),
          };
        }

        const result = streamText({
          model: customModel(model.apiIdentifier, resolvedModelApiKey),
          tools: financialToolsManager.getTools(),
          system: systemPrompt,
          messages: coreMessagesWithTaskNames,
          maxSteps: 10,
          onChunk: (event) => {
            const isToolCall = event.chunk.type === 'tool-call';
            if (!receivedFirstChunk && !isToolCall) {
              receivedFirstChunk = true;
              dataStream.writeData({
                type: 'query-loading',
                content: {
                  isLoading: false,
                  taskNames: [],
                },
              });
            }
          },
        });

        result.mergeIntoDataStream(dataStream);

        const response = await result.response;

        if (session.user?.id) {
          try {
            const responseMessagesWithoutIncompleteToolCalls =
              sanitizeResponseMessages(response.messages);

            if (responseMessagesWithoutIncompleteToolCalls.length > 0) {
              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === 'assistant') {
                      dataStream.writeMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }

                    return {
                      id: messageId,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  },
                ),
              });
            }
          } catch (error) {
            console.error('Failed to save chat:', error);
          }
        }
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat || chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
