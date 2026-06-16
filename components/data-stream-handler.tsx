'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { useUserMessageId } from '@/hooks/use-user-message-id';
import { useToolLoading } from '@/hooks/use-tool-loading';
import { useQueryLoading } from '@/hooks/use-query-loading';
import type {
  DataStreamDelta,
  QueryLoadingContent,
  ToolLoadingContent,
} from '@/lib/types/data-stream';

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { setUserMessageIdFromServer } = useUserMessageId();
  const { setToolLoading } = useToolLoading(id);
  const { setQueryLoading } = useQueryLoading(id);
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      if (delta.type === 'user-message-id') {
        setUserMessageIdFromServer(delta.content as string);
        return;
      }

      if (delta.type === 'tool-loading') {
        const { tool, isLoading, message } =
          delta.content as ToolLoadingContent;
        setToolLoading(tool, isLoading, message);
        return;
      }

      if (delta.type === 'query-loading') {
        const { isLoading, taskNames } = delta.content as QueryLoadingContent;
        setQueryLoading(isLoading, taskNames);
      }
    });
  }, [
    dataStream,
    setUserMessageIdFromServer,
    setToolLoading,
    setQueryLoading,
  ]);

  return null;
}
