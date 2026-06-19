'use client';

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
import { Green } from '@/components/styles/colors';

interface CompanyResult {
  ticker: string;
  name?: string;
  market_cap?: number;
  sic_description?: string;
  is_active?: boolean;
}

interface CompanySearchProps {
  data: {
    query?: string;
    results?: CompanyResult[];
  };
}

function formatMarketCap(value?: number): string {
  if (value === undefined || value === null) return '—';
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

export function CompanySearch({ data }: CompanySearchProps) {
  const results = data.results ?? [];
  if (results.length === 0) return null;

  const query = data.query ?? '';

  return (
    <Accordion type="single" collapsible defaultValue="company-search">
      <AccordionItem value="company-search" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="size-4"
              style={{ color: Green }}
            />
            <span className="font-medium">
              Company Search{query ? `: "${query}"` : ''}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Market Cap</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((company) => (
                  <TableRow key={company.ticker}>
                    <TableCell className="font-medium">
                      {company.ticker}
                    </TableCell>
                    <TableCell>{company.name ?? '—'}</TableCell>
                    <TableCell>{company.sic_description ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {formatMarketCap(company.market_cap)}
                    </TableCell>
                    <TableCell>
                      {company.is_active === false ? 'Delisted' : 'Active'}
                    </TableCell>
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
