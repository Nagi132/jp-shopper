import './globals.css';
import './win2k.css'; // Import Windows 2000 styles
import { futuraCyrillicLight, futuraCyrillicMedium, futuraCyrillicBold } from '@/lib/fonts';

export const metadata = {
  title: 'JapanShopper - Windows 2000 Edition',
  description: 'Connect with personal shoppers in Japan for exclusive items',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${futuraCyrillicMedium.variable} ${futuraCyrillicLight.variable} ${futuraCyrillicBold.variable}`}>
      <body className="min-h-screen font-futura-medium transition-colors duration-300 ease-in-out cursor-win-default">
        {children}
      </body>
    </html>
  );
}