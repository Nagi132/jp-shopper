import './globals.css';
import './win2k.css';
import './win-cursors.css'
import { futuraCyrillicLight, futuraCyrillicMedium, futuraCyrillicBold } from '@/lib/fonts';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/components/layouts/ThemeProvider';
import ThemeComponents from '@/components/layouts/ThemeComponents';
import { MessageBoxProvider } from '@/components/windows/MessageBoxProvider';

export const metadata = {
  title: 'JapanShopper - Windows 2000 Edition',
  description: 'Connect with personal shoppers in Japan for exclusive items',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${futuraCyrillicMedium.variable} ${futuraCyrillicLight.variable} ${futuraCyrillicBold.variable}`}>
      <body className="min-h-screen font-futura-medium transition-colors duration-300 ease-in-out cursor-win-default">
        <ThemeProvider>
          <MessageBoxProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </MessageBoxProvider>
          <ThemeComponents />
        </ThemeProvider>
      </body>
    </html>
  );
}