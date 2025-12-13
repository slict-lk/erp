import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { AIEngineInitializer } from '@/components/ai/ai-engine-initializer';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SLICT ERP 2025',
  description: 'Complete Multi-Tenant SaaS ERP System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} antialiased h-full`} suppressHydrationWarning>
        <AIEngineInitializer />
        <SettingsProvider>
          <SessionProvider>{children}</SessionProvider>
        </SettingsProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
