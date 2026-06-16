'use client';

import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Download } from 'lucide-react';
import { Blue, Green } from './styles/colors';
import { exportToCsv } from '@/lib/utils/export-csv';
import { Button } from './ui/button';

interface ComparisonEntry {
  ticker: string;
  metrics: Record<string, unknown> | null;
}

interface ComparisonTableProps {
  data: {
    period: string;
    comparisons: ComparisonEntry[];
  };
}

function formatMetricValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(value) < 1 && value !== 0) {
      return value.toFixed(4);
    }
    return value.toLocaleString();
  }
  if (typeof value === 'string' && value.includes('T')) {
    try {
      return format(new Date(value), 'MMM d, yyyy');
    } catch {
      return value;
    }
  }
  return String(value);
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  const { comparisons, period } = data;

  if (!comparisons?.length) return null;

  const metricKeys = Array.from(
    new Set(
      comparisons.flatMap((entry) =>
        entry.metrics ? Object.keys(entry.metrics) : [],
      ),
    ),
  ).filter(
    (key) =>
      !['ticker', 'calendar_date', 'report_period', 'period', 'currency'].includes(
        key,
      ),
  );

  const tickers = comparisons.map((entry) => entry.ticker);

  const handleExport = () => {
    const rows = metricKeys.map((metric) => {
      const row: Record<string, unknown> = { metric };
      for (const entry of comparisons) {
        row[entry.ticker] = entry.metrics?.[metric] ?? '';
      }
      return row;
    });
    exportToCsv(rows, `stock-comparison-${tickers.join('-')}.csv`);
  };

  return (
    <Accordion type="single" collapsible defaultValue="comparison">
      <AccordionItem value="comparison" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="size-4"
              style={{ color: Green }}
            />
            <span className="font-medium">
              Stock Comparison ({tickers.join(' vs ')}) — {period.toUpperCase()}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="mb-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: Blue }}>Metric</TableHead>
                  {tickers.map((ticker) => (
                    <TableHead key={ticker} style={{ color: Blue }}>
                      {ticker}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricKeys.map((metric) => (
                  <TableRow key={metric}>
                    <TableCell className="font-medium">
                      {metric.replace(/_/g, ' ')}
                    </TableCell>
                    {comparisons.map((entry) => (
                      <TableCell key={`${entry.ticker}-${metric}`}>
                        {formatMetricValue(entry.metrics?.[metric])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
