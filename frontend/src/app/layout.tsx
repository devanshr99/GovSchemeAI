import type { Metadata } from 'next';
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { NetworkBackground } from '../components/common/NetworkBackground';
import './globals.css';

export const metadata: Metadata = {
  title: 'GovSchemeAI | Government Schemes Discovery Platform',
  description: 'GovSchemeAI helps Indian citizens discover official government schemes, check eligibility with multi-criteria matching, and receive verified scheme guidance.',
  keywords: ['government schemes', 'India', 'scholarships', 'subsidies', 'pension', 'PM-KISAN', 'eligibility matching', 'Ministry schemes', 'Startup India'],
  openGraph: {
    title: 'GovSchemeAI | Government Schemes Discovery Platform',
    description: 'GovSchemeAI helps Indian citizens discover government schemes, check eligibility, and receive AI-powered recommendations instantly.',
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
    <html lang="en" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[#08090D] text-[#F5F5F7] selection:bg-purple-600/40 selection:text-purple-100 relative">
        <AppProvider>
          {/* Global Constellation Canvas Background */}
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
