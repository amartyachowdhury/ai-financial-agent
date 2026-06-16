import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthCheck } from '@/app/components/AuthCheck';

import { ThemeProvider } from '@/components/providers';
import { SessionProvider } from 'next-auth/react';
import { Analytics } from '@vercel/analytics/react';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.financialdatasets.ai'),
  title: 'Financial Datasets | Chat',
  description: 'Chat with financial datasets',
};