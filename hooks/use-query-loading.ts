'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

interface QueryLoadingState {
  isLoading: boolean;
  taskNames: string[];
}

const initialState: QueryLoadingState = {
  isLoading: false,
  taskNames: [],
};

type Selector<T> = (state: QueryLoadingState) => T;

function getQueryLoadingKey(chatId: string) {
  return `query-loading:${chatId}`;
}

export function useQueryLoadingSelector<Selected>(
  chatId: string,
  selector: Selector<Selected>,
) {
  const { data: loadingState } = useSWR<QueryLoadingState>(
    getQueryLoadingKey(chatId),
    null,
    {
      fallbackData: initialState,
    },
  );

  const selectedValue = useMemo(() => {
    if (!loadingState) return selector(initialState);
    return selector(loadingState);
  }, [loadingState, selector]);

  return selectedValue;
}

export function useQueryLoading(chatId: string) {
  const { data: loadingState, mutate: setLoadingState } =
    useSWR<QueryLoadingState>(getQueryLoadingKey(chatId), null, {
      fallbackData: initialState,
    });

  const state = useMemo(() => {
    if (!loadingState) return initialState;
    return loadingState;
  }, [loadingState]);

  const setQueryLoading = (isLoading: boolean, taskNames: string[] = []) => {
    setLoadingState({
      isLoading,
      taskNames,
    });
  };

  return { state, setQueryLoading };
}
