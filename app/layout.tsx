import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/context/AuthContext';
import Navbar from './components/Navbar';

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const lato = Lato({
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: "SnapEvent - Capture & Share Your Special Moments",
  description: "Create beautiful events and share cherished memories with your loved ones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lato.variable} font-sans antialiased`}>
        <div className="memory-background-pattern" />
        <div className="memory-sparkle" style={{ top: '10%', left: '20%' }} />
        <div className="memory-sparkle" style={{ top: '30%', left: '70%' }} />
        <div className="memory-sparkle" style={{ top: '70%', left: '30%' }} />
        <div className="memory-sparkle" style={{ top: '80%', left: '80%' }} />
        <AuthProvider>
          <div className="min-h-screen flex flex-col relative z-10">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
