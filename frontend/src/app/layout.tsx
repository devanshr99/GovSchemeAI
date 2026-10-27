import type { Metadata } from 'next';
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { NetworkBackground } from '../components/common/NetworkBackground';
import './globals.css';

export const metadata: Metadata = {
  title: 'GovSchemeAI | Government Benefits & Schemes Portal',
  description: 'GovSchemeAI helps Indian citizens discover official government welfare programs, evaluate multi-criteria eligibility in 60 seconds, and access verified application links.',
  keywords: ['government schemes', 'India', 'scholarships', 'subsidies', 'pension', 'PM-KISAN', 'eligibility matching', 'Ministry schemes', 'Startup India'],
  openGraph: {
    title: 'GovSchemeAI | Government Benefits & Schemes Portal',
    description: 'Discover relevant Indian government schemes, check eligibility, and understand required documents on an accessible public-service portal.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'GovSchemeAI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Noto+Sans+Devanagari:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[#F7F8F5] text-[#202820] selection:bg-[#E7F3EC] selection:text-[#176B52] relative overflow-x-hidden">
        <AppProvider>
          {/* Global Floating Animated Network Background */}
          <NetworkBackground />

          {/* Foreground Application Content */}
          <div className="relative z-10 flex min-h-screen flex-col justify-between">
            <Navbar />
            <main className="flex-1 flex flex-col justify-start">
              {children}
            </main>
            <Footer />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
