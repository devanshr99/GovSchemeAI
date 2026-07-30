import type { Metadata } from 'next';
import { AppProvider } from '../context/AppContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'GovSchemeAI | AI Powered Government Scheme Finder',
  description: 'GovSchemeAI helps Indian citizens discover government schemes, check eligibility, and receive AI-powered recommendations instantly.',
  keywords: ['government schemes', 'India', 'scholarships', 'subsidies', 'pension', 'PM-KISAN', 'eligibility matching'],
  openGraph: {
    title: 'GovSchemeAI | AI Powered Government Scheme Finder',
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
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[#0f172a] text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
        <AppProvider>
          <Navbar />
          <main className="flex-1 flex flex-col justify-start">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
