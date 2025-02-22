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
  title: "SnapEvent - Share Your Moments",
  description: "Create events and share photos with your guests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lato.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
