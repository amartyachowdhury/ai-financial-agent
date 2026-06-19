'use client';

import { format } from 'date-fns';
import Link from 'next/link';
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
import { Download, ExternalLink } from 'lucide-react';
import { Green } from '@/components/styles/colors';
import { exportToCsv } from '@/lib/utils/export-csv';
import { Button } from './button';

interface Filing {
  cik?: number;
  accession_number?: string;
  filing_type?: string;
  report_date?: string;
  filed_at?: string;
  ticker?: string;
  url?: string;
  description?: string;
}

interface SecFilingsProps {
  data: {
    filings?: Filing[];
  };
  ticker?: string;
}

export function SecFilings({ data, ticker }: SecFilingsProps) {
  const filings = data.filings ?? [];
  if (filings.length === 0) return null;

  const displayTicker = ticker ?? filings[0]?.ticker ?? 'Company';

  const handleExport = () => {
    exportToCsv(
      filings.map((filing) => ({
        ticker: filing.ticker ?? displayTicker,
        filing_type: filing.filing_type ?? '',
        report_date: filing.report_date ?? filing.filed_at ?? '',
        accession_number: filing.accession_number ?? '',
        url: filing.url ?? '',
      })),
      `${displayTicker}-sec-filings.csv`,
    );
  };

  return (
    <Accordion type="single" collapsible defaultValue="sec-filings">
      <AccordionItem value="sec-filings" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="size-4"
              style={{ color: Green }}
            />
            <span className="font-medium">{displayTicker} (SEC Filings)</span>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filings.map((filing, index) => {
                  const dateStr = filing.report_date ?? filing.filed_at;
                  return (
                    <TableRow key={filing.accession_number ?? index}>
                      <TableCell className="font-medium">
                        {filing.filing_type ?? '—'}
                      </TableCell>
                      <TableCell>
                        {dateStr
                          ? format(new Date(dateStr), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {filing.description ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {filing.url ? (
                          <Link
                            href={filing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            View
                            <ExternalLink className="size-3" />
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
