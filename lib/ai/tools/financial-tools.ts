import { z } from 'zod';
import { validStockSearchFilters } from '@/lib/api/stock-filters';
import {
  fetchFinancialData,
  fetchFinancialDataNoCache,
  FinancialApiError,
} from '@/lib/ai/tools/financial-api';
import type { QueryLoadingContent, ToolLoadingContent } from '@/lib/types/data-stream';

export const financialTools = [
  'getStockPrices',
  'getIncomeStatements',
  'getBalanceSheets',
  'getCashFlowStatements',
  'getFinancialMetrics',
  'searchStocksByFilters',
  'getNews',
  'compareStocks',
] as const;

export type AllowedTools = (typeof financialTools)[number];

export interface FinancialToolsConfig {
  financialDatasetsApiKey: string;
  dataStream: {
    writeData: (data: {
      type: string;
      content: string | ToolLoadingContent | QueryLoadingContent;
    }) => void;
  };
}

function toolError(toolName: string, error: unknown): {
  error: true;
  tool: string;
  message: string;
} {
  const message =
    error instanceof FinancialApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Unknown error';

  return {
    error: true as const,
    tool: toolName,
    message,
  };
}

export class FinancialToolsManager {
  private toolResultCache = new Map<string, unknown>();
  private config: FinancialToolsConfig;

  constructor(config: FinancialToolsConfig) {
    this.config = config;
  }

  private getCachedOrExecute<T>(
    toolName: string,
    params: Record<string, unknown>,
    execute: () => Promise<T>,
  ): Promise<T | { error: true; tool: string; message: string }> {
    const key = JSON.stringify({ toolName, params });

    if (this.toolResultCache.has(key)) {
      return Promise.resolve(this.toolResultCache.get(key) as T);
    }

    return execute()
      .then((result) => {
        this.toolResultCache.set(key, result);
        return result;
      })
      .catch((error) => toolError(toolName, error));
  }

  public getTools() {
    const apiKey = this.config.financialDatasetsApiKey;

    return {
      getNews: {
        description:
          'Use this tool to get news and latest events for a company. This tool will return a list of news articles and events for a company. When using this tool, include dates in your output.',
        parameters: z.object({
          ticker: z
            .string()
            .describe('The ticker of the company to get news for'),
          limit: z
            .number()
            .optional()
            .default(5)
            .describe('The number of news articles to return'),
        }),
        execute: async ({
          ticker,
          limit,
        }: {
          ticker: string;
          limit?: number;
        }) => {
          return this.getCachedOrExecute(
            'getNews',
            { ticker, limit: limit ?? 5 },
            async () =>
              fetchFinancialData(
                `news-${ticker}-${limit ?? 5}`,
                `/news/?ticker=${ticker}&limit=${limit ?? 5}`,
                apiKey,
              ),
          );
        },
      },
      getStockPrices: {
        description:
          'Use this tool to get stock prices and market cap for a company. This tool will return a snapshot of the current price, market cap, and the historical prices over a given time period.',
        parameters: z.object({
          ticker: z
            .string()
            .describe('The ticker of the company to get historical prices for'),
          start_date: z
            .string()
            .optional()
            .describe('The start date for historical prices (YYYY-MM-DD)')
            .default(() => {
              const date = new Date();
              date.setMonth(date.getMonth() - 1);
              return date.toISOString().split('T')[0];
            }),
          end_date: z
            .string()
            .optional()
            .describe('The end date for historical prices (YYYY-MM-DD)')
            .default(() => new Date().toISOString().split('T')[0]),
          interval: z
            .enum(['second', 'minute', 'day', 'week', 'month', 'year'])
            .default('day')
            .describe(
              'The interval between price points (e.g. second, minute, day, week, month, year)',
            ),
          interval_multiplier: z
            .number()
            .default(1)
            .describe(
              'The multiplier for the interval (e.g. 1 for second, 60 for minute, 1 for day, 7 for week, 1 for month, 1 for year)',
            ),
        }),
        execute: async ({
          ticker,
          start_date,
          end_date,
          interval,
          interval_multiplier,
        }: {
          ticker: string;
          start_date?: string;
          end_date?: string;
          interval?: 'second' | 'minute' | 'day' | 'week' | 'month' | 'year';
          interval_multiplier?: number;
        }) => {
          return this.getCachedOrExecute(
            'getStockPrices',
            {
              ticker,
              start_date,
              end_date,
              interval,
              interval_multiplier,
            },
            async () => {
              const urlParams = new URLSearchParams({
                ticker,
                start_date: start_date || '',
                end_date: end_date || '',
                interval: interval || 'day',
                interval_multiplier: (interval_multiplier || 1).toString(),
              });

              const [snapshotData, historicalPricesData] = await Promise.all([
                fetchFinancialData(
                  `snapshot-${ticker}`,
                  `/prices/snapshot?ticker=${ticker}`,
                  apiKey,
                ),
                fetchFinancialData(
                  `prices-${ticker}-${urlParams}`,
                  `/prices/?${urlParams}`,
                  apiKey,
                ),
              ]);

              return {
                ticker,
                snapshot: snapshotData,
                historical: historicalPricesData,
              };
            },
          );
        },
      },
      getIncomeStatements: {
        description: 'Get the income statements of a company',
        parameters: z.object({
          ticker: z
            .string()
            .describe('The ticker of the company to get income statements for'),
          period: z
            .enum(['quarterly', 'annual', 'ttm'])
            .default('ttm')
            .describe('The period of the income statements to return'),
          limit: z
            .number()
            .min(4)
            .optional()
            .default(5)
            .describe('The number of income statements to return'),
          report_period_lte: z
            .string()
            .optional()
            .describe(
              'The less than or equal to date of the income statements to return.',
            ),
          report_period_gte: z
            .string()
            .optional()
            .describe(
              'The greater than or equal to date of the income statements to return.',
            ),
        }),
        execute: async (params: {
          ticker: string;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          const { ticker, period, limit, report_period_lte, report_period_gte } =
            params;
          return this.getCachedOrExecute(
            'getIncomeStatements',
            params,
            async () => {
              const searchParams = new URLSearchParams({
                ticker,
                period: period ?? 'ttm',
              });
              if (limit) searchParams.append('limit', limit.toString());
              if (report_period_lte)
                searchParams.append('report_period_lte', report_period_lte);
              if (report_period_gte)
                searchParams.append('report_period_gte', report_period_gte);

              return fetchFinancialData(
                `income-${searchParams}`,
                `/financials/income-statements/?${searchParams}`,
                apiKey,
              );
            },
          );
        },
      },
      getBalanceSheets: {
        description: 'Get the balance sheets of a company',
        parameters: z.object({
          ticker: z
            .string()
            .describe('The ticker of the company to get balance sheets for'),
          period: z
            .enum(['quarterly', 'annual', 'ttm'])
            .default('ttm')
            .describe('The period of the balance sheets to return'),
          limit: z
            .number()
            .min(4)
            .optional()
            .default(5)
            .describe('The number of balance sheets to return'),
          report_period_lte: z
            .string()
            .optional()
            .describe(
              'The less than or equal to date of the balance sheets to return.',
            ),
          report_period_gte: z
            .string()
            .optional()
            .describe(
              'The greater than or equal to date of the balance sheets to return.',
            ),
        }),
        execute: async (params: {
          ticker: string;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          const { ticker, period, limit, report_period_lte, report_period_gte } =
            params;
          return this.getCachedOrExecute(
            'getBalanceSheets',
            params,
            async () => {
              const searchParams = new URLSearchParams({
                ticker,
                period: period ?? 'ttm',
              });
              if (limit) searchParams.append('limit', limit.toString());
              if (report_period_lte)
                searchParams.append('report_period_lte', report_period_lte);
              if (report_period_gte)
                searchParams.append('report_period_gte', report_period_gte);

              return fetchFinancialData(
                `balance-${searchParams}`,
                `/financials/balance-sheets/?${searchParams}`,
                apiKey,
              );
            },
          );
        },
      },
      getCashFlowStatements: {
        description: 'Get the cash flow statements of a company',
        parameters: z.object({
          ticker: z
            .string()
            .describe(
              'The ticker of the company to get cash flow statements for',
            ),
          period: z
            .enum(['quarterly', 'annual', 'ttm'])
            .default('ttm')
            .describe('The period of the cash flow statements to return'),
          limit: z
            .number()
            .min(4)
            .optional()
            .default(5)
            .describe('The number of cash flow statements to return'),
          report_period_lte: z
            .string()
            .optional()
            .describe(
              'The less than or equal to date of the cash flow statements to return.',
            ),
          report_period_gte: z
            .string()
            .optional()
            .describe(
              'The greater than or equal to date of the cash flow statements to return.',
            ),
        }),
        execute: async (params: {
          ticker: string;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          const { ticker, period, limit, report_period_lte, report_period_gte } =
            params;
          return this.getCachedOrExecute(
            'getCashFlowStatements',
            params,
            async () => {
              const searchParams = new URLSearchParams({
                ticker,
                period: period ?? 'ttm',
              });
              if (limit) searchParams.append('limit', limit.toString());
              if (report_period_lte)
                searchParams.append('report_period_lte', report_period_lte);
              if (report_period_gte)
                searchParams.append('report_period_gte', report_period_gte);

              return fetchFinancialData(
                `cashflow-${searchParams}`,
                `/financials/cash-flow-statements/?${searchParams}`,
                apiKey,
              );
            },
          );
        },
      },
      getFinancialMetrics: {
        description:
          'Get the financial metrics of a company. These financial metrics are derived metrics like P/E ratio, operating income, etc. that cannot be found in the income statement, balance sheet, or cash flow statement.',
        parameters: z.object({
          ticker: z
            .string()
            .describe('The ticker of the company to get financial metrics for'),
          period: z
            .enum(['quarterly', 'annual', 'ttm'])
            .default('ttm')
            .describe('The period of the financial metrics to return'),
          limit: z
            .number()
            .min(4)
            .optional()
            .default(5)
            .describe('The number of financial metrics to return'),
          report_period_lte: z
            .string()
            .optional()
            .describe(
              'The less than or equal to date of the financial metrics to return.',
            ),
          report_period_gte: z
            .string()
            .optional()
            .describe(
              'The greater than or equal to date of the financial metrics to return.',
            ),
        }),
        execute: async (params: {
          ticker: string;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
          report_period_lte?: string;
          report_period_gte?: string;
        }) => {
          const { ticker, period, limit, report_period_lte, report_period_gte } =
            params;
          return this.getCachedOrExecute(
            'getFinancialMetrics',
            params,
            async () => {
              const searchParams = new URLSearchParams({
                ticker,
                period: period ?? 'ttm',
              });
              if (limit) searchParams.append('limit', limit.toString());
              if (report_period_lte)
                searchParams.append('report_period_lte', report_period_lte);
              if (report_period_gte)
                searchParams.append('report_period_gte', report_period_gte);

              return fetchFinancialData(
                `metrics-${searchParams}`,
                `/financial-metrics/?${searchParams}`,
                apiKey,
              );
            },
          );
        },
      },
      searchStocksByFilters: {
        description:
          'Search for stocks based on financial criteria. Use this tool when asked to find or screen stocks based on financial metrics like revenue, net income, debt, etc.',
        parameters: z.object({
          filters: z
            .array(
              z.object({
                field: z.enum(validStockSearchFilters as [string, ...string[]]),
                operator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
                value: z.number(),
              }),
            )
            .describe('The filters to search for'),
          period: z
            .enum(['quarterly', 'annual', 'ttm'])
            .optional()
            .describe('The period of the financial metrics to return'),
          limit: z
            .number()
            .optional()
            .default(5)
            .describe('The number of stocks to return'),
          order_by: z
            .enum(['-report_period', 'report_period'])
            .optional()
            .default('-report_period')
            .describe('The order of the stocks to return'),
        }),
        execute: async ({
          filters,
          period,
          limit,
        }: {
          filters: Array<{
            field: string;
            operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
            value: number;
          }>;
          period?: 'quarterly' | 'annual' | 'ttm';
          limit?: number;
        }) => {
          return this.getCachedOrExecute(
            'searchStocksByFilters',
            { filters, period, limit },
            async () => {
              this.config.dataStream.writeData({
                type: 'tool-loading',
                content: {
                  tool: 'searchStocksByFilters',
                  isLoading: true,
                  message: 'Searching for stocks matching your criteria...',
                },
              });

              const body = {
                filters,
                period: period ?? 'ttm',
                limit: limit ?? 5,
              };

              const data = await fetchFinancialDataNoCache(
                '/financials/search/',
                apiKey,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                },
              );

              this.config.dataStream.writeData({
                type: 'tool-loading',
                content: {
                  tool: 'searchStocksByFilters',
                  isLoading: false,
                  message: null,
                },
              });

              return data;
            },
          );
        },
      },
      compareStocks: {
        description:
          'Compare financial metrics across 2-4 stock tickers side by side. Use when the user asks to compare companies or evaluate multiple stocks.',
        parameters: z.object({
          tickers: z
            .array(z.string())
            .min(2)
            .max(4)
            .describe('The tickers to compare (2-4)'),
          period: z
            .enum(['quarterly', 'annual', 'ttm'])
            .default('ttm')
            .describe('The period of the financial metrics to compare'),
        }),
        execute: async ({
          tickers,
          period,
        }: {
          tickers: string[];
          period?: 'quarterly' | 'annual' | 'ttm';
        }) => {
          return this.getCachedOrExecute(
            'compareStocks',
            { tickers, period },
            async () => {
              const results = await Promise.all(
                tickers.map(async (ticker) => {
                  const searchParams = new URLSearchParams({
                    ticker,
                    period: period ?? 'ttm',
                    limit: '1',
                  });
                  const data = (await fetchFinancialData(
                    `compare-metrics-${searchParams}`,
                    `/financial-metrics/?${searchParams}`,
                    apiKey,
                  )) as { financial_metrics?: Array<Record<string, unknown>> };

                  return {
                    ticker,
                    metrics: data.financial_metrics?.[0] ?? null,
                  };
                }),
              );

              return {
                period: period ?? 'ttm',
                comparisons: results,
              };
            },
          );
        },
      },
    };
  }
}
