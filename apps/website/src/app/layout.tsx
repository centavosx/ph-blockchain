import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { AppSidebar } from '@/components/app/sidebar';

import { Header } from '@/components/app/header';

import { BaseApi } from '@ph-blockchain/api';
import { generateToken } from '@/lib/server/generate-tokens';
import { headers } from 'next/headers';
import { Providers } from '@/components/provider';
import { Config } from '@/constants/config';

BaseApi.init(Config.serverApiBaseUrl)
  .setGetToken(generateToken)
  .headers.setUserAgent(Config.userAgent);

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce');

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full flex flex-col`}
      >
        <Providers nonce={nonce}>
          <AppSidebar />
          <main className="flex flex-col w-full">
            <Header />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
