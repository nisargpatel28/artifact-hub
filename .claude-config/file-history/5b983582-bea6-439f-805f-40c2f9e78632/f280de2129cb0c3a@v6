import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Artifact Hub', template: '%s â€” Artifact Hub' },
  description: 'Browse and share AI-generated content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased">
        <Providers>
          <Navbar />
          {/* Push content below the fixed navbar */}
          <div className="pt-14">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

