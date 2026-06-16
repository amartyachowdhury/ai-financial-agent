'use client';

import type { Attachment, ChatRequestOptions, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import { EducationalDisclaimer } from '@/components/educational-disclaimer';
import type { Vote } from '@/lib/db/schema';
import { fetcher, track } from '@/lib/utils';
import { shouldSendClientApiKeys } from '@/lib/server/api-keys-client';
import {
  getFinancialDatasetsApiKey,
  getLocalOpenAIApiKey,
} from '@/lib/db/api-keys';

import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const allowClientKeys = shouldSendClientApiKeys();
  const financialDatasetsApiKey = allowClientKeys
    ? getFinancialDatasetsApiKey()
    : undefined;
  const openAIApiKey = allowClientKeys ? getLocalOpenAIApiKey() : undefined;

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: {
      id,
      modelId: selectedModelId,
      ...(allowClientKeys
        ? { modelApiKey: openAIApiKey, financialDatasetsApiKey }
        : {}),
    },
    initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const handleFormSubmit = async (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    track('chat_message_submit');
    handleSubmit(event, chatRequestOptions);
  };

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <ChatHeader
        chatId={id}
        selectedModelId={selectedModelId}
        selectedVisibilityType={selectedVisibilityType}
        isReadonly={isReadonly}
      />

      <Messages
        chatId={id}
        isLoading={isLoading}
        votes={votes}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
      />

      <EducationalDisclaimer />

      <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
        {!isReadonly && (
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleFormSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        )}
      </form>
    </div>
  );
}
