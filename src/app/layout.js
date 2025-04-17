import './globals.css';
import './win2k.css';
import './win-cursors.css'
import { futuraCyrillicLight, futuraCyrillicMedium, futuraCyrillicBold } from '@/lib/fonts';
import { AppProvider } from '@/contexts/AppContext';

export const metadata = {
  title: 'JapanShopper - Windows 2000 Edition',
  description: 'Connect with personal shoppers in Japan for exclusive items',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${futuraCyrillicMedium.variable} ${futuraCyrillicLight.variable} ${futuraCyrillicBold.variable}`}>
      <body className="min-h-screen font-futura-medium transition-colors duration-300 ease-in-out cursor-win-default">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}