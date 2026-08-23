import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'GitGuard AI | Automated GitHub PR Review & Security Audit Bot',
  description: 'AI-Powered GitHub Bot & Web Dashboard leveraging BullMQ, Redis, Gemini LLM, and Octokit for automated code security audits and performance reviews.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-[#090d16] text-slate-100 antialiased">
        <Navigation />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
