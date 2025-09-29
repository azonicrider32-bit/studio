import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })


export const metadata: Metadata = {
  title: 'ProSegment AI',
  description: 'Advanced Segmentation App by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(
        "font-body antialiased",
        inter.variable,
        spaceGrotesk.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
