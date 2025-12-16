import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { AIEngineInitializer } from '@/components/ai/ai-engine-initializer';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SLICT ERP',
  description: 'Complete Multi-Tenant SaaS ERP System',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className={`${inter.className} antialiased h-full`} suppressHydrationWarning>
        <AIEngineInitializer />
        <NextIntlClientProvider messages={messages}>
          <SettingsProvider>
            <SessionProvider>{children}</SessionProvider>
          </SettingsProvider>
        </NextIntlClientProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
