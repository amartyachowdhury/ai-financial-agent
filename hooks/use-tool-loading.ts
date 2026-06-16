'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

type ToolName =
  | 'searchStocksByFilters'
  | 'getStockPrices'
  | 'getIncomeStatements'
  | 'getBalanceSheets'
  | 'getCashFlowStatements'
  | 'getFinancialMetrics'
  | 'compareStocks'
  | 'getNews';

interface ToolLoadingState {
  [key: string]: {
    loading: boolean;
    message?: string;
  };
}

const initialState: ToolLoadingState = {
  searchStocksByFilters: { loading: false },
  getStockPrices: { loading: false },
  getIncomeStatements: { loading: false },
  getBalanceSheets: { loading: false },
  getCashFlowStatements: { loading: false },
  getFinancialMetrics: { loading: false },
  compareStocks: { loading: false },
  getNews: { loading: false },
};

type Selector<T> = (state: ToolLoadingState) => T;

function getToolLoadingKey(chatId: string) {
  return `tool-loading:${chatId}`;
}

export function useToolLoadingSelector<Selected>(
  chatId: string,
  selector: Selector<Selected>,
) {
  const { data: loadingState } = useSWR<ToolLoadingState>(
    getToolLoadingKey(chatId),
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

export function useToolLoading(chatId: string) {
  const { data: loadingState, mutate: setLoadingState } =
    useSWR<ToolLoadingState>(getToolLoadingKey(chatId), null, {
      fallbackData: initialState,
    });

  const state = useMemo(() => {
    if (!loadingState) return initialState;
    return loadingState;
  }, [loadingState]);

  const setToolLoading = (
    tool: ToolName | string,
    isLoading: boolean,
    message?: string | null,
  ) => {
    setLoadingState((currentState) => ({
      ...(currentState ?? initialState),
      [tool]: { loading: isLoading, message: message ?? undefined },
    }));
  };

  return { state, setToolLoading };
}
