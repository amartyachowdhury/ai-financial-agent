import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

import { AuthCheck } from '@/app/components/AuthCheck';
import { Providers } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.financialdatasets.ai'),
  title: 'Financial Datasets | Chat',
  description: 'Chat with financial datasets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <AuthCheck />
          {children}
          <Toaster position="top-center" />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
